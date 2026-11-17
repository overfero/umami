# Slice03 frontier validation — strict E1 executed, review required

Fresh completed machine evidence:
- `evidence/slice03-frontier-e1.json`: complete strict result, **actual exit0**, all12,
  no pending groups; full14 subprocess outputs and structured Vitest/browser reports.
- `evidence/slice03-frontier-browser.json`: fresh build + serialized browser phases,
  full commands/exits/reports and source fingerprints.
- `evidence/slice03-frontier-validation.json`: concise commands/counts/hashes/limitations.
- Previous first strict pass retained as `slice03-frontier-first-e1.json`; initial parser
  missing-module red retained; historical product/setup failures unchanged.

## Exact executed commands

Conda executable `/home/overfero/miniconda3/bin/conda run -n umami`,
`PG_BIN=$CONDA_PREFIX/bin`; Node22.23.5, Python3.12.16, pinned pnpm12.3.4.

1. `npx --yes pnpm@12.3.4 exec tsx scripts/ai/analyst-evals/browser-proof.ts /tmp/analyst-slice03/frontier-browser.json`
   **exit0**. Fresh sanitized production build sourcebdeadf2e6, manifest buildID
   ca62403d-dfec-4608-afd3-bb6f54a684ae; actual full40hex source/manifest hash retained.
   D2 flags-on **5passed**, sequential persisted flags-off **1passed**, actual native/
   historical snapshot **1passed**, B3 actual renderers Docker **1passed**, visible
   notification mouse+keyboard desktop/narrow **1passed**. No retried/failed/skipped
   test supplies an assertion. Native Pi uses scripted offline provider, no live calls.
2. `npx --yes pnpm@12.3.4 exec tsx scripts/ai/eval-analyst.ts --offline --strict --browser-receipt /tmp/analyst-slice03/frontier-browser.json --output /tmp/analyst-slice03/frontier-final-e1.json`
   **exit0**, all12. Browser reused only after exact current src/packages/prisma/db,
   runner/parser/config/fixture/test SHA256 equality; raw report/exits checked again.
   All14 other commands fresh: PG114 + CH114, six supplements (both engines ×UTC/
   Jakarta/NY), three authority runs, evaluator32passed, product102passed/1skipped,
   authority reusable14passed. Both real metadata commit/cancel linearizations and
   six serial/concurrent race assertions executed on each engine path.
3. `node --test scripts/ai/assistant-tools.test.mjs scripts/ai/verifier/*.test.mjs`
   **exit0**,16passed.
4. `npx --yes pnpm@12.3.4 exec tsc --noEmit`: initially **exit2** with3new test-env
   inference errors +3existing unrelated errors. Added typed test NODE_ENV (no runtime
   behavior change), reran strict E1 afterward. Final tsc **exit2**, only existing
   EventsTable46/54 unsupported flexWrap and admin2fa route.test61 deep instantiation.
   No changed-path diagnostics; integration05 owns these. Full diagnostics retained.
5. `git merge --no-edit analyst-completion`: Already up to date at217a56e0f.
   `git diff --check`: exit0. No staged files at final report.

`lifecycle-evidence.ts` is the exact requirement map; `coverage.md` gives independent
expected outcomes/seam boundaries. Parser controls reject absent/wrong source,
failed/skipped/empty reports, command failure, source drift and failed browser retry.
No assertion-file presence or taxonomy name is a pass. Legacy1–9 preserved.

## Packaging and operational boundary

The fresh standalone artifact includes matching canonical manifest/BUILD_ID. Copied
only scripts/public/static declared in Dockerfile; executed `server.js` in its own
cwd with normal authenticated chat+turn routes and missing preflight, verifying no
image envelope, rendered receipt or complete claim. No migrating startup script.
This route runs AI disabled: it is **not** successful data execution nor configured
provider vision proof. Invalid/mismatched receipts are resolver unit coverage only.

Standalone uses explicit shared read-only dependency links. Next warned27 trace files
outside sanitized root:25Next server pages/runtime contexts and2styled-jsx entrypoints.
Exact paths are in browser receipt. Actual route/browser/B3 exercised required modules,
but this is **not hermetic Docker packaging/release proof**. No random host dependency
copy, global trace-root/security relaxation or deployment changes made.

All DB namespaces nonce/marker/owner guarded and dropped. Collision/nonowned cleanup
negative canary passed unchanged and legacy analyst_fixture marker/oid unchanged.
No public/legacy fixture writes, global session/role changes, volume deletion, key/.env
reads or paid calls. UTC pool policy/business Jakarta semantics unchanged.

At resume13 dirty files were formatter-only. Transpiled AST equivalence ignoring
commas/trivia established for each, verification retained. Preserved in commitbdeadf2e6;
no failures/assertions weakened. Source hashes rechecked against final E1 after run.

## Acceptance boundary

Strict deterministic E1 is green; **independent source/manifest/security/UI review is
still required before merge**. Actual provider image preflight, live E2 and target-bound
release remain later separately approved gates. No positive live preflight attestation
was fabricated; host capability still defaults unavailable without real reviewed evidence.
