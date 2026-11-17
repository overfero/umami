# Slice 05 — accepted integration

**2026-11-18 04:42 WIB:** independent ACCEPT `19a2e99f-22f4-4c9f-a8b0-2b526d55272e`, committed tip `15bfb944a`, merge `3f295eb3a65b853f7a7defc085ff5705ae6fc9db`. Ticket05 resolved with fresh MAIN I1/I2, frozen workspace install/build, API-client25/MCP27/affected40/fixture20/evaluator37 and historical receipt requalification (all exit0). [Integration record](integration-slice05.md) supersedes pending-review/checkpoint language below; original execution boundaries preserved. Remote CI/full main-Docker startup and target release gates remain outstanding; no release-complete claim or next-ticket launch.

## Historical implementation checkpoint (pre-acceptance)

2026-11-18 03:25 WIB. Based on a285a1806, analyst-slice-05; integration merge check reports already up to date. No main worktree edits, deployment, model/provider calls, role/volume cleanup or credentials read.

## Implemented / checked so far

- Fixture success cleanup runs only after successful run and ownership-checked DB cleanup; exact receipt/root/nonce/DB and temp-root ownership constrain removal. Failure traces retained. New success/failure/foreign-owner tests plus existing fixture controls pass (Node20/20 combined).
- Four baseline TS findings resolved: EventsTable uses CSS style flexWrap; admin mock no longer recursively instantiates full Prisma client; MCP depends on workspace:^ APIclient so built runtime/types share nominal identity. Own offline frozen dependency install and local package build. tsc exit0; affected routes/UI10/10; APIclient23/MCP27 package tests.
- OpenAPI generation + both I2 checks exit0 (185 operations). Exact AST member inspection proves all166 old operation definitions and320 old interface members preserved byte-for-byte;19 new operations/33 interface members. No public/openapi tracked diff (ignored build artifact).
- Production fixture installs frozen in-root workspace dependencies rather than shared host symlink. Public local-resolution regression red→green. Installed Next16 official output tracing docs and Dockerfile inspected first; no framework code or arbitrary host dependency copying. Fresh build has zero27 prior external trace omissions. Dev shortcut remains explicitly non-release.
- Verifier rebuilt from Playwright1.63.0 pinned base index eff16c30e...a4a27 and npm integrity lock. Executed immutableID abeba6069b648185ba74850c923feb81f6eac3f6899f9e1ab28bf8c496777d06; image-local worker equality checked. Historical original base provenance remains unknown, never rewritten.
- First fresh D2/B3 receipt commands7/7 exit0; D2on5, off1, compatibility1, B3 1, notice1; no skips/retries. Final-source rerun underway because harness/source fingerprints changed.
- Isolated standalone smoke passed in Node22 digest-only disposable container: no checkout/host dependency mounts; all symlinks internal/resolvable; real API login, dashboard application-shell HTML response (not authenticated content rendering), persisted-analysis execute42, default-off no-image turn. Image bfceb335ec23b05e42546269fefa4b79df79c981b1b32735e2bd0d3dad4aa6ef. Actual deployment/main Dockerfile/startup scripts NOT claimed tested.
- CI uses locked Pi install actual root, local workspace artifacts, same sequential fail-closed browser proof and package-only smoke. Workflow not remotely executed.

## Recorded bounded failures / recovery

Logs under .scratch/analyst-ci-debug/slice05 (not all committed): p2-red (missing export), local-deps-red (missing export), pairing-red (new owned build root) expected TDD reds; later controls green.

Two offline pnpm attempts failed only missing metadata: nonfrozen postcss-preset-env; exact importer frozen policy-check @biomejs/cli-linux-x64. Supervisor authorized one network-enabled frozen install; passed63s, policies intact, no re-resolution. Lock change only MCP importer2lines; verifier separate npm lock excluded from pnpm workspace.

Initial isolated package relocation failed because Node cpSync default rewrote relative links into absolute build-host paths. Single authorized correction verbatimSymlinks:true passed; no dependency added/copied to repair traces. Failed context /tmp/umami-package-proof-bFKjOP retained, successful context removed after ownership-checked DB cleanup.

## Final candidate checkpoint — 2026-11-18 03:44 WIB

Final-source browser/package and strict E1 completed: all7 browser commands, D2on5/off1/compatibility1/B3 1/notice1, all14 E1 commands, PG114/CH114, proven1–12/pendingnone. Package-only final image0496b2d3...63022 executes actual42, no external/dangling symlinks or host dependency mounts. I1/I2 clean. Recovery requalification confirms1,574 strict/1,545 browser exact source hashes and command/stdout pairings; only copied JSON whitespace changed, original execution timestamps/revisions preserved. Durable evidence and detailed boundaries: `scripts/ai/analyst-evals/slice05-validation.md`, `scripts/ai/analyst-evals/evidence/slice05/`.

Independent review REJECTED8d33f3e3e: assistant generated body metadata P1 and qualifier/packaging-claim P2s. Corrected with curated JSON/SSE contracts plus regenerated client/public transport tests, strict historical evidence reconstruction/adversarial controls, and application-shell-only HTML wording. Fresh targeted I1/I2/package/handler/qualifier checks pass; original full receipts remain unchanged historical evidence, not current-source reruns. See `scripts/ai/analyst-evals/slice05-review-corrections.md`. Rereview required before merge; no live/release claims or later slice.
