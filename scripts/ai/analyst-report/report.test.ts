import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { validateReport } from './validate';
import { createValidationFixture } from './validation-fixture';

function checkCli(contents: unknown) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'analyst-report-test-'));
  try {
    const file = path.join(directory, 'VALIDATION-only.json');
    writeFileSync(file, typeof contents === 'string' ? contents : JSON.stringify(contents));
    return spawnSync(
      process.execPath,
      [
        '--import',
        'tsx',
        process.env.ANALYST_REPORT_TEST_CLI ?? 'scripts/ai/eval-analyst.ts',
        '--check-report',
        file,
      ],
      { encoding: 'utf8' },
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('paginated captures permit three through six panels within one job', () => {
  for (const count of [3, 4, 5, 6]) {
    const report = createValidationFixture();
    const screenshots = report.attempts[0].screenshots;
    assert.equal(screenshots.status, 'captured');
    if (screenshots.status !== 'captured') return;
    for (let i = 2; i < count; i++)
      screenshots.captures.push({
        ...structuredClone(screenshots.captures[1]),
        id: `panel-${i}`,
      });
    assert.deepEqual(validateReport(report), { valid: true, errors: [] }, `${count} panels`);
    screenshots.captures[count - 1].widgetRevision = 'stale-paginated-panel';
    assert.equal(validateReport(report).valid, false, 'every added panel must remain current');
  }
});

test('multiple qualified jobs may exceed six captures in aggregate, never per job', () => {
  const report = createValidationFixture();
  const screenshots = report.attempts[0].screenshots;
  if (screenshots.status !== 'captured') return assert.fail('fixture must capture');
  const desktop = screenshots.captures[0];
  const narrow = screenshots.captures[1];
  const job = screenshots.jobs[0];
  job.viewports = [{ viewport: 'desktop', width: desktop.width, height: desktop.height }];
  const narrowJob: typeof job = {
    ...structuredClone(job),
    id: 'narrow-job',
    viewports: [{ viewport: 'narrow', width: narrow.width, height: narrow.height }],
  };
  screenshots.jobs.push(narrowJob);
  screenshots.captures = [desktop, narrow].flatMap((capture, viewportIndex) =>
    Array.from({ length: 6 }, (_, panel) => ({
      ...structuredClone(capture),
      id: `capture-${viewportIndex}-${panel}`,
      jobId: viewportIndex === 0 ? job.id : narrowJob.id,
    })),
  );
  assert.deepEqual(validateReport(report), { valid: true, errors: [] });
  screenshots.captures.push({ ...structuredClone(desktop), id: 'seventh-desktop-panel' });
  assert.equal(validateReport(report).valid, false);
});

test('capture/job provenance rejects missing viewport, orphan/duplicate/inconsistent records and excess images', () => {
  const mutations = [
    (s: any) => {
      s.captures = Array.from({ length: 7 }, (_, i) => ({
        ...s.captures[i % 2],
        id: `capture-${i}`,
      }));
    },
    (s: any) => {
      s.captures[1].viewport = 'desktop';
      s.captures[1].width = 1280;
    },
    (s: any) => {
      s.captures[0].jobId = 'orphan';
    },
    (s: any) => {
      s.jobs.push(structuredClone(s.jobs[0]));
    },
    (s: any) => {
      s.jobs.push({ ...structuredClone(s.jobs[0]), id: 'unused-job' });
    },
    (s: any) => {
      s.captures[1].id = s.captures[0].id;
    },
    (s: any) => {
      s.jobs[0].attemptId = 'other-attempt';
    },
    (s: any) => {
      s.jobs[0].sourceRevision = 'c'.repeat(40);
    },
    (s: any) => {
      s.jobs[0].fixtureHash = `sha256:${'c'.repeat(64)}`;
    },
    (s: any) => {
      s.jobs[0].boardRevision = 2;
    },
    (s: any) => {
      s.jobs[0].widgetRevision = 'other';
    },
    (s: any) => {
      s.jobs[0].viewports[0].width = 1440;
    },
    (s: any) => {
      s.jobs[0].finishedAt = '2026-01-01T02:00:00Z';
    },
  ];
  mutations.forEach((mutate, i) => {
    const report = createValidationFixture();
    mutate(report.attempts[0].screenshots);
    assert.equal(validateReport(report).valid, false, `job mutation ${i}`);
  });
});

test('pure validator accepts a complete VALIDATION fixture without claiming live evidence', () => {
  assert.deepEqual(validateReport(createValidationFixture()), { valid: true, errors: [] });
});

test('metadata rejects malformed roots and unknown fields without throwing', () => {
  for (const input of [
    null,
    [],
    '',
    0,
    {},
    { runs: null },
    { ...createValidationFixture(), unknown: true },
  ]) {
    assert.equal(validateReport(input).valid, false);
  }
});

test('qualification permits different candidate sources and equivalent setting key order', () => {
  const report = createValidationFixture();
  const candidate = { sourceRevision: 'c'.repeat(40), imageDigest: `sha256:${'d'.repeat(64)}` };
  Object.assign(report.variants.candidate, candidate);
  report.approval.candidate = candidate;
  report.variants.candidate.config.settings = { maxTokens: 4096, temperature: 0 };
  const candidatePlanIds = new Set(
    report.plan.filter(entry => entry.variant === 'candidate').map(entry => entry.id),
  );
  for (const attempt of report.attempts) {
    if (!candidatePlanIds.has(attempt.planId)) continue;
    attempt.qualification = candidate;
    if (attempt.screenshots.status === 'captured') {
      for (const capture of attempt.screenshots.captures) Object.assign(capture, candidate);
      for (const job of attempt.screenshots.jobs) Object.assign(job, candidate);
    }
  }
  assert.deepEqual(validateReport(report), { valid: true, errors: [] });
});

test('canonical groups require three completed runs of each variant, with no missing or duplicate plan/attempt IDs', () => {
  const mutations = [
    (r: any) => {
      r.plan[0].scenarioId = 'arbitrary';
    },
    (r: any) => {
      r.plan[0].scenarioId = 'replay-after-restart';
    },
    (r: any) => {
      r.plan[0].variant = 'candidate';
    },
    (r: any) => {
      r.attempts.pop();
    },
    (r: any) => {
      r.plan.pop();
    },
    (r: any) => {
      r.attempts[0].status = 'aborted';
    },
    (r: any) => {
      r.attempts[0].id = r.attempts[1].id;
    },
    (r: any) => {
      r.plan[0].id = r.plan[1].id;
    },
    (r: any) => {
      r.attempts[0].planId = 'unplanned';
    },
    (r: any) => {
      r.attempts[0].planId = r.attempts[1].planId;
    },
    (r: any) => {
      r.plan = [];
      r.attempts = [];
    },
  ];
  mutations.forEach((mutate, i) => {
    const report = createValidationFixture();
    mutate(report);
    assert.equal(validateReport(report).valid, false, `mutation ${i} must fail`);
  });
});

test('qualified metadata, identical settings, preflight, and recorded approval must bind every run', () => {
  const mutations = [
    (r: any) => {
      r.evaluationId = ' ';
    },
    (r: any) => {
      r.variants.baseline.config.provider = '';
    },
    (r: any) => {
      r.variants.candidate.config.model = 'other';
    },
    (r: any) => {
      r.variants.candidate.config.reasoningLevel = 'low';
    },
    (r: any) => {
      r.variants.candidate.config.settings.temperature = 1;
    },
    (r: any) => {
      r.attempts[0].config.settings.maxTokens = 1;
    },
    (r: any) => {
      r.variants.baseline.sourceRevision = 'main';
    },
    (r: any) => {
      r.variants.candidate.imageDigest = '';
    },
    (r: any) => {
      r.attempts[0].qualification.sourceRevision = 'c'.repeat(40);
    },
    (r: any) => {
      r.attempts[0].fixtureHash = `sha256:${'c'.repeat(64)}`;
    },
    (r: any) => {
      r.fixture.expectedAssertions.reference = '';
    },
    (r: any) => {
      r.attempts[0].trace.reference = '';
    },
    (r: any) => {
      r.imagePreflight.imageCapable = false;
    },
    (r: any) => {
      for (const variant of ['baseline', 'candidate']) r.variants[variant].config.settings = {};
      r.approval.config.settings = {};
      r.imagePreflight.config.settings = {};
      for (const attempt of r.attempts) attempt.config.settings = {};
    },
    (r: any) => {
      r.imagePreflight.startedAt = '2025-12-31T00:00:00Z';
    },
    (r: any) => {
      r.imagePreflight.config.model = 'other';
    },
    (r: any) => {
      r.approval.approvedBy = '';
    },
    (r: any) => {
      r.approval.evaluationId = 'unrelated';
    },
    (r: any) => {
      r.approval.config.model = 'other';
    },
    (r: any) => {
      r.approval.candidate.imageDigest = `sha256:${'c'.repeat(64)}`;
    },
    (r: any) => {
      r.approval.fixtureHash = `sha256:${'c'.repeat(64)}`;
    },
    (r: any) => {
      r.approval.approvedAt = '2026-01-01T02:00:00Z';
    },
    (r: any) => {
      r.approval.expiresAt = '2026-01-01T00:30:00Z';
    },
    (r: any) => {
      r.attempts[0].finishedAt = '2025-12-31T00:00:00Z';
    },
  ];
  mutations.forEach((mutate, i) => {
    const report = createValidationFixture();
    mutate(report);
    assert.equal(validateReport(report).valid, false, `qualification mutation ${i} must fail`);
  });
});

test('exact recorded spend ceiling permits only floating-addition rounding, not overspend', () => {
  const report = createValidationFixture();
  report.approval.spendCeiling = 0.82;
  assert.equal(validateReport(report).valid, true);
  report.accounting.totalCostUsd = 0.820001;
  assert.equal(validateReport(report).valid, false);
});

test('every required run/dimension must pass, all failures retained, and finite measured spend must reconcile under approval', () => {
  const mutations = [
    (r: any) => {
      r.attempts[36].scores.authority.outcome = 'fail';
    },
    (r: any) => {
      r.attempts[0].scores.numbers.outcome = 'unknown';
    },
    (r: any) => {
      delete r.attempts[0].scores.persistenceReplay;
    },
    (r: any) => {
      r.attempts[0].failures.push('retained failure');
    },
    (r: any) => {
      r.attempts[0].status = 'failed';
      r.accounting.failedAttemptIds = [];
    },
    (r: any) => {
      r.accounting.failedAttemptIds = ['omitted-failure'];
    },
    (r: any) => {
      r.accounting.allAttemptsRecorded = false;
    },
    (r: any) => {
      r.attempts[0].costUsd = -1;
    },
    (r: any) => {
      r.attempts[0].costUsd = Infinity;
    },
    (r: any) => {
      r.attempts[0].costUsd = NaN;
    },
    (r: any) => {
      r.attempts[0].latencyMs = NaN;
    },
    (r: any) => {
      r.accounting.totalCostUsd = Infinity;
    },
    (r: any) => {
      r.accounting.totalCostUsd = 0;
    },
    (r: any) => {
      r.accounting.overheadCostUsd = -1;
    },
    (r: any) => {
      r.approval.spendCeiling = 0.5;
    },
    (r: any) => {
      r.approval.spendCeiling = 0;
    },
    (r: any) => {
      r.approval.spendCeiling = Infinity;
    },
    (r: any) => {
      r.accounting.currency = 'EUR';
    },
  ];
  mutations.forEach((mutate, i) => {
    const report = createValidationFixture();
    mutate(report);
    assert.equal(validateReport(report).valid, false, `outcome/cost mutation ${i} must fail`);
  });
});

test('screenshots require qualified desktop/narrow inspected captures, or scenario-specific no-release evidence', () => {
  const mutations = [
    (r: any) => {
      r.attempts[0].screenshots = { status: 'missing', reason: 'unknown' };
    },
    (r: any) => {
      r.attempts[0].screenshots = {
        status: 'not-applicable',
        reason: 'denied-before-render',
        noReleaseEvidence: r.fixture.expectedAssertions,
      };
    },
    (r: any) => {
      r.attempts[0].screenshots.captures.pop();
    },
    (r: any) => {
      r.attempts[0].screenshots.captures[1].viewport = 'desktop';
    },
    (r: any) => {
      r.attempts[0].screenshots.captures[1].width = 1280;
    },
    (r: any) => {
      r.attempts[0].screenshots.captures[0].sourceRevision = 'c'.repeat(40);
    },
    (r: any) => {
      r.attempts[0].screenshots.captures[0].fixtureHash = `sha256:${'c'.repeat(64)}`;
    },
    (r: any) => {
      r.attempts[0].screenshots.captures[0].imageDigest = `sha256:${'c'.repeat(64)}`;
    },
    (r: any) => {
      r.attempts[0].screenshots.captures[0].boardRevision = 0;
    },
    (r: any) => {
      r.attempts[0].screenshots.captures[0].widgetRevision = 'stale';
    },
    (r: any) => {
      r.attempts[0].screenshots.captures[0].capturedAt = '2025-12-31T00:00:00Z';
    },
    (r: any) => {
      r.attempts[0].screenshots.captures[0].inspectedAt = '2026-01-01T02:00:00Z';
    },
    (r: any) => {
      r.attempts[0].screenshots.captures[0].inspection.outcome = 'unknown';
    },
    (r: any) => {
      r.attempts[0].screenshots.captures[0].inspection.observer = 'automated';
    },
    (r: any) => {
      r.attempts[54].screenshots.checks[0].nonVerified = false;
    },
    (r: any) => {
      r.attempts[54].screenshots.checks.pop();
    },
    (r: any) => {
      r.attempts[54].screenshots.checks[4].observedRevision = 'VALIDATION-current';
    },
  ];
  mutations.forEach((mutate, i) => {
    const report = createValidationFixture();
    mutate(report);
    assert.equal(validateReport(report).valid, false, `screenshot mutation ${i} must fail`);
  });
  for (const [index, reason] of [
    [30, 'question-without-render'],
    [36, 'denied-before-render'],
    [60, 'cancelled-before-release'],
  ] as const) {
    const report = createValidationFixture();
    report.attempts[index].screenshots = {
      status: 'not-applicable',
      reason,
      noReleaseEvidence: report.fixture.expectedAssertions,
    };
    assert.equal(validateReport(report).valid, true);
    report.attempts[index].screenshots = {
      status: 'not-applicable',
      reason: 'denied-before-render',
      noReleaseEvidence: { reference: '', sha256: report.fixture.hash },
    };
    assert.equal(validateReport(report).valid, false);
  }
});

test('CLI accepts only LIVE-shaped test input, refuses VALIDATION/malformed/missing reports, without model or DB calls', () => {
  const validation = checkCli(createValidationFixture());
  assert.equal(validation.status, 1);
  assert.match(validation.stderr, /VALIDATION fixture is not live/);
  const liveShapedTestOnly = createValidationFixture();
  liveShapedTestOnly.evidenceKind = 'LIVE'; // Synthetic validator test, NOT actual live evidence.
  const accepted = checkCli(liveShapedTestOnly);
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.match(accepted.stdout, /authenticity require independent review/);
  assert.equal(checkCli('{ invalid JSON').status, 1);
  const missing = spawnSync(
    process.execPath,
    [
      '--import',
      'tsx',
      process.env.ANALYST_REPORT_TEST_CLI ?? 'scripts/ai/eval-analyst.ts',
      '--check-report',
      '/nonexistent/VALIDATION-report.json',
    ],
    { encoding: 'utf8' },
  );
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /NOT PASS/);
});

test('CLI rejects the historical blank metadata / arbitrary twelve zero-run false pass', () => {
  const result = checkCli({
    sourceRevision: '',
    provider: '',
    model: '',
    fixtureHash: '',
    reasoningLevel: '',
    spendCeiling: 0,
    runs: Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [`arbitrary-${i}`, { passes: 0, total: 0 }]),
    ),
  });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /NOT PASS/);
});
