import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { qualifiedBrowserEvidence, lifecycleBrowserAssertions } from './lifecycle-evidence';
import { policySources } from '../package-image-policy.mjs';
import { verifierImageFiles, verifierBuildFiles } from './verifier-image';
import { pairedBrowserReports } from './browser-commands';
export const browserSourceFiles = [
  ...new Set([
    ...policySources,
    ...verifierImageFiles,
    ...verifierBuildFiles,
    'scripts/ai/analyst-evals/verifier-image.ts',
    'scripts/ai/analyst-evals/browser-commands.ts',
    ...lifecycleBrowserAssertions.map(a => a.file),
    'tests/e2e/analyst-update-notice.spec.ts',
    'tests/e2e/helpers.ts',
    'playwright.config.ts',
    'next.config.ts',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'package.json',
    'scripts/ai/analyst-evals/package-proof.ts',
    'scripts/ai/analyst-evals/standalone-smoke.mjs',
    'scripts/ai/analyst-evals/browser-proof.ts',
    'scripts/ai/analyst-evals/browser-receipt.ts',
    'scripts/ai/analyst-evals/lifecycle-evidence.ts',
    'scripts/ai/analyst-fixture/app.mjs',
    'scripts/ai/analyst-fixture/database.mjs',
    'scripts/ai/analyst-fixture/startup.mjs',
    'scripts/ai/analyst-fixture/seed.sql',
    'scripts/ai/analyst-fixture/offline-provider.mjs',
  ]),
];
export function browserFingerprintedFiles() {
  const files = [...browserSourceFiles];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (['node_modules', 'dist', 'generated', '.next'].includes(entry.name)) continue;
      const file = path.posix.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && !entry.name.startsWith('.env')) files.push(file);
    }
  };
  // Include actual renderers, routes, permissions, DB schema and local workspace packages,
  // not only gate modules. Exclude generated/dependency artifacts tracked separately at build.
  for (const directory of ['src', 'packages', 'prisma', 'db']) visit(directory);
  return [...new Set(files)].sort();
}
/** Reuse only a completed locally executed browser receipt with every exact source fingerprint.
 * Receipt remains operator-controlled evidence, not a signed authenticity assertion.
 */
export function browserReceiptEvidence(receipt: any, hash: (file: string) => string) {
  assert.equal(receipt?.complete, true, 'incomplete browser receipt');
  assert.ok(
    receipt.sourceHashes && Object.keys(receipt.sourceHashes).length > 0,
    'missing browser fingerprints',
  );
  for (const file of browserFingerprintedFiles())
    assert.ok(
      typeof receipt.sourceHashes[file] === 'string',
      `missing browser fingerprint ${file}`,
    );
  for (const [file, expected] of Object.entries(receipt.sourceHashes))
    assert.equal(hash(file), expected, `browser source fingerprint ${file}`);
  assert.match(
    receipt.verifierImage?.imageId ?? '',
    /^sha256:[a-f0-9]{64}$/,
    'missing immutable verifier image',
  );
  for (const file of verifierImageFiles)
    assert.equal(
      receipt.verifierImage.fileHashes?.[file],
      hash(file),
      `image source mismatch ${file}`,
    );
  for (const file of verifierBuildFiles)
    assert.equal(
      receipt.verifierImage.buildDefinitionHashes?.[file],
      hash(file),
      `missing build definition ${file}`,
    );
  for (const command of receipt.commands ?? [])
    assert.equal(
      command.verifierImageId,
      receipt.verifierImage.imageId,
      'command verifier image mismatch',
    );
  const extracted = pairedBrowserReports(receipt).flatMap(entry =>
    qualifiedBrowserEvidence(entry.report, entry.commandPassed),
  );
  const assertions = lifecycleBrowserAssertions
    .filter(b =>
      extracted.some(
        (e: any) => e.suite === b.suite && e.passed && e.assertions.includes(b.assertion),
      ),
    )
    .map(b => b.assertion);
  assert.equal(assertions.length, lifecycleBrowserAssertions.length, 'missing browser assertions');
  return { suite: 'lifecycle-browser', passed: true, assertions };
}
export const fileSha256 = (file: string) =>
  createHash('sha256').update(readFileSync(file)).digest('hex');
