import { z } from 'zod';

const text = z.string().trim().min(1);
const sha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const revision = z.string().regex(/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/);
const money = z.number().finite().nonnegative();
const timestamp = z.iso.datetime();

/** IDs follow originating lifecycle spec §7 order; not free-form report labels. */
export const scenarioIds = [
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

const config = z.strictObject({
  provider: text,
  model: text,
  reasoningLevel: text,
  settings: z
    .record(text, z.json())
    .refine(settings => Object.keys(settings).length > 0, 'explicit settings required'),
});
const qualification = z.strictObject({ sourceRevision: revision, imageDigest: sha256 });
const evidence = z.strictObject({ reference: text, sha256 });
const score = z.strictObject({ outcome: z.enum(['pass', 'fail', 'unknown']), evidence: text });
const capture = z.strictObject({
  viewport: z.enum(['desktop', 'narrow']),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  artifact: evidence,
  sourceRevision: revision,
  imageDigest: sha256,
  fixtureHash: sha256,
  boardRevision: z.number().int().nonnegative(),
  widgetRevision: text,
  expectedBoardRevision: z.number().int().nonnegative(),
  expectedWidgetRevision: text,
  automatedReceipt: evidence,
  capturedAt: timestamp,
  inspectedAt: timestamp,
  inspection: z.strictObject({
    observer: z.literal('model'),
    outcome: z.enum(['pass', 'fail', 'unknown']),
    evidence,
  }),
});

export const reportSchema = z.strictObject({
  schemaVersion: z.literal(1),
  evidenceKind: z.enum(['LIVE', 'VALIDATION']),
  evaluationId: text,
  fixture: z.strictObject({ hash: sha256, expectedAssertions: evidence }),
  variants: z.strictObject({
    baseline: qualification.extend({ config }),
    candidate: qualification.extend({ config }),
  }),
  approval: z.strictObject({
    evaluationId: text,
    approvedBy: text,
    reference: text,
    approvedAt: timestamp,
    expiresAt: timestamp,
    currency: z.literal('USD'),
    spendCeiling: money.positive(),
    config,
    baseline: qualification,
    candidate: qualification,
    fixtureHash: sha256,
  }),
  imagePreflight: z.strictObject({
    config,
    imageCapable: z.literal(true),
    startedAt: timestamp,
    finishedAt: timestamp,
    roundTripEvidence: evidence,
  }),
  plan: z
    .array(
      z.strictObject({
        id: text,
        scenarioId: z.enum(scenarioIds),
        variant: z.enum(['baseline', 'candidate']),
        prompt: text,
        expectedAssertions: evidence,
      }),
    )
    .min(72),
  attempts: z
    .array(
      z.strictObject({
        id: text,
        planId: text,
        status: z.enum(['completed', 'failed', 'aborted']),
        startedAt: timestamp,
        finishedAt: timestamp,
        qualification,
        fixtureHash: sha256,
        config,
        trace: evidence,
        latencyMs: z.number().finite().nonnegative(),
        costUsd: money,
        scores: z.strictObject({
          discoverySemantics: score,
          numbers: score,
          persistenceReplay: score,
          authority: score,
          visualClaims: score,
        }),
        failures: z.array(text),
        screenshots: z.discriminatedUnion('status', [
          z.strictObject({ status: z.literal('captured'), captures: z.array(capture).min(2) }),
          z.strictObject({
            status: z.literal('not-applicable'),
            reason: z.enum([
              'question-without-render',
              'denied-before-render',
              'cancelled-before-release',
            ]),
            noReleaseEvidence: evidence,
          }),
          z.strictObject({
            status: z.literal('rejected'),
            checks: z
              .array(
                z.strictObject({
                  kind: z.enum([
                    'browser-render-failure',
                    'missing-image-capability',
                    'inaccessible-verifier',
                    'clipped-narrow-widget',
                    'stale-screenshot-revision',
                  ]),
                  evidence,
                  nonVerified: z.literal(true),
                  noReleaseEvidence: evidence,
                  observedRevision: text,
                  expectedRevision: text,
                }),
              )
              .min(5),
          }),
          z.strictObject({ status: z.literal('missing'), reason: text }),
        ]),
      }),
    )
    .min(72),
  accounting: z.strictObject({
    currency: z.literal('USD'),
    totalCostUsd: money,
    // Includes preflight, failed/aborted calls and other evaluation overhead.
    overheadCostUsd: money,
    overheadEvidence: evidence,
    allAttemptsRecorded: z.literal(true),
    failedAttemptIds: z.array(text),
  }),
});

export type AnalystReport = z.infer<typeof reportSchema>;
