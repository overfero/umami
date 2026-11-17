/* eslint-disable no-console */
import { authorityEvidence, authorityPgRequirements } from './authority-evidence';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { apiEvidence, requirements, summarizeCoverage, vitestEvidence, type Evidence } from './offline';

export async function runOffline(strict: boolean, outputPath?: string, reuseApiPath?: string) {
  const evidence: Evidence[] = [];
  const commands: { command: string; timezone: string; passed: boolean; exitCode?: number | null; output: string; reusedFrom?: string }[] = [];
  const hash = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
  const previous = reuseApiPath ? JSON.parse(readFileSync(reuseApiPath, 'utf8')) : null;
  if (previous) {
    assert.equal(previous.complete, true, 'cannot reuse interrupted evidence');
    for (const file of ['scripts/test-analyst-api.ts', 'src/lib/ai/assistant/analyst/deps.ts', 'src/queries/sql/getWebsiteDateRange.ts'])
      assert.equal(hash(file), previous.sourceHashes[file], `API source fingerprint ${file}`);
    const changed = execFileSync('git', ['diff', '--name-only', previous.sourceRevision, '--', 'src', 'prisma', 'db', 'scripts/test-analyst-api.ts'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    assert.ok(changed.every(file => ['src/lib/ai/assistant/analyst/deps.ts', 'src/queries/sql/getWebsiteDateRange.ts'].includes(file)), 'API dependencies changed since receipt; rerun instead');
  }
  const checkpoint = () => {
    if (outputPath)
      writeFileSync(
        outputPath,
        `${JSON.stringify({ complete: false, evidence, commands }, null, 2)}\n`,
      );
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
      commands.push({ command, timezone: env.PGOPTIONS ?? '', passed: true, exitCode: 0, output });
      checkpoint();
      console.log(`DONE ${command} (${env.PGOPTIONS ?? 'default'})`);
      return output;
    } catch (error: any) {
      const output = `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
      commands.push({ command, timezone: env.PGOPTIONS ?? '', passed: false, exitCode: error.status ?? null, output });
      checkpoint();
      console.error(output);
      throw new Error(`Command failed (exit ${error.status ?? 'unknown'}): ${command}; stopped, see checkpoint`);
    }
  }
  // The existing API regression deliberately requires a non-UTC connection. Keep it local to
  // these processes; never mutate the database/role defaults to make a test pass.
  const nonUtc = { ...process.env, PGOPTIONS: '-c timezone=America/New_York' };
  for (const engine of ['postgres', 'clickhouse']) {
    const args = ['tsx', 'scripts/test-analyst-api.ts', `--${engine}`];
    let output: string;
    if (previous) {
      const command = previous.commands.find((c: any) => c.command === args.join(' '));
      assert.equal(command?.passed, true);
      assert.equal(command.timezone, nonUtc.PGOPTIONS);
      assert.equal(apiEvidence(engine, command.output).passed, true);
      output = command.output;
      commands.push({ ...command, reusedFrom: `${reuseApiPath}#sha256=${hash(reuseApiPath!)}` });
      console.log(`REUSE source-qualified API receipt: ${engine}`);
      checkpoint();
    } else output = execute(args, nonUtc);
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
  const authorityRuns: Evidence[] = [];
  for (const timezone of ['UTC', 'Asia/Jakarta', 'America/New_York']) {
    const output = execute(['tsx', 'scripts/ai/analyst-evals/authority.ts'], {
      ...process.env, PGOPTIONS: `-c timezone=${timezone}`,
    });
    const line = output.split('\n').find(s => s.startsWith('EVIDENCE '));
    if (line) {
      const receipt: Evidence = JSON.parse(line.slice('EVIDENCE '.length));
      assert.equal(receipt.suite, 'authority-pg');
      const qualified = { ...receipt, passed: receipt.passed && commands.at(-1)!.passed, suite: `authority-pg-${timezone}` };
      authorityRuns.push(qualified); evidence.push(qualified);
    }
  }
  evidence.push({ suite: 'authority-pg', passed: authorityRuns.length === 3 && authorityRuns.every(r => r.passed),
    assertions: authorityPgRequirements.map(r => r.assertion).filter(a => authorityRuns.length === 3 && authorityRuns.every(r => r.assertions.includes(a))),
  });
  let authorityVitestReport: any = null;
  let vitestReport: any = null;
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
    try { vitestReport = JSON.parse(readFileSync(jsonPath, 'utf8')); }
    catch { /* Missing output remains missing evidence, never a pass. */ }
    evidence.push(...vitestEvidence(vitestReport, commands.at(-1)!.passed).evidence);
    const authorityJsonPath = path.join(temp, 'authority-vitest.json');
    execute(['vitest', 'run', 'src/lib/analyst-verifier/authority.test.ts', 'src/lib/analyst-verifier/port.test.ts',
      '--reporter=json', `--outputFile=${authorityJsonPath}`]);
    try { authorityVitestReport = JSON.parse(readFileSync(authorityJsonPath, 'utf8')); }
    catch { /* Missing/failed reusable evidence never qualifies. */ }
    evidence.push(authorityEvidence(authorityVitestReport, commands.at(-1)!.passed));
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
  const summary = summarizeCoverage(evidence);
  const sourceFiles = [
    'wiki/specs/analyst-dashboard-lifecycle.md',
    'scripts/ai/analyst-evals/authority.ts',
    'scripts/ai/analyst-evals/authority-evidence.ts',
    'scripts/ai/analyst-evals/authority-evidence.test.ts',
    'scripts/ai/analyst-evals/clarification.ts',
    'scripts/ai/analyst-evals/clarification.test.ts',
    'scripts/ai/analyst-evals/generic-authority.test.ts',
    'src/lib/analyst-verifier/authority.test.ts',
    'src/lib/analyst-verifier/port.test.ts',
    'src/lib/analyst-verifier/port.mjs',
    'src/lib/analyst-verifier/images.mjs',
    'src/lib/analyst-verifier/capability.mjs',
    'src/lib/ai/assistant/analyst/tools.ts',
    'src/lib/ai/assistant/analyst/task.ts',
    'src/lib/ai/assistant/tools.ts',
    'src/queries/prisma/analysis.ts',
    'src/permissions/analysis.ts',
    'src/permissions/website.ts',
    'src/permissions/share.ts',
    'scripts/ai/eval-analyst.ts',
    'scripts/ai/analyst-evals/run-offline.ts',
    'scripts/ai/analyst-evals/vitest.config.ts',
    'src/test/setup.ts',
    'scripts/ai/analyst-evals/staff-dashboard.ts',
    'scripts/ai/analyst-evals/staff-dashboard.test.ts',
    'scripts/ai/analyst-evals/vitest-evidence.test.ts',
    'scripts/ai/analyst-evals/api-evidence.test.ts',
    'scripts/ai/analyst-evals/offline.test.ts',
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
    vitestReport,
    authorityVitestReport,
    ...summary,
    limitations: [
      'Scenarios 10–12 pending; strict E1 must fail.',
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
