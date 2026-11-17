// Build-time only. No provider calls, credentials, preflight receipts or runtime git dependency.
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
export const policySources = [
  'scripts/ai/package-image-policy.mjs',
  'src/lib/ai/image-capability.mjs',
  'src/lib/ai/fixture-database.mjs',
  'src/lib/ai/assistant/image-context.ts',
  'src/lib/ai/rpc/confinement.mjs',
  'src/lib/ai/assistant/runtime.ts',
  'src/lib/ai/assistant/handlers.ts',
  'src/lib/ai/assistant/analyst/tools.ts',
  'scripts/ai/assistant-tools.mjs',
];
export function packageImagePolicy(root, buildId, source) {
  const manifest = {
    schemaVersion: 1,
    buildId,
    source,
    files: Object.fromEntries(
      policySources.map(file => [
        file,
        createHash('sha256')
          .update(readFileSync(join(root, file)))
          .digest('hex'),
      ]),
    ),
  };
  const text = JSON.stringify(manifest) + '\n';
  const directory = join(root, 'generated');
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'analyst-image-policy.json'), text);
  // Standalone is assembled by Next after generateBuildId. Output tracing includes the canonical
  // manifest; Docker also already copies /app/generated. Non-standalone starts use root/generated.
  if (existsSync(join(root, '.next/standalone'))) {
    const standalone = join(root, '.next/standalone/generated');
    mkdirSync(standalone, { recursive: true });
    writeFileSync(join(standalone, 'analyst-image-policy.json'), text);
  }
  return manifest;
}
