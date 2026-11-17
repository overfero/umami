import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import {
  apiEvidence,
  vitestEvidence,
  summarizeCoverage,
  requirements,
  type Evidence,
} from './offline';
import { authorityEvidence, authorityPgRequirements, reusableAuthorityAssertions } from './authority-evidence';
import { verifierImageFiles, verifierBuildFiles } from './verifier-image';
import {
  qualifiedVitestEvidence,
  qualifiedBrowserEvidence,
  lifecycleAssertions,
  lifecycleBrowserAssertions,
} from './lifecycle-evidence';
import { pairedBrowserReports } from './browser-commands';

/** Reconstruct historical evidence, never trust its supplied coverage declaration.
 * Vitest stdout names a report file rather than containing its bytes: this verifies the
 * command/file/source/assertion association, not operator-authenticated report provenance.
 */
export function qualifyStrictReceipt(receipt: any, hash: (file: string) => string) {
  assert.equal(receipt.complete, true);
  assert.ok(Object.keys(receipt.sourceHashes ?? {}).length > 0);
  for (const source of [
    'scripts/test-analyst-api.ts', 'scripts/ai/analyst-evals/dashboard.ts', 'scripts/ai/analyst-evals/authority.ts',
    'scripts/ai/analyst-evals/numeric-render.test.tsx', 'scripts/ai/analyst-evals/missing-metric.test.ts', 'scripts/ai/analyst-evals/generic-authority.test.ts',
    ...lifecycleAssertions.map(a => a.file), ...reusableAuthorityAssertions.map(a => a.file),
  ]) assert.ok(receipt.sourceHashes[source], `missing assertion source ${source}`);
  for (const [file, expected] of Object.entries(receipt.sourceHashes))
    assert.equal(hash(file), expected, file);
  const evidence: Evidence[] = [];
  const commands = receipt.commands;
  assert.equal(commands?.length, 14, 'expected fourteen commands');
  let index = 0;
  function take(command: string, timezone: string) {
    const actual = commands[index++];
    assert.equal(actual.command, command, 'unexpected command inventory/order');
    assert.equal(actual.timezone, timezone);
    assert.equal(actual.exitCode, 0);
    assert.equal(actual.passed, true);
    return actual.output as string;
  }
  function scripted(output: string, suite: string): Evidence {
    const lines = output.split('\n').filter(line => line.startsWith('EVIDENCE '));
    assert.equal(lines.length, 1, 'missing/duplicate evidence output');
    const parsed = JSON.parse(lines[0].slice(9));
    assert.equal(parsed.suite, suite);
    assert.equal(parsed.passed, true);
    const assertions = output
      .split('\n')
      .filter(line => line.startsWith('ASSERTION '))
      .map(line => line.slice(10));
    assert.ok(
      isDeepStrictEqual([...parsed.assertions].sort(), [...assertions].sort()),
      'assertions differ from stdout',
    );
    return { suite, passed: true, assertions };
  }
  for (const engine of ['postgres', 'clickhouse']) {
    const api = apiEvidence(
      engine,
      take(`tsx scripts/test-analyst-api.ts --${engine}`, '-c timezone=America/New_York'),
    );
    assert.equal(api.passed, true);
    evidence.push(api);
    const runs = ['UTC', 'Asia/Jakarta', 'America/New_York'].map(timezone =>
      scripted(
        take(`tsx scripts/ai/analyst-evals/dashboard.ts ${engine}`, `-c timezone=${timezone}`),
        `${engine}-supplement`,
      ),
    );
    evidence.push({
      suite: `${engine}-supplement`,
      passed: true,
      assertions: requirements
        .filter(r => r.suite === `${engine}-supplement`)
        .map(r => r.assertion)
        .filter(a => runs.every(r => r.assertions.includes(a))),
    });
  }
  const authority = ['UTC', 'Asia/Jakarta', 'America/New_York'].map(timezone =>
    scripted(
      take('tsx scripts/ai/analyst-evals/authority.ts', `-c timezone=${timezone}`),
      'authority-pg',
    ),
  );
  evidence.push({
    suite: 'authority-pg',
    passed: true,
    assertions: authorityPgRequirements
      .map(r => r.assertion)
      .filter(a => authority.every(r => r.assertions.includes(a))),
  });
  const reportSpecs = [
    ['vitestReport', 'vitest run -c scripts/ai/analyst-evals/vitest.config.ts', 'vitest.json'],
    [
      'lifecycleProductReport',
      'vitest run src/lib/ai/assistant/analyst/analyst.test.ts src/lib/ai/assistant/analyst/handlers.test.ts src/lib/ai/assistant/runtime.test.ts',
      'lifecycle-product.json',
    ],
    [
      'authorityVitestReport',
      'vitest run src/lib/analyst-verifier/authority.test.ts src/lib/analyst-verifier/port.test.ts',
      'authority-vitest.json',
    ],
  ];
  let directory: string | undefined;
  for (const [field, prefix, filename] of reportSpecs) {
    const command = commands[index];
    const escaped = filename.replace('.', '\\.');
    const match = command.command.match(
      new RegExp(
        `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} --reporter=json --outputFile=(/tmp/analyst-eval-[^/ ]+)/${escaped}$`,
      ),
    );
    assert.ok(match, 'wrong report command');
    directory ??= match[1];
    assert.equal(match[1], directory);
    const output = take(command.command, '');
    assert.equal(
      output.trim(),
      `JSON report written to ${directory}/${filename}`,
      'wrong stdout/report pairing',
    );
    const report = receipt[field];
    assert.equal(report?.success, true, `missing/failed ${field}`);
    assert.ok(report.testResults?.length > 0);
    for (const file of report.testResults) {
      const prefix = field === 'vitestReport' ? 'scripts/ai/analyst-evals/' : 'src/lib/';
      assert.ok(
        file.name.startsWith(`${receipt.browserReport.checkoutRoot}/${prefix}`),
        `unexpected report source ${file.name}`,
      );
    }
    if (field === 'vitestReport') {
      evidence.push(...vitestEvidence(report, true).evidence);
      evidence.push(
        ...qualifiedVitestEvidence(
          report,
          true,
          lifecycleAssertions.filter(r => r.suite === 'lifecycle-evaluator'),
        ),
      );
    } else if (field === 'lifecycleProductReport') {
      evidence.push(
        ...qualifiedVitestEvidence(
          report,
          true,
          lifecycleAssertions.filter(r => r.suite === 'lifecycle-product'),
        ),
      );
    } else evidence.push(authorityEvidence(report, true));
  }
  // This is historical qualification: validate its recorded source set, not a later
  // checkout's newly added files. Callers must explicitly distinguish source revisions.
  const browser = receipt.browserReport;
  assert.equal(browser?.complete, true);
  for (const [file, expected] of Object.entries(browser.sourceHashes ?? {}))
    assert.equal(hash(file), expected, file);
  for (const expected of lifecycleBrowserAssertions)
    assert.ok(browser.sourceHashes[expected.file], 'missing browser assertion source');
  assert.match(browser.verifierImage.imageId, /^sha256:[a-f0-9]{64}$/);
  for (const file of verifierImageFiles) assert.equal(browser.verifierImage.fileHashes[file], hash(file));
  for (const file of verifierBuildFiles) assert.equal(browser.verifierImage.buildDefinitionHashes[file], hash(file));
  for (const command of browser.commands)
    assert.equal(command.verifierImageId, browser.verifierImage.imageId);
  const browserEvidence = pairedBrowserReports(browser).flatMap(({ report, commandPassed }) =>
    qualifiedBrowserEvidence(report, commandPassed),
  );
  evidence.push({
    suite: 'lifecycle-browser',
    passed: true,
    assertions: lifecycleBrowserAssertions
      .filter(b =>
        browserEvidence.some(e => e.suite === b.suite && e.assertions.includes(b.assertion)),
      )
      .map(b => b.assertion),
  });
  const summary = summarizeCoverage(evidence);
  assert.equal(summary.pass, true, `missing reconstructed coverage: ${summary.pending}`);
  return { ...summary, evidence };
}
