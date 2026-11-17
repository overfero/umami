# Slice03 implementation checkpoint — incomplete / paused

Supervisor changed mode back to INVESTIGATE after Docker fixture setup failed.
No fixture repair, rerun or commit was performed after that instruction. Base and
integration remain217a56e0f00b859daae65738b025f1eb1986546a. All changes uncommitted;
no staged files. Original investigation/red report preserved; old reusable count80,
not85. New reports are in `evidence/slice03-implementation-checkpoint.json` and its
six referenced complete structured Vitest reports. That receipt fingerprints current
source/test/parser/config files and enumerates exact sourcepath/assertion/status.
It is **not complete acceptance evidence** and records testing-order limitations.

## Changes implemented before pause

- Opaque WeakMap host grants default unavailable; host file path+expected digest,
  strict receipt keys/configuration/settings/build/policy/expiry/evidence hashes.
  Bounded regular-file reads, no symlink/parent-symlink acceptance, generic failure.
- Real configured provider remains text-only without valid host-attested preflight.
  Same host context enters tool closure/runtime/model declaration/release guard.
- Tool image release/inspection unavailable returns image_capability_unavailable /
  visual_pending. Handler permits that data-only completion only after matching
  successful saved readback; configured verifier failure remains ineligible.
- Build-time canonical policy manifest via Next generateBuildId and output tracing;
  Docker already copies generated directory. Production never reads git/TS source.
  Actual standalone/package/build behavior has **not been validated** yet.
- No network/credential preflight CLI. Explicit metered-adapter challenge interface
  retains measured outcome/hashes without writing capability receipts automatically.
- Existing image contract tests explicitly inject synthetic opaque capability; this
  is not actual provider image preflight and has no environment-selected fallback.
- Added query/repair/artifact-fetch cancellation contracts and flags-off native config/
  historical Jakarta snapshot DOM contracts. Injected components/artifacts explicitly
  remain contract-only, not native browser or model visual evidence.

Operator trust: path+digest verifies operator-provisioned bytes, not independent proof
vision executed or authenticated deployed identity. Release must review challenged
image/result/cost evidence and verify manifest/build/source/image equality before
provisioning a positive receipt. No positive receipt generated here, no paid calls,
keys, deployment or database mutation.

## Commands / actual results

Every Vitest command below ran under
`/home/overfero/miniconda3/bin/conda run -n umami npx --yes pnpm@12.3.4 exec`.
Outputs used JSON reporter and `/tmp/analyst-slice03/<name>.json`; complete files now
retained as `evidence/slice03-<name>.json`.

| Suffix command | Exit | Outcome |
| --- | --- | --- |
| `vitest run -c scripts/ai/analyst-evals/vitest.config.ts scripts/ai/analyst-evals/image-capability.test.ts --reporter=json --outputFile=/tmp/analyst-slice03/resolver-red.json` |1| Missing resolver module; zero executed assertions, test-first module red, not original product regression. |
| `vitest run -c scripts/ai/analyst-evals/vitest.config.ts scripts/ai/analyst-evals/image-capability.test.ts scripts/ai/analyst-evals/visual-capability.test.ts --reporter=json --outputFile=/tmp/analyst-slice03/gate-green.json` |0|4passed; original public-tool capability regression now green. |
| `vitest run src/lib/ai/assistant/analyst/analyst.test.ts src/lib/ai/assistant/analyst/handlers.test.ts src/lib/ai/assistant/runtime.test.ts --reporter=json --outputFile=/tmp/analyst-slice03/product-gate.json` |0|90passed,1existing native-Pi test skipped (91total), not91executed. Before later handler-negative/cancel additions. |
| `vitest run src/lib/ai/assistant/analyst/analyst.test.ts --reporter=json --outputFile=/tmp/analyst-slice03/cancellation.json` |0|29passed, including new query/repair/fetch cancellation contracts. |
| `vitest run -c scripts/ai/analyst-evals/vitest.config.ts --reporter=json --outputFile=/tmp/analyst-slice03/evaluator-gate.json` |0|23passed; before Docker test was added. |
| `vitest run -c scripts/ai/analyst-evals/vitest.config.ts scripts/ai/analyst-evals/docker-visual.test.ts --reporter=json --outputFile=/tmp/analyst-slice03/docker-visual.json` |1|invalid_scope before Docker launch; setup failure, no renderer proof. |
| `git diff --check` |0|Passed at checkpoint. |
| `git diff --cached --name-only` |0|Empty. |

The Docker command first inspected runtime Node22.23.5/Python3.12.16, existing
verifier image sha256:cc36eef3f9bc243ac472c47a3e10cc77a308ee398d423c5f5fc75b19bbefb30f,
and owned PG/CH container names. No host/container conflict or marker mutation.

## Diagnosed Docker fixture-only setup correction, NOT applied

`capability.mjs:validScope` requires analysisRevisions object with **at least one**
entry, each integer>=1. New fixture supplied `{}`. `port.render` failed at
capabilities.issue before dispatcher/worker/browser launched. Minimal intended test
fix: scope.analysisRevisions `{ synthetic:1 }` AND same object in fixture canvas
receipt. No product validator change, no relaxation. Supervisor paused before repair.

## Pending before acceptance

- Apply fixture-only correction when implementation resumes, then actual Docker
  desktop/narrow/error/stale/clipped/narrow-only-clipped proof. New test currently
  breaks whole evaluator config selection; do not skip it or claim green E1.
- Fresh combined tests including latest handler-negative additions; runtime negative
  image-grant test, expiry-at-release race, explicit no-images/no-inspection assertions.
- Review synthetic constructor reachability and build manifest/file trust/expiry
  edge cases; test actual standalone packaging and startup behavior. Current build
  source URL/BUILD_ID are operator assertions, not independent source authentication.
- Queue/render active cancellation + no artifacts, real commit-boundary rollback
  proof, existing terminal-task behavior and scopes source-qualified in offline map.
- Bind and execute all scenario10–12 subrequirements at highest useful seams; no
  assertion mapping/runner extension yet. Existing1–9 unchanged, not freshly rerun.
- Strict E1, independent review and source qualification required. No twelve-scenario,
  real vision, native AnalysisWidget browser or release acceptance claimed.

No TypeScript/integration/workflow/live-runner/release lane changes made. Next local
output/standalone and generateBuildId guides read before framework config edit.
