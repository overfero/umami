/* eslint-disable no-console */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { apiEvidence, requirements, summarizeCoverage, type Evidence } from './offline';

export async function runOffline(strict: boolean, outputPath?: string) {
  const evidence: Evidence[] = [];
  const commands: { command: string; timezone: string; passed: boolean; output: string }[] = [];
  const checkpoint = () => {
    if (outputPath) writeFileSync(outputPath, `${JSON.stringify({ complete: false, evidence, commands }, null, 2)}\n`);
  };
  function execute(args: string[], env = process.env) {
    const command = args.join(' ');
    console.log(`RUN ${command}`);
    try {
      const output = execFileSync(path.resolve('node_modules/.bin', args[0]), args.slice(1), {
        encoding: 'utf8',
        env,
        timeout: 240_000,
        maxBuffer: 16 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      commands.push({ command, timezone: env.PGOPTIONS ?? '', passed: true, output });
      checkpoint();
      console.log(`DONE ${command} (${env.PGOPTIONS ?? 'default'})`);
      return output;
    } catch (error: any) {
      const output = `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
      commands.push({ command, timezone: env.PGOPTIONS ?? '', passed: false, output });
      checkpoint();
      console.error(output);
      return '';
    }
  }
  // The existing API regression deliberately requires a non-UTC connection. Keep it local to
  // these processes; never mutate the database/role defaults to make a test pass.
  const nonUtc = { ...process.env, PGOPTIONS: '-c timezone=America/New_York' };
  for (const engine of ['postgres', 'clickhouse']) {
    const output = execute(['tsx', 'scripts/test-analyst-api.ts', `--${engine}`], nonUtc);
    evidence.push(apiEvidence(engine, output));
    // Exact epochs and null coverage must hold regardless of connection timezone.
    for (const timezone of ['UTC', 'Asia/Jakarta', 'America/New_York']) {
      const output = execute(['tsx', 'scripts/ai/analyst-evals/dashboard.ts', engine], {
        ...process.env,
        PGOPTIONS: `-c timezone=${timezone}`,
      });
      const line = output.split('\n').find(s => s.startsWith('EVIDENCE '));
      if (line) {
        const receipt: Evidence = JSON.parse(line.slice('EVIDENCE '.length));
        assert.equal(receipt.suite, `${engine}-supplement`);
        // No one timezone can supply evidence for failed/missing executions in another.
        evidence.push({ ...receipt, suite: `${receipt.suite}-${timezone}` });
      }
    }
    const runs = ['UTC', 'Asia/Jakarta', 'America/New_York'].map(tz =>
      evidence.find(e => e.suite === `${engine}-supplement-${tz}`),
    );
    evidence.push({
      suite: `${engine}-supplement`,
      passed: runs.every(r => r?.passed),
      assertions: requirements
        .filter(r => r.suite === `${engine}-supplement`)
        .map(r => r.assertion)
        .filter(a => runs.every(r => r?.assertions.includes(a))),
    });
  }
  const temp = mkdtempSync(path.join(os.tmpdir(), 'analyst-eval-'));
  try {
    const jsonPath = path.join(temp, 'vitest.json');
    execute([
      'vitest',
      'run',
      '-c',
      'scripts/ai/analyst-evals/vitest.config.ts',
      '--reporter=json',
      `--outputFile=${jsonPath}`,
    ]);
    let assertions: { fullName: string; status: string }[] = [];
    try {
      assertions = JSON.parse(readFileSync(jsonPath, 'utf8')).testResults.flatMap(
        (r: any) => r.assertionResults,
      );
    } catch {
      /* Missing output remains missing evidence, never a pass. */
    }
    for (const suite of ['component', 'executor']) {
      const names = requirements.filter(r => r.suite === suite).map(r => r.assertion);
      evidence.push({
        suite,
        passed: commands.at(-1)!.passed,
        assertions: names.filter(name =>
          assertions.some(a => a.fullName === name && a.status === 'passed'),
        ),
      });
    }
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
  const summary = summarizeCoverage(evidence);
  const hash = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
  const sourceFiles = [
    'scripts/test-analyst-api.ts',
    'scripts/ai/analyst-evals/dashboard.ts',
    'scripts/ai/analyst-evals/offline.ts',
    'scripts/ai/analyst-evals/numeric-render.test.tsx',
    'scripts/ai/analyst-evals/missing-metric.test.ts',
    'src/lib/ai/assistant/analyst/deps.ts',
    'src/queries/sql/getWebsiteDateRange.ts',
  ];
  const report = {
    complete: true,
    mode: 'offline-scripted-no-model-no-browser',
    sourceRevision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    sourceDirty:
      execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0,
    observedAtJakarta: new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'full',
      timeStyle: 'long',
    }).format(new Date()),
    sourceHashes: Object.fromEntries(sourceFiles.map(file => [file, hash(file)])),
    fixtureHash: hash('scripts/ai/analyst-evals/dashboard.ts'),
    evidence,
    commands,
    ...summary,
    limitations: [
      'Scenarios 6–12 pending; strict E1 must fail.',
      'Scripted choices do not prove live model reasoning or image understanding.',
      'Component render and injected missing_metric evidence are not DB/browser evidence.',
    ],
  };
  if (outputPath) writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `Offline assertion coverage: proven=${summary.proven.join(',')} pending=${summary.pending.join(',')}`,
  );
  if (!summary.pass || commands.some(c => !c.passed)) {
    console.error('NOT PASS: required evidence missing or failed; no visual/live verified claim.');
    if (strict || commands.some(c => !c.passed)) process.exitCode = 1;
  } else
    console.log(
      'PASS: all twelve deterministic scenario groups have executed assertions (not live/visual verification).',
    );
  return report;
}
