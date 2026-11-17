import { describe, expect, it } from 'vitest';
import { requirements, summarizeCoverage } from './offline';

describe('offline acceptance evidence', () => {
  it('fails strict acceptance when any required scenario lacks executed assertions', () => {
    const summary = summarizeCoverage([]);
    expect(summary.pass).toBe(false);
    expect(summary.pending).toHaveLength(12);
    expect(summary.proven).toEqual([]);
  });

  it('requires every scenario1–9 assertion and keeps scenarios10–12 pending', () => {
    const evidence = [...new Set(requirements.map(r => r.suite))].map(suite => ({
      suite,
      passed: true,
      assertions: requirements.filter(r => r.suite === suite).map(r => r.assertion),
    }));
    expect(summarizeCoverage(evidence)).toEqual({
      pass: false,
      proven: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      pending: [10, 11, 12],
    });
    for (const requirement of requirements) {
      const missing = evidence.map(e => ({
        ...e,
        assertions:
          e.suite === requirement.suite
            ? e.assertions.filter(a => a !== requirement.assertion)
            : e.assertions,
      }));
      expect(summarizeCoverage(missing).pending).toContain(Number(requirement.id.split('.')[0]));
    }
  });

  it('does not accept exit zero without every coverage-linked assertion', () => {
    const summary = summarizeCoverage([{ suite: 'postgres-api', assertions: [], passed: true }]);
    expect(summary.pass).toBe(false);
    expect(summary.proven).toEqual([]);
  });
});
