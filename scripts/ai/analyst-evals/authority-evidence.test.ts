import { expect, it } from 'vitest';
import { authorityEvidence, reusableAuthorityAssertions } from './authority-evidence';

it('reusable authority evidence requires exact source-qualified passed assertions and successful nonempty command', () => {
  const report = {
    success: true,
    testResults: reusableAuthorityAssertions.map(a => ({
      name: `/checkout/${a.file}`,
      assertionResults: [{ fullName: a.assertion, status: 'passed' }],
    })),
  };
  expect(authorityEvidence(report, true).assertions).toHaveLength(
    reusableAuthorityAssertions.length,
  );
  expect(authorityEvidence(report, false).passed).toBe(false);
  expect(authorityEvidence(null, true).passed).toBe(false);
  for (const change of [
    (r: any) => r.testResults.splice(0, 1),
    (r: any) => (r.testResults[0].assertionResults[0].status = 'failed'),
    (r: any) => (r.testResults[0].name = '/wrong/path.test.ts'),
  ]) {
    const mutated = structuredClone(report);
    change(mutated);
    expect(authorityEvidence(mutated, true).assertions).not.toContain(
      reusableAuthorityAssertions[0].assertion,
    );
  }
});
