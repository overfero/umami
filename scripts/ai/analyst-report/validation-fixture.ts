import type { AnalystReport } from './schema';

/** Synthetic validator input ONLY. Never an executed live/model evaluation receipt. */
export function createValidationFixture(): AnalystReport {
  const hash = `sha256:${'a'.repeat(64)}`;
  const qualification = { sourceRevision: 'b'.repeat(40), imageDigest: hash };
  const config = {
    provider: 'VALIDATION-provider',
    model: 'VALIDATION-model',
    reasoningLevel: 'high',
    settings: { temperature: 0, maxTokens: 4096 },
  };
  const evidence = { reference: 'VALIDATION-only/independent-expectations.json', sha256: hash };
  // Literal ordered mapping from originating spec §7, independent of validator's list.
  const ids = [
    'staff-activity-dashboard',
    'replay-after-restart',
    'numeric-property-aggregate',
    'zero-missing-topn',
    'reuse-vs-reject-analysis',
    'material-ambiguity',
    'unauthorized-revoked',
    'duplicate-commit-idempotency',
    'bypass-confirmation-existing-board',
    'visual-verification-failure-states',
    'cancellation',
    'flags-off-compatibility',
  ] as const;
  const plan = ids.flatMap(scenarioId =>
    (['baseline', 'candidate'] as const).flatMap(variant =>
      [1, 2, 3].map(number => ({
        id: `${scenarioId}-${variant}-${number}`,
        scenarioId,
        variant,
        prompt: `VALIDATION ordinary-language prompt for ${scenarioId}`,
        expectedAssertions: evidence,
      })),
    ),
  );
  const score = {
    outcome: 'pass' as const,
    evidence: 'VALIDATION-only independent assessment of expected outcomes',
  };
  const report: AnalystReport = {
    schemaVersion: 1,
    evidenceKind: 'VALIDATION',
    evaluationId: 'VALIDATION-only-not-live-evidence',
    fixture: { hash, expectedAssertions: evidence },
    variants: { baseline: { ...qualification, config }, candidate: { ...qualification, config } },
    approval: {
      evaluationId: 'VALIDATION-only-not-live-evidence',
      approvedBy: 'VALIDATION-not-an-operator',
      reference: 'VALIDATION-only/not-real-authorization',
      approvedAt: '2026-01-01T00:00:00Z',
      expiresAt: '2026-01-02T00:00:00Z',
      currency: 'USD',
      spendCeiling: 10,
      config,
      baseline: qualification,
      candidate: qualification,
      fixtureHash: hash,
    },
    imagePreflight: {
      config,
      imageCapable: true,
      roundTripEvidence: evidence,
      startedAt: '2026-01-01T00:01:00Z',
      finishedAt: '2026-01-01T00:01:01Z',
    },
    plan,
    attempts: plan.map((entry): AnalystReport['attempts'][number] => ({
      id: `attempt-${entry.id}`,
      planId: entry.id,
      status: 'completed',
      startedAt: '2026-01-01T01:00:00Z',
      finishedAt: '2026-01-01T01:00:01Z',
      qualification,
      fixtureHash: hash,
      config,
      trace: evidence,
      latencyMs: 1000,
      costUsd: 0.01,
      scores: {
        discoverySemantics: score,
        numbers: score,
        persistenceReplay: score,
        authority: score,
        visualClaims: score,
      },
      failures: [],
      screenshots:
        entry.scenarioId === 'visual-verification-failure-states'
          ? {
              status: 'rejected',
              checks: (
                [
                  'browser-render-failure',
                  'missing-image-capability',
                  'inaccessible-verifier',
                  'clipped-narrow-widget',
                  'stale-screenshot-revision',
                ] as const
              ).map(kind => ({
                kind,
                evidence,
                nonVerified: true,
                noReleaseEvidence: evidence,
                observedRevision:
                  kind === 'stale-screenshot-revision' ? 'VALIDATION-old' : 'VALIDATION-current',
                expectedRevision: 'VALIDATION-current',
              })),
            }
          : {
              status: 'captured',
              captures: (['desktop', 'narrow'] as const).map(viewport => ({
                viewport,
                width: viewport === 'desktop' ? 1280 : 390,
                height: 900,
                artifact: evidence,
                ...qualification,
                fixtureHash: hash,
                boardRevision: 1,
                widgetRevision: 'VALIDATION-widget-revision-1',
                expectedBoardRevision: 1,
                expectedWidgetRevision: 'VALIDATION-widget-revision-1',
                automatedReceipt: evidence,
                capturedAt: '2026-01-01T01:00:00Z',
                inspectedAt: '2026-01-01T01:00:01Z',
                inspection: { observer: 'model', outcome: 'pass', evidence },
              })),
            },
    })),
    accounting: {
      currency: 'USD',
      totalCostUsd: 0.82,
      overheadCostUsd: 0.1,
      overheadEvidence: evidence,
      allAttemptsRecorded: true,
      failedAttemptIds: [],
    },
  };
  // JSON round-trip also breaks shared references, as a real report file would.
  return JSON.parse(JSON.stringify(report));
}
