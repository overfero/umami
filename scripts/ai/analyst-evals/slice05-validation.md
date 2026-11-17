# Slice 05 candidate — reproducible integration evidence

Recorded **2026-11-18 03:44 WIB (Asia/Jakarta)**. Implementation commits `82980c4e6`, `4a8d2e45f`; based on integration `a285a1806`. Independent review is required; this is a **candidate**, not a release/merge approval. `git merge-base --is-ancestor a285a1806 HEAD` and `git merge analyst-completion --no-edit` exit 0 (already up to date).

## Scope / fixes

- EventsTable nonwrapping layout uses the supported CSS style prop. Regression renders actual table/event label/page link and checks both shrinkable nonwrapping ancestors. No behavior deletion or added casts/ignore directives.
- Admin 2FA regression mocks only the exercised Prisma surface with `vi.hoisted`, avoiding recursive instantiation of the entire generated client. Existing GET/POST/DELETE behavior stays covered.
- MCP's API client uses `workspace:^`; frozen lock importer points at `../api-client`. Own package artifacts are built in graph order, eliminating published/local private `fetchImpl` identity mismatch. No shared-main dependency writes.
- OpenAPI/client generated together: spec198/198 operations (179 explicit/19 inferred); public client185. All166 existing operation definitions and320 existing interface members compare exactly by TypeScript member text;19 new client operations/33 interface members. No unrelated generated semantic churn; `public/openapi.json` remains an ignored build artifact.
- Fixture cleanup removes only its real invocation-owned temp root after clean child exit and successful receipt/namespace-checked DB cleanup. Failure/ownership tests preserve traces and foreign roots; existing startup/collision controls remain.
- Built fixture installs its own frozen dependency graph and builds workspace packages inside the sanitized project. This keeps Next tracing inputs under the documented tracing root instead of following the development-only shared dependency symlink. Installed Next16 output documentation and Dockerfile were inspected before changes; no framework patch or arbitrary host dependency copy. The previous25 Next +2 styled-jsx omissions are absent from fresh build stderr.
- CI installs the lock-pinned Pi via `npm ci`, resolves its actual installed root, validates package1.4.0, generates ignored API artifacts, builds workspace artifacts, preserves inherited non-UTC API test requests, and executes the shared sequential D2on/off+B3 receipt harness plus isolated package smoke. No legacy fixture migration or silent flags-off acceptance skip. Remote workflow execution is not claimed.

## Executed evidence (conda umami; Node22, Python3.12, PG16; pnpm12.3.4)

Durable receipts and logs: [`evidence/slice05/`](evidence/slice05/). Expensive gates are not repeated after timeout recovery: exact source fingerprints were checked instead.

| Gate / exact command suffix | Observed result |
| --- | --- |
| `exec tsc --noEmit` | exit0, including after durable helper relocation; baseline four diagnostics retained in `logs/tsc-baseline.log` |
| `git diff --check` | exit0 |
| `build:openapi`, `openapi:check`, `check:api:client` | exit0; synchronized spec/client |
| `build:packages`, `test:packages` | exit0; APIclient23 + MCP27 tests |
| `exec vitest run 'src/app/(main)/websites/[websiteId]/events/EventsTable.test.tsx' 'src/app/api/admin/users/[userId]/2fa/route.test.ts' src/app/mcp/route.test.ts` | exit0;10/10 |
| `node --test scripts/ai/analyst-fixture/app.test.mjs scripts/ai/verifier/security.test.mjs scripts/ai/verifier/races.test.mjs` | exit0;20/20 |
| `exec vitest run -c scripts/ai/analyst-evals/vitest.config.ts` | exit0;35/35, none skipped; real ownership/pinned Docker controls |
| Product lifecycle/verifier subset in retained `product.json` | exit0;117 passed,1 existing native-Pi Vitest skipped; that skip supplies no acceptance proof |
| `node --import tsx --test scripts/ai/analyst-report/report.test.ts` | exit0;13/13 |
| `exec tsx scripts/ai/analyst-evals/browser-proof.ts .scratch/analyst-ci-debug/slice05/final-browser/receipt.json` | complete; all7 paired commands exit0, no timeout; D2on5/off1/compatibility1/B3 1/notice1 passed with zero skips/flakes; package smoke succeeded |
| `exec tsx scripts/ai/eval-analyst.ts --offline --strict --browser-receipt .scratch/analyst-ci-debug/slice05/final-browser/receipt.json --output .scratch/analyst-ci-debug/slice05/e1/receipt.json` | completed03:34:38WIB; proven1–12, pendingnone; all14 recorded commands exit0, including PG114/CH114, six timezone supplements and three authority runs |
| `exec tsx scripts/ai/analyst-evals/evidence/slice05/logs/qualify.ts` | recovery exit0;1,574 strict and1,545 browser source hashes match, exact nested receipt equality, seven command/stdout/report pairs, all12 coverage and re-executed immutable image byte equality |

The long browser/E1 invocations used bounded background `timeout` wrappers and incremental outputs. Their outer shell exit file was not saved; successful completion is established by their complete receipts and every recorded child exit, not a fabricated outer exit. Fresh qualification/I1 foreground exits were captured as tool results. Browser sourceRevision remains its original pre-checkpoint revision with exact dirty-source hashes; strict E1 sourceRevision is `4a8d2e45f2b3461ff070818d2820f90b711060d6`. Neither is relabeled as later execution.

## Packaging proof, not a heartbeat

Final standalone receipt `standalone.json`: observed **2026-11-18 03:27:36 WIB**, immutable package image `sha256:0496b2d3ec0e52c0d58f09a0bfa2ef038a962ce46d9ade36edfb1992dc263022`. Base `node:22.23.4-alpine@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202`.

Container build context contains only assembled Next standalone output, declared scripts/public/static copies, and smoke script. No checkout, host node_modules, or dependency mounts. Nonroot container traverses package symlinks and fails on dangling/escaping targets; actual login, SSR dashboard HTML, saved analysis creation and real PG execution **42**, default-off assistant turn with no images/completion all pass. Disposable uniquely owned PG namespace is removed after success. This demonstrates the intended standalone release package operating independently of build-host dependencies; it does **not** claim the entire main Dockerfile's migration/startup/release target was exercised.

First smoke failed because Node `cpSync` without `verbatimSymlinks:true` changed relative pnpm links to absolute host paths. `logs/package.log` and failed context `/tmp/umami-package-proof-bFKjOP` retain that failure. One authorized bounded correction preserved relative links and passed (`logs/package-corrected.log`), followed by the final-source package smoke in the browser harness. No dependency copying was used as a repair. Successful package context was removed only after DB cleanup; failed context remains.

## Verifier rebuild qualification

Historical image base provenance remains unknown. A **new** image was actually built with current Dockerfile, pinned Playwright base index `sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27`, integrity-locked `playwright-core@1.63.0` and `npm ci`. Build log retained; immutable executing ID `sha256:abeba6069b648185ba74850c923feb81f6eac3f6899f9e1ab28bf8c496777d06`. Worker/images/entrypoint source bytes match (see qualification receipt). Dockerfile, npm manifest/lock, build script hashes retained. This is unsigned local operator evidence, not signed or independently authenticated provenance. Generic qualifier's historical-provenance warning is preserved, not rewritten to fabricate history.

## Bounded recovery / evidence integrity

- Expected TDD reds: missing success-cleanup export, missing local-dependency export, new owned-build command root; subsequent green controls retained.
- Offline nonfrozen metadata failure (`postcss-preset-env`) and frozen policy metadata failure (`@biomejs/cli-linux-x64`) retained. One authorized180s network-enabled **frozen** install passed63s with supply-chain checks intact. Final frozen offline install passed; no re-resolution/security-policy disable or unrelated lock changes.
- Formatting tooling changed whitespace in the copied durable browser/E1 JSON after initial qualification. Recovery verified semantic equality with original raw execution receipts and every source fingerprint; original timestamps/revisions/command stdout are unchanged. Recovery qualification reports hashes of the final retained bytes; initial qualification log remains historical. No old execution was rehashed as a fresh run.
- Pi package/lock version is1.4.0, but upstream CLI `--version` prints1.3.0. Native launcher checks the package identity/version; actual D2 proves transport. Banner discrepancy is documented, not silently repaired or treated as a different install.
- No model/provider calls, credentials/.env reads, production DB/startup/migrations, deployment, main changes or push. Image capability remains default-off and synthetic fixture gating unchanged. UTC physical sessions/Jakarta business semantics remain covered by fresh real-engine runs.

## Remaining gate

Required independent code/evidence review before merge. CI has been exercised through its local command seams, not on a remote hosted runner. Live reasoning, actual provider vision, paid E2 and target-bound I3 release acceptance remain unclaimed and separately gated. No later slice is started here.
