# Slice 06: guarded synthetic release smoke

Implementation complete locally; **independent review required before merge**. Not actual release acceptance. No production/key/.env/SSH/deployment/provider inspection or calls.

## Contract and scope

Read completion spec, ticket06, originating lifecycle I3/review focus, accepted integration-slice05 and release-smoke/vision/fixture prior art; TDD skill and testing/mocking references. Supervisor explicitly approved tooling-only operational-attestation contract because heartbeat has no deployed source/image/flag introspection; no production route changes. Public CLI/local disposable request seams were pre-approved. Runtime source/build/verifier facts remain operator-attested, never cryptographic provenance. Runtime heartbeat/auth/ingest/storage checks remain distinct. Details and strict input contract: `scripts/ai/release-smoke/analyst-smoke.md`.

Implementation commit **4e9ce489b60f4ad07cee4c2e255674e5513930b7** on `analyst-slice-06`; unsigned per command, hooks intact. Seven new tooling/test/doc files only; no dependency/lock/product/generated tracked delta. Integration ref verified `23812fb0e70ae950d45c56e63976f28d9917af6d`; `git -c commit.gpgsign=false merge analyst-completion` reported `Already up to date.` No integration/main branch write/push.

## TDD evidence

- Missing-approval public CLI initially failed because deliverable absent; minimal CLI produced fixed refusal, no request, no credential exposure.
- Positive disposable protocol server initially failed guard stub; implementation then observed heartbeat, auth denials, principal, unique website, both marker events, stored readback and bounded ownership cleanup.
- Duplicate JSON approval regression initially reached runtime (`runtime-preflight-failed` instead of `guard-rejected`); duplicate-key rejection fixes ambiguity, including decoded keys. Failed red contaminated the shared negative counter, causing subsequent negative failures; full clean rerun passes.
- Actual sanitized Next + unique owned PG initially failed `ingest-storage-failed` despite HTTP200, cleanup succeeded. Cause: Node fetch user agent triggers app bot acknowledgement without storage. Explicit synthetic browser userAgent added (no disabling bot check); bounded recovery passed actual storage. First failed owned fixture retained at `/tmp/umami-analyst-fixture-mtMlg0`, schema `analyst_fixture_a600556c1561a7d39ab39536`; no cleanup of this failure evidence performed. Later successes cleaned only their own independently marker-qualified new namespace/project. This was a real behavioral red, not a setup failure.

## Environment / setup outcomes

Conda `umami`: Node **22.23.5**, Python3.12, PG16 tooling. All pnpm commands use `npx --yes pnpm@12.3.4` with `/home/overfero/miniconda3/envs/umami/bin` first on PATH. Frozen worktree install, normal policy checks, exit0; no shared node_modules mutation/symlink or broad dependency change. `build:packages` exit0 (workspace graph ordered).

Fresh I1 initially exit2 because gitignored Prisma output absent. One bounded recovery copied generated Prisma client from this run's own sanitized fixture after `cmp` proved identical schema bytes. Subsequent and final I1 exit0. Fresh I2 initially exit1 solely absent gitignored `public/openapi.json`; one normal `build:openapi` recovery generated spec/client and both checks exit0, no tracked changes. No source diagnostic or contract relaxation.

## Final committed-source validation

Logs/exits/source map retained at `.scratch/analyst-ci-debug/slice06/`. Tests executed at implementation commit4e9ce489b; later evidence/docs commit does not alter runtime bytes. Full source runtime/build hash map: **1,928 files**, ordered-map SHA256 **1e2c892e75a28128893363ba163edae09aced2d993d35879e90babccae1c45cc**. Historical execution revision is retained honestly, not relabeled as a future tip.

| Exact command (conda PATH above) | Exit / result |
| --- | --- |
| `npx --yes pnpm@12.3.4 install --frozen-lockfile` | 0; 713ms, checks intact |
| `npx --yes pnpm@12.3.4 build:packages` | 0; API client then MCP runtime/types |
| `node --import tsx --test scripts/ai/release-smoke/release-analyst-smoke.test.ts` | **0**,42 passed,0 skipped; guard no-request controls, unknown/missing evidence, duplicate JSON, redirect/cross-origin/schema URL handling, secret redaction, token-file/base-path positive, storage/ownership/cleanup negatives |
| `PG_BIN=/home/overfero/miniconda3/envs/umami/bin node --import tsx --test scripts/ai/release-smoke/release-analyst-smoke.app.test.ts` | **0**,1 passed,0 skipped; actual Next routes + unique disposable PG; heartbeat,401/401, real ingest200/200 AND2 stored event IDs, ownership cleanup;26.02s |
| `npx --yes pnpm@12.3.4 exec tsc --noEmit` | **0** final I1 |
| `git diff --check` | **0** |
| `npx --yes pnpm@12.3.4 build:openapi` | **0**, spec198/198,client185; no tracked generator delta |
| `npx --yes pnpm@12.3.4 openapi:check` | **0** final I2;183 explicit/15 inferred |
| `npx --yes pnpm@12.3.4 check:api:client` | **0** final I2;185 up to date |
| `node --test scripts/ai/analyst-fixture/app.test.mjs scripts/ai/verifier/security.test.mjs scripts/ai/verifier/races.test.mjs` | **0**,20 passed,0 skipped |
| `npx --yes pnpm@12.3.4 test:packages` | **0**,API25/MCP27 |
| `npx --yes pnpm@12.3.4 exec tsx scripts/ai/release-analyst-smoke.ts --synthetic-only --require-ingest` | **1 expected refusal**, `guard-rejected`, cleanup `not-created`; no approval/target/credential supplied |
| `git -c commit.gpgsign=false merge analyst-completion` | **0**,already up to date |

Fingerprints at final tests:
- CLI source: `fca4383b9e38498964e40e0749db39a9c49080d46684b6fd06fb64ba4aba4ca6`
- contract source: `01bc3334d4db900a5a99950e7ee34ab142a8331cd4f67c408378bcc4fce0be98`
- input qualifier source: `2e9928ecb5d908fcf1580c7bf0d78cc18b8a0ca2495bbcf55d46e60fc20d3ec1`
- `cli.log`: `54431aafd9175375bb4aff5d07aaed3b277a30f1785a90d0455a5d924689c83e`
- `app.log`: `d533b5669e34ce2ce8a885b79e18619522c741e64509a5d120a2c5d0743689d5`
- `source.json`: `e3e85e2121b75250a1123be046d5e75ef3a7a707c5c13e76755e77a61f2f615d`

## Trust limits / remaining gates

All test image/build/verifier records are explicitly invented **protocol-only** facts, even in the test using real app+storage. No actual verifier image/preflight executed by this slice; underlying verifier/security tests are not configured-provider vision. No mocked response counted as actual storage; only real Next/PG app test claims local storage. Runtime output separates `readinessReported` and `runtimeObserved`, with explicit unsigned operational-attestation disclaimer. Flags are expected/readiness-equal, not inferred from heartbeat or toggled. No provider calls made, no fabricated actual-provider positive receipt; missing required receipt fails before network.

Actual target-bound I3, provisioned/qualified actual provider image preflight,07 paid baseline/candidate evaluation under separately approved cumulative budget, hosted CI, full main-Dockerfile startup/deployment, authenticated rendered-dashboard/visual review, backups and compatible rollback and08 final independent release review remain pending. Existing production selection and later US$25 budget do not authorize any production action in06. Independent review must accept slice06 before integration merge. No staged files left after commits.
