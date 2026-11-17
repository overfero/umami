import { authorityApiRequirements, authorityPgRequirements, reusableAuthorityAssertions } from './authority-evidence';
export type Evidence = { suite: string; assertions: string[]; passed: boolean };
export type Requirement = { id: string; suite: string; assertion: string };

// Every entry is an executed assertion name, not a test-file-exists check.
export const requirements: Requirement[] = [
  ...authorityPgRequirements.map(r => ({ ...r, suite: 'authority-pg' })),
  ...reusableAuthorityAssertions.map(r => ({ id: r.id, assertion: r.assertion, suite: 'authority-reusable' })),
  ...['postgres', 'clickhouse'].flatMap(engine => authorityApiRequirements.map(r => ({ ...r, suite: `${engine}-api` }))),
  { id: '9.generic', suite: 'generic-authority', assertion: 'generic edit share delete and method aliases cannot dispatch lifecycle writes even with nested approval claims' },
  ...['postgres', 'clickhouse'].flatMap(engine => [
    ...[
      ['1.labels', 'exact observed labels and daily event occurrences, separate product/ops'],
      ['1.people', 'identified users stay source-scoped despite repeated identity'],
      ['1.board', 'staff board persists separate source widgets and observed-only meaning'],
      ['2.filters', 'filtered event/person series survives real child process reopen'],
      ['3.numeric', 'numeric zero/null aggregates and unsupported numeric grouping'],
      ['4.coverage', 'absent collection coverage differs from covered explicit zero'],
      ['5.reuse', 'matching saved analysis reused; different filter/population never substituted'],
    ].map(([id, assertion]) => ({ id, suite: `${engine}-supplement`, assertion })),
    ...[
      ['2.fresh', 'after fresh writes: rolling 24h = 2 (48h-old excluded), fixed stays 3'],
      [
        '2.restart',
        'restarted process executes persisted definitions with identical semantics and results',
      ],
      ['3.aggregate', 'event numeric amount sum = 40'],
      ['4.zero', 'totals unknown event is explicit zero'],
      ['4.null', 'missing numeric values are null, not zero'],
      ['4.top', 'top-1 breakdown is labeled partial top-N without fabricated remainder'],
    ].map(([id, assertion]) => ({ id, suite: `${engine}-api`, assertion })),
  ]),
  {
    id: '3.render',
    suite: 'component',
    assertion:
      'numeric aggregate metric/table renders exact value, zero and unavailable without a series',
  },
  {
    id: '4.missing',
    suite: 'executor',
    assertion: 'omitted native stats key rejects as missing_metric rather than zero',
  },
];

export function apiEvidence(engine: string, output: string): Evidence {
  const assertions = [...output.matchAll(/^\s+ok (\d+) (.+)$/gm)];
  const completion = output.match(
    new RegExp(`^PASS ${engine === 'postgres' ? 'postgresql' : engine}: (\\d+) checks`, 'm'),
  );
  return {
    suite: `${engine}-api`,
    assertions: assertions.map(m => m[2]),
    passed:
      !!completion &&
      Number(completion[1]) >= 60 &&
      Number(completion[1]) === assertions.length &&
      assertions.every((m, i) => Number(m[1]) === i + 1),
  };
}

export function vitestEvidence(report: any, commandPassed: boolean) {
  const assertions: { fullName: string; status: string }[] = report?.testResults?.flatMap(
    (r: any) => r.assertionResults ?? [],
  ) ?? [];
  const passed = commandPassed && report?.success === true && assertions.length > 0;
  return {
    report: report ?? null,
    evidence: ['component', 'executor', 'generic-authority'].map(suite => ({
      suite, passed,
      assertions: requirements.filter(r => r.suite === suite).map(r => r.assertion).filter(name =>
        assertions.some(a => a.fullName === name && a.status === 'passed'),
      ),
    })),
  };
}

export function summarizeCoverage(evidence: Evidence[]) {
  const proven: number[] = [];
  const pending: number[] = [];
  for (let scenario = 1; scenario <= 12; scenario++) {
    const required = requirements.filter(r => r.id.startsWith(`${scenario}.`));
    const complete =
      required.length > 0 &&
      required.every(r =>
        evidence.some(e => e.suite === r.suite && e.passed && e.assertions.includes(r.assertion)),
      );
    (complete ? proven : pending).push(scenario);
  }
  return { pass: pending.length === 0, proven, pending };
}
