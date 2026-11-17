import { expect, it } from 'vitest';
import { vitestEvidence } from './offline';

it('retains all structured assertion results and rejects missing/failed Vitest evidence', () => {
  const name = 'omitted native stats key rejects as missing_metric rather than zero';
  const assertion = { fullName: name, status: 'passed', failureMessages: [], ancestorTitles: [], title: name, duration: 1 };
  const report = { success: true, numTotalTests: 1, numPassedTests: 1, testResults: [{ name: 'missing-metric.test.ts', status: 'passed', assertionResults: [assertion] }] };
  const accepted = vitestEvidence(report, true);
  expect(accepted.report).toEqual(report);
  expect(accepted.evidence.find(e => e.suite === 'executor')?.assertions).toEqual([name]);
  expect(vitestEvidence(undefined, true).evidence.every(e => !e.passed)).toBe(true);
  expect(vitestEvidence(report, false).evidence.every(e => !e.passed)).toBe(true);
  expect(vitestEvidence({ ...report, success: false }, true).evidence.every(e => !e.passed)).toBe(true);
  expect(vitestEvidence({ ...report, testResults: [{ ...report.testResults[0], assertionResults: [{ ...assertion, status: 'failed', failureMessages: ['failure'] }] }] }, true).evidence.find(e => e.suite === 'executor')?.assertions).toEqual([]);
});

it('generic authority evidence rejects a matching assertion from the wrong source file', () => {
  const name = 'generic edit share delete and method aliases cannot dispatch lifecycle writes even with nested approval claims';
  const report = { success: true, testResults: [{ name: '/wrong/path.test.ts', assertionResults: [{ fullName: name, status: 'passed' }] }] };
  expect(vitestEvidence(report, true).evidence.find(e => e.suite === 'generic-authority')?.assertions).toEqual([]);
  report.testResults[0].name = '/checkout/scripts/ai/analyst-evals/generic-authority.test.ts';
  expect(vitestEvidence(report, true).evidence.find(e => e.suite === 'generic-authority')?.assertions).toEqual([name]);
});
