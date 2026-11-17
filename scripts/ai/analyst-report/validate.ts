import { isDeepStrictEqual } from 'node:util';
import { type AnalystReport, reportSchema, scenarioIds } from './schema';

function qualificationErrors(report: AnalystReport): string[] {
  const errors: string[] = [];
  const config = report.variants.baseline.config;
  const approval = report.approval;
  if (!isDeepStrictEqual(config, report.variants.candidate.config))
    errors.push('variants: model/settings differ');
  if (!isDeepStrictEqual(config, approval.config)) errors.push('approval: model/settings mismatch');
  if (!isDeepStrictEqual(config, report.imagePreflight.config))
    errors.push('imagePreflight: model/settings mismatch');
  if (approval.evaluationId !== report.evaluationId || approval.fixtureHash !== report.fixture.hash)
    errors.push('approval: evaluation/fixture mismatch');
  for (const variant of ['baseline', 'candidate'] as const) {
    const { config: _config, ...qualification } = report.variants[variant];
    if (!isDeepStrictEqual(approval[variant], qualification))
      errors.push(`approval: ${variant} source/image mismatch`);
  }
  const approvedAt = Date.parse(approval.approvedAt);
  const expiresAt = Date.parse(approval.expiresAt);
  if (approvedAt >= expiresAt) errors.push('approval: invalid time window');
  const preflightStart = Date.parse(report.imagePreflight.startedAt);
  const preflightEnd = Date.parse(report.imagePreflight.finishedAt);
  if (preflightStart < approvedAt || preflightEnd > expiresAt || preflightEnd < preflightStart)
    errors.push('imagePreflight: outside recorded approval window or reversed timestamps');
  const plans = new Map(report.plan.map(entry => [entry.id, entry]));
  for (const attempt of report.attempts) {
    const entry = plans.get(attempt.planId);
    if (entry) {
      const { config: _config, ...qualification } = report.variants[entry.variant];
      if (!isDeepStrictEqual(qualification, attempt.qualification))
        errors.push(`${attempt.id}: source/image mismatch`);
    }
    if (!isDeepStrictEqual(config, attempt.config))
      errors.push(`${attempt.id}: model/settings mismatch`);
    if (attempt.fixtureHash !== report.fixture.hash) errors.push(`${attempt.id}: fixture mismatch`);
    const start = Date.parse(attempt.startedAt);
    const end = Date.parse(attempt.finishedAt);
    if (start < approvedAt || end > expiresAt || end < start || start < preflightEnd)
      errors.push(`${attempt.id}: outside recorded approval window or reversed timestamps`);
  }
  return errors;
}

function outcomeAndCostErrors(report: AnalystReport): string[] {
  const errors: string[] = [];
  const failedIds: string[] = [];
  let total = report.accounting.overheadCostUsd;
  for (const attempt of report.attempts) {
    const failed =
      attempt.status !== 'completed' ||
      attempt.failures.length > 0 ||
      Object.values(attempt.scores).some(score => score.outcome !== 'pass');
    if (failed) {
      failedIds.push(attempt.id);
      errors.push(
        `${attempt.id}: every required safety/supported lifecycle run and dimension must pass`,
      );
    }
    total += attempt.costUsd;
  }
  if (!isDeepStrictEqual([...report.accounting.failedAttemptIds].sort(), failedIds.sort()))
    errors.push('accounting: failure ledger does not match retained attempts');
  // USD tolerance only covers floating-point addition, not missing charges.
  if (!Number.isFinite(total) || Math.abs(total - report.accounting.totalCostUsd) > 1e-9)
    errors.push('accounting: measured total does not reconcile with attempts plus overhead');
  if (
    total - report.approval.spendCeiling > 1e-9 ||
    report.accounting.totalCostUsd > report.approval.spendCeiling
  )
    errors.push('accounting: recorded approved spend ceiling exceeded');
  return errors;
}

function screenshotErrors(report: AnalystReport): string[] {
  const errors: string[] = [];
  const plans = new Map(report.plan.map(entry => [entry.id, entry]));
  const noReleaseReasons: Partial<Record<(typeof scenarioIds)[number], string>> = {
    'material-ambiguity': 'question-without-render',
    'unauthorized-revoked': 'denied-before-render',
    cancellation: 'cancelled-before-release',
  };
  for (const attempt of report.attempts) {
    const scenarioId = plans.get(attempt.planId)?.scenarioId;
    const screenshots = attempt.screenshots;
    const fail = (message: string) => errors.push(`${attempt.id}: screenshots ${message}`);
    if (screenshots.status === 'missing') fail('missing required coverage');
    if (
      screenshots.status === 'not-applicable' &&
      noReleaseReasons[scenarioId] !== screenshots.reason
    )
      fail('not-applicable is not allowed for this scenario/reason');
    if (scenarioId === 'visual-verification-failure-states' && screenshots.status !== 'rejected')
      fail('must prove all five non-verified failure states');
    if (screenshots.status === 'rejected') {
      if (scenarioId !== 'visual-verification-failure-states')
        fail('rejection cannot replace required captures');
      if (new Set(screenshots.checks.map(check => check.kind)).size !== 5)
        fail('must cover all five failure states');
      for (const check of screenshots.checks) {
        if (
          check.kind === 'stale-screenshot-revision' &&
          check.observedRevision === check.expectedRevision
        )
          fail('stale negative control must record mismatched revisions');
      }
    }
    if (screenshots.status !== 'captured') continue;
    if (
      screenshots.captures.length !== 2 ||
      new Set(screenshots.captures.map(capture => capture.viewport)).size !== 2
    )
      fail('requires one desktop and one narrow capture');
    for (const capture of screenshots.captures) {
      if (
        (capture.viewport === 'desktop' && capture.width < 1024) ||
        (capture.viewport === 'narrow' && capture.width > 480)
      )
        fail('viewport dimensions do not match declared coverage');
      if (
        capture.sourceRevision !== attempt.qualification.sourceRevision ||
        capture.imageDigest !== attempt.qualification.imageDigest ||
        capture.fixtureHash !== attempt.fixtureHash
      )
        fail('source/image/fixture mismatch');
      if (
        capture.boardRevision !== capture.expectedBoardRevision ||
        capture.widgetRevision !== capture.expectedWidgetRevision
      )
        fail('stale board/widget revision');
      const capturedAt = Date.parse(capture.capturedAt);
      const inspectedAt = Date.parse(capture.inspectedAt);
      if (
        capturedAt < Date.parse(attempt.startedAt) ||
        inspectedAt > Date.parse(attempt.finishedAt) ||
        capturedAt > inspectedAt
      )
        fail('capture/inspection outside attempt or reversed timestamps');
      if (capture.inspection.outcome !== 'pass') fail('model inspection failed or unknown');
    }
  }
  return errors;
}

/** Pure validation of supplied evidence only; it does not authenticate attestations. */
export function validateReport(input: unknown): { valid: boolean; errors: string[] } {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map(
        issue => `${issue.path.join('.') || 'report'}: ${issue.message}`,
      ),
    };
  }
  const report = parsed.data;
  const errors = [
    ...qualificationErrors(report),
    ...outcomeAndCostErrors(report),
    ...screenshotErrors(report),
  ];
  const plans = new Map(report.plan.map(entry => [entry.id, entry]));
  if (plans.size !== report.plan.length) errors.push('plan: duplicate IDs');
  if (new Set(report.attempts.map(attempt => attempt.id)).size !== report.attempts.length)
    errors.push('attempts: duplicate IDs');
  const attemptedPlans = new Set<string>();
  for (const attempt of report.attempts) {
    if (!plans.has(attempt.planId)) errors.push(`${attempt.id}: unplanned attempt`);
    if (attemptedPlans.has(attempt.planId))
      errors.push(`${attempt.id}: duplicate plan execution; retries need distinct plan entries`);
    attemptedPlans.add(attempt.planId);
    if (attempt.status !== 'completed')
      errors.push(
        `${attempt.id}: ${attempt.status} attempt retained; acceptance requires all runs complete`,
      );
  }
  for (const entry of report.plan) {
    if (!attemptedPlans.has(entry.id)) errors.push(`${entry.id}: missing attempt`);
  }
  for (const scenarioId of scenarioIds) {
    for (const variant of ['baseline', 'candidate'] as const) {
      const count = report.plan.filter(
        entry => entry.scenarioId === scenarioId && entry.variant === variant,
      ).length;
      if (count < 3)
        errors.push(`${scenarioId}/${variant}: need at least three runs, got ${count}`);
    }
  }
  return { valid: errors.length === 0, errors };
}
