/* eslint-disable no-console */
/**
 * E1 offline runs real disposable API/tool fixtures and assertion-linked component contracts.
 * Choices are scripted; no paid provider, model reasoning, browser or visual verification.
 * Missing scenario evidence fails --strict. E2 check-report is independently owned.
 */
import { existsSync, readFileSync } from 'node:fs';
import { validateReport } from './analyst-report/validate';

const mode = process.argv[2];
const reportArg = process.argv[3];

// ---- E2: check-report mode. No execution, no DB, no process spawn. ----
function checkReport(reportPath: string) {
  if (!existsSync(reportPath)) {
    console.error(`NOT PASS: live evaluation report missing at ${reportPath}`);
    process.exit(1);
  }
  try {
    const report: unknown = JSON.parse(readFileSync(reportPath, 'utf8'));
    const result = validateReport(report);
    if (!result.valid) {
      console.error(`NOT PASS: ${result.errors.join('; ')}`);
      process.exit(1);
    }
    if ((report as { evidenceKind: string }).evidenceKind !== 'LIVE') {
      console.error('NOT PASS: VALIDATION fixture is not live evaluation evidence');
      process.exit(1);
    }
    console.log(
      `PASS: recorded LIVE report ${reportPath} meets declared evidence checks; approval and evidence authenticity require independent review`,
    );
  } catch (error) {
    console.error(
      `NOT PASS: cannot read/parse report: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

if (mode === '--check-report') {
  if (!reportArg) {
    console.error('Usage: tsx scripts/ai/eval-analyst.ts --check-report <path>');
    process.exit(2);
  }
  checkReport(reportArg);
  process.exit(0);
}

if (mode !== '--offline') {
  console.error('Usage: tsx scripts/ai/eval-analyst.ts --offline --strict | --check-report <path>');
  process.exit(2);
}
const strict = process.argv.includes('--strict');
const outputIndex = process.argv.indexOf('--output');
if (outputIndex >= 0 && !process.argv[outputIndex + 1]) {
  console.error('--output requires a path');
  process.exit(2);
}
const reuseIndex = process.argv.indexOf('--reuse-api-receipt');
if (reuseIndex >= 0 && !process.argv[reuseIndex + 1]) {
  console.error('--reuse-api-receipt requires a source-qualified completed offline receipt');
  process.exit(2);
}
const browserIndex = process.argv.indexOf('--browser-receipt');
if (browserIndex >= 0 && !process.argv[browserIndex + 1]) {
  console.error('--browser-receipt requires a completed exact-source browser receipt');
  process.exit(2);
}
import('./analyst-evals/run-offline').then(({ runOffline }) =>
  runOffline(strict, outputIndex >= 0 ? process.argv[outputIndex + 1] : undefined,
    reuseIndex >= 0 ? process.argv[reuseIndex + 1] : undefined,
    browserIndex >= 0 ? process.argv[browserIndex + 1] : undefined),
).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
