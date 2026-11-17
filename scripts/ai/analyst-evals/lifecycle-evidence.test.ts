import { expect, it } from 'vitest';
import { qualifiedVitestEvidence, qualifiedBrowserEvidence } from './lifecycle-evidence';
const binding = {
  id: '10.test',
  suite: 'test-suite',
  file: 'tests/example.test.ts',
  assertion: 'exact assertion',
};
it('source-qualified Vitest rejects missing wrong-source failed skipped empty reports and command failure', () => {
  const report = {
    success: true,
    testResults: [
      {
        name: '/checkout/tests/example.test.ts',
        assertionResults: [{ fullName: binding.assertion, status: 'passed' }],
      },
    ],
  };
  expect(qualifiedVitestEvidence(report, true, [binding])[0].assertions).toEqual([
    binding.assertion,
  ]);
  for (const mutate of [
    (r: any) => (r.testResults = []),
    (r: any) => (r.testResults[0].name = '/wrong/example.test.ts'),
    (r: any) => (r.testResults[0].assertionResults = []),
    (r: any) => (r.testResults[0].assertionResults[0].status = 'failed'),
    (r: any) => (r.testResults[0].assertionResults[0].status = 'skipped'),
    (r: any) => (r.success = false),
  ]) {
    const copy = structuredClone(report);
    mutate(copy);
    expect(qualifiedVitestEvidence(copy, true, [binding])[0].assertions).toEqual([]);
  }
  expect(qualifiedVitestEvidence(report, false, [binding])[0].assertions).toEqual([]);
  expect(qualifiedVitestEvidence(null, true, [binding])[0].assertions).toEqual([]);
});
it('source-qualified browser parser rejects wrong source skipped failed retries empty and unsuccessful command', () => {
  const binding = {
    id: '12.browser',
    suite: 'browser',
    file: 'tests/e2e/example.spec.ts',
    assertion: 'exact browser assertion',
  };
  const report = {
    errors: [],
    suites: [
      {
        specs: [
          {
            file: binding.file,
            title: binding.assertion,
            tests: [{ expectedStatus: 'passed', results: [{ status: 'passed' }] }],
          },
        ],
      },
    ],
  };
  expect(qualifiedBrowserEvidence(report, true, [binding])[0].assertions).toEqual([
    binding.assertion,
  ]);
  for (const mutate of [
    (r: any) => (r.suites = []),
    (r: any) => (r.errors = [{ message: 'failure' }]),
    (r: any) => (r.suites[0].specs[0].file = 'wrong.spec.ts'),
    (r: any) => (r.suites[0].specs[0].tests[0].results[0].status = 'skipped'),
    (r: any) => (r.suites[0].specs[0].tests[0].results[0].status = 'failed'),
    (r: any) => r.suites[0].specs[0].tests[0].results.unshift({ status: 'failed' }),
  ]) {
    const copy = structuredClone(report);
    mutate(copy);
    expect(qualifiedBrowserEvidence(copy, true, [binding])[0].assertions).toEqual([]);
  }
  expect(qualifiedBrowserEvidence(report, false, [binding])[0].assertions).toEqual([]);
  expect(qualifiedBrowserEvidence(null, true, [binding])[0].assertions).toEqual([]);
});
