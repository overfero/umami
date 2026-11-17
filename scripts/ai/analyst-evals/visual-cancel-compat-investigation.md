# Slice03 checkpoint — blocked, not accepted

This is an investigation checkpoint at integration/slice base
`217a56e0f00b859daae65738b025f1eb1986546a`. No product changes, acceptance mappings,
commit, model calls or target actions were made. The supervisor explicitly paused
implementation after the genuine image-capability regression. Scenarios10–12 and
strict E1 remain incomplete; scenarios1–9 and UTC/business-Jakarta policy are unchanged.

## Executed evidence

Machine receipt: `evidence/slice03-investigation.json`. It records exact commands,
actual shell exits, source/test/runner/parser/config fingerprints, report hashes,
and each executed **source path + full assertion name + status**. Complete raw
Vitest reports, including failure details, are retained separately:

- `evidence/slice03-reusable-vitest.json`: **6 files / 80 passed assertions**, exit0.
  A progress message incorrectly said85; the structured result is authoritative.
- `evidence/slice03-visual-capability-red.json`: **1 failed assertion**, exit1.
  `visual-capability.test.ts:absent image capability keeps screenshots out of the
  tool result and inspection unavailable` fails at the first release assertion:
  expected images to be undefined, received an image block. Later expectations
  in that test were **not reached** and must not be represented as executed proof.

Setup failure was not product red: an initial read-only marker query mistakenly
selected nonexistent column `marker`. Execution stopped before Prisma generation.
Supervisor approved one source-correct retry selecting `owner`; exact marker was
`umami-ai-synthetic-r3`, then Prisma generated only worktree-local `src/generated/prisma`.
Docker names/images/loopback ports25432/28123 were inspected; no database/schema/role
configuration or public/analyst_fixture data changed. Runtime inspected first:
conda umami Node22.23.5, Python3.12.16. Dependencies are a symlink to main's existing
node_modules; no package/lockfile edits. No project .env or key was read.

Integration ancestry check exit0; `git merge --no-edit analyst-completion` returned
`Already up to date`. No files staged; no commit authorized at checkpoint.

## Proven gap, narrow interpretation

The regression calls the real public `executeAnalystTool` with an isolated fake
metadata adapter and synthetic verifier artifact. This is **contract-only**, not
browser rendering, Docker isolation, real provider image acceptance or visual judgment.

Source trace:

1. `src/lib/ai/rpc/confinement.mjs:gatewayConfig` explicitly constructs configured
   model `input: ['text']`. There is no image preflight receipt input there.
2. `src/lib/ai/assistant/runtime.ts:runAssistant` validates that configuration and
   starts Pi. `RuntimeInput` has trusted analyst flag, no capability/preflight state.
3. `src/lib/ai/assistant/handlers.ts:runTurn` closes over `executeAnalystTool`, then
   wraps any returned image array in `ImageToolResult`; no capability check occurs.
4. `src/lib/ai/assistant/analyst/tools.ts:verifyRender` calls verifier, fetches images,
   stores `rendered_not_inspected` receipt and returns image blocks. It has no model
   capability/preflight input. `recordInspection` validates widget/hash membership,
   not configured provider image support or actual successful preflight.
5. Offline native synthetic provider has a separate scripted configuration. The
   maximal-image RPC tests measure transport/privacy, **not configured-provider vision**.
6. E2 `analyst-report/schema.ts:imagePreflight` is report validation only; it does
   not protect current runtime image release and cannot supply offline proof.

A rendered receipt is not inspected/verified, and task `complete` is not UX
`verified`. No new outcome translation is invented. The observed defect is image
release despite text-only configuration and absent preflight; the test does not
establish that the actual provider consumed an image or that final text said verified.

## Minimal proposal, NOT implemented or approved

Candidate host entry point is before the turn's tool closure, using trusted configured
model metadata and an independently executed, source/model/settings-bound successful
synthetic-image preflight receipt. Model metadata alone does not prove provider support;
missing receipt must remain unavailable. No request body, model/tool argument, arbitrary
env boolean, offline scripted provider or report-only attestation may grant capability.

Proposed interface responsibilities, names deliberately not frozen:

- Host resolver reads the **same** provider/model/reasoning/settings that runtime will
  use; verifies matching metadata, source/build identity and actual executed preflight
  evidence. Returns immutable unavailable-with-reason or available-bound-context.
- `RuntimeInput` and analyst tool input receive that trusted context, not a client flag.
  Runtime and host tool release boundaries agree; absent/mismatched evidence defaults
  unavailable. No image-bearing bridge result may bypass the release guard.
- `verifyRender`/`recordInspection` refuse model image release/inspection when unavailable.
  A working verifier may still have legitimate automated render evidence; do not call
  it inaccessible or discard valid data-readback evidence just because model vision
  is unavailable. Exact error code/receipt retention policy remains a product decision.
- `handlers.ts` must explicitly preserve the approved data-verified/visual-pending
  completion path for unsupported image inspection, distinct from real configured
  verifier failure (which must not become successful verification).
- Tests require default-unavailable, text-only, absent/failed/stale/mismatched preflight,
  attempted forged tool fields, inspection denial, no images in transient bridge,
  and valid data-pending preservation. Available path requires separately approved
  real configured-provider preflight, not a fabricated positive receipt.

Likely affected product paths: confinement/gateway model construction, runtime input/
startup and release boundary, handlers tool closure/completion evidence, analyst tools
input/render/inspection. Existing transport/privacy, authority and flags-off tests must
remain unchanged. No framework product code was edited; framework documentation
requirement remains for any later Next change. No paid preflight is authorized in03.

## Remaining coverage, not silently mapped

Existing 80 assertions executed useful overlaps: verifier absence/failure and stale
receipt completion defenses; terminal-task absorption and commit fence races;
transient-image sanitization; flags-off host no-task/no-tool behavior; native board
compatibility matrix; snapshot formatting/data immutability. They are **not** bound
as complete scenarios10–12. Exact references/status are in the receipt, not inferred
from test names. Injected adapters are explicit contract evidence only.

Still required after product decision:

-10: absent image-capability protection; fresh source-qualified actual browser+Docker
  render failure/stale revision/clipped/narrow rejection evidence and assertion bindings.
-11: query/queue/render/repair in-flight cancellation, both commit race outcomes, no
  late mutation/task revival/image or artifact leak. Existing overlaps do not prove all.
-12: explicit flags-off native board and historical snapshot invariance at highest
  useful seams, with flags-off execution not skipped. Saved AnalysisWidget execution
  alone is not native/historical compatibility proof.
- Extend offline modules/manifest/runner with source-qualified assertion acceptance,
  retained structured browser/Vitest results and runner/parser/config fingerprints;
  preserve1–9. Run strict E1 only after every subrequirement is genuinely covered.
- Independent review before acceptance/merge. Live E2/release remain separate gates.

No all12 pass, new renderer proof, configured vision proof or accepted implementation
is claimed. The new regression intentionally stays red and uncommitted; no failures
were weakened, removed, skipped or treated as absent-evidence pass.
