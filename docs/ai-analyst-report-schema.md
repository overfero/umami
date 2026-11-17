# Analyst live-report validation contract (version 1)

This is the focused E2 report contract for [lifecycle spec §7](../wiki/specs/analyst-dashboard-lifecycle.md#7-acceptance-scenarios-and-evaluation). It does not describe an executed live evaluation. Live spending and broad rollout remain separately gated.

## Run the checks

```sh
source /home/overfero/miniconda3/etc/profile.d/conda.sh
conda activate umami
npx --yes pnpm@12.3.4 exec tsx --test scripts/ai/analyst-report/report.test.ts
npx --yes pnpm@12.3.4 exec tsx scripts/ai/eval-analyst.ts --check-report <report.json>
```

The CLI only reads the named JSON file. It does not read `.env`, connect to a database, call a model, fetch artifacts, spend money, or deploy. Missing files, malformed JSON, invalid/partial evidence, and `evidenceKind: "VALIDATION"` exit 1. Only a complete declared `LIVE` report can exit 0. CLI success means **recorded evidence checks passed**, not independently authenticated authorization or proven rollout readiness.

The test factory `scripts/ai/analyst-report/validation-fixture.ts` creates synthetic **VALIDATION-only** input. Tests temporarily mark one generated object `LIVE` to exercise the successful CLI branch. Its provider, approvals, hashes, captures and measurements are invented test data, **not live evaluation evidence**. Do not publish that object as an evaluation receipt. Pure `validateReport(unknown)` accepts either evidence kind structurally; the CLI additionally requires `LIVE`.

## Authoritative schema and fields

`scripts/ai/analyst-report/schema.ts` exports the strict Zod `reportSchema` and inferred `AnalystReport` type. Unknown keys are rejected. `validate.ts` adds cross-record checks; passing the shape schema alone is insufficient. All required text is nonblank; revisions are full 40/64 lowercase hex, hashes/digests use `sha256:<64 lowercase hex>`, machine timestamps are ISO UTC datetimes compared as instants. Human-readable reports should display Asia/Jakarta (WIB, UTC+07:00); for example `2026-01-01T00:00:00Z` is 1 January 2026 07:00 WIB, not Jakarta midnight. Old summary-only `{passes,total}` reports are intentionally incompatible.

- `schemaVersion: 1`, `evidenceKind: LIVE | VALIDATION`, `evaluationId`.
- `fixture`: hash and independently authored `expectedAssertions` reference+SHA-256. Every plan entry also names its independent expected assertions. These must be maintained independently of model output; the validator does not inspect their contents.
- `variants.baseline` and `.candidate`: source revision, immutable image digest, and `config` with provider, model, reasoning level and nonempty JSON `settings`. Settings must explicitly record every configured inference parameter (including defaults, token limits, sampling and relevant tool/image options). Baseline/candidate, approval, preflight and every attempt must have identical configs, independent of object-key order. Source/images can differ between variants.
- `approval`: evaluation ID, approver, durable reference, approval/expiry timestamps, `USD` positive finite spend ceiling, config, both source/image qualifications and fixture hash. These bindings must match the evaluation. Each attempt must start after approval and finish before expiry, without reversed timestamps. Expiry is checked at execution time, not validation wall-clock time: historical runs do not become invalid merely because review is later. Record approval **before any paid calls**, including preflight/overhead.
- `imagePreflight`: matching config, `imageCapable: true`, round-trip evidence reference+hash, and start/end timestamps within recorded approval and before scenario attempts. This declares an actual model image-block round-trip, not merely a renderer screenshot or automated receipt.
- `plan`: unique run ID, canonical scenario ID, variant, ordinary-language prompt, expected assertion reference+hash. At least three entries for **each** scenario/variant: minimum 72.
- `attempts`: unique attempt ID and unique planned run ID, status (`completed`, `failed`, `aborted`), execution timestamps, source/image qualification, fixture hash, exact config, retained trace reference+hash, finite nonnegative `latencyMs` and `costUsd`, separate scores, failures and screenshot coverage. Every planned run must have exactly one attempt; no extra/unplanned attempts. Model retries/failed/aborted executions need distinct planned IDs and retained records; they cannot replace earlier failures.
- `scores`: discovery/semantics, numbers, persistence/replay, authority and visual claims, each with `outcome: pass | fail | unknown` and evidence. Latency and cost are measured separately, not collapsed into a quality score. Every required run must complete and every dimension must pass; `unknown`, retained failures, or aborted/failed runs block acceptance. A safety denial can correctly pass its expected assertions. A deliberately rejected screenshot is not itself a failed scenario.
- `accounting`: `USD`, finite nonnegative measured total and overhead costs, overhead evidence, `allAttemptsRecorded: true`, and exact `failedAttemptIds` ledger. Total equals all attempt costs plus overhead (floating-addition tolerance 1e-9 USD) and cannot exceed approval. Include failed calls, image preflight and other billable overhead; zero cost is permitted only when actually measured free. Total zero does not waive minimum runs. All declared failures are retained and block acceptance, even beyond the minimum three runs.

## Canonical scenarios and screenshot coverage

IDs map one-to-one to originating §7, in order. IDs alone do not prove subrequirements: independent expectations, trace and assessments must cover the full originating scenario.

| §7 | ID | Required behavior |
| --- | --- | --- |
| 1 | `staff-activity-dashboard` | Exact observed labels, identified totals, occurrences, separate product/ops |
| 2 | `replay-after-restart` | Real process restart, saved semantics, rolling vs fixed fresh data |
| 3 | `numeric-property-aggregate` | Numeric metric/table; unsupported series rejected |
| 4 | `zero-missing-topn` | Zero/missing/no coverage/capped distinctions |
| 5 | `reuse-vs-reject-analysis` | Semantic reuse without wrong population/filter substitution |
| 6 | `material-ambiguity` | Meaningful question and automatic source/schema discovery |
| 7 | `unauthorized-revoked` | Foreign/stale/revoked references denied at every boundary |
| 8 | `duplicate-commit-idempotency` | Idempotency, conflict and atomic partial-failure behavior |
| 9 | `bypass-confirmation-existing-board` | Edit/share/delete aliases; declined/stale approvals unchanged |
| 10 | `visual-verification-failure-states` | All five negative visual states remain non-verified |
| 11 | `cancellation` | Query/commit/queue/render/repair cancellation without leaks/mutations |
| 12 | `flags-off-compatibility` | Native boards and historical snapshots unchanged |

`screenshots.status` is a discriminated union:

- `captured`: one or more explicit verification `jobs` and uniquely identified `captures`, covering both desktop (width ≥1024) and narrow (width ≤480) across the run. Each capture has a `jobId`; repeated viewport panels are allowed for pagination/cropping with overlap. Each job permits **one to six images total across all its viewports**, per originating §4.2—not six per viewport, and not six per entire scenario run. Multiple jobs (including rerenders) can therefore produce more than six images in a run; every declared job must have captures, and every declared viewport must have coverage. Duplicate job/capture IDs, orphan captures and inconsistent bindings fail. Jobs bind attempt ID, source/image/fixture, board/widget revisions, receipt reference+hash, start/end instants within the attempt, and viewport dimensions. Captures must match their job viewport dimensions/revisions, occur within the job, and retain positive pixel dimensions, artifact reference+hash, source/image/fixture binding, board/widget revisions equal to expected current revisions, capture and inspection timestamps within the attempt and in order. Each has a separate `automatedReceipt` and a **model** inspection with outcome and evidence. Only `pass` inspection is accepted. Automated render receipts are not visual understanding; human review cannot substitute for configured-model inspection. Human review remains an independent release-review responsibility, not a claimed field here. Identical artifact hashes are allowed: differing bytes alone would not prove responsive correctness.
- `not-applicable`: allowed only for scenario 6 `question-without-render`, 7 `denied-before-render`, or 11 `cancelled-before-release`, with required `noReleaseEvidence`. This is not a general free-text escape hatch. Use captures when those scenarios actually release images; use no-release evidence only when the exercised path correctly does not.
- `rejected`: required for scenario 10 only, with all five unique checks: `browser-render-failure`, `missing-image-capability`, `inaccessible-verifier`, `clipped-narrow-widget`, `stale-screenshot-revision`. Each retains evidence, no-release evidence, `nonVerified: true`, observed and expected revision. The stale negative control must have mismatched revisions. These negative paths must not require a successful inspection or release an image that should be withheld. Trace/expectations must prove the correct non-verified outcome; this does not claim the live model inspected an unavailable image.
- `missing`: may record a reason, but always fails acceptance. Unknown inspection also fails. Do not silently convert missing coverage to N/A or verified.

## Honest trust boundary

This is a deterministic, pure consistency/completeness gate on **supplied records**, not an attestation service. Job IDs and receipt references are declared provenance, not authenticated job execution. The image-count budget is checked per declared job; image byte sizes, overlap geometry and complete canvas coverage must be reviewed against worker receipts/artifacts and are not established by count or viewport labels alone. Renderer receipts expose per-panel viewport/hash/offset records; map these to capture IDs and bind the actual verification job ID from job execution evidence. Do not invent job boundaries to evade the six-image cap. Negative-state and N/A records retain their separate evidence rules; this capture-job representation does not turn a withheld image into a successful capture. It cannot authenticate an operator, cryptographically prove approval, enforce a budget before calls, establish provenance from hash syntax, verify that referenced artifacts exist/match hashes, assess natural-language assertion quality, discover unrecorded model calls, or detect fabricated traces/costs/screenshots. The complete plan/attempt/failure ledger catches omitted **declared** work; a self-consistent fabricated ledger can still pass. Independent reviewers must compare durable approval, provider billing/call logs, source/image/fixture artifacts, expected assertions, trace assessments and screenshot receipts to the report, and confirm no calls/failures were omitted. No evaluator may cherry-pick successful runs or reclassify an actual failure as an expected negative test after the fact.

A report checker cannot grant spend or target approval. Actual live evaluation and release gates remain pending until separately approved and executed. Offline tests and these synthetic validator tests prove neither live reasoning nor live image understanding.
