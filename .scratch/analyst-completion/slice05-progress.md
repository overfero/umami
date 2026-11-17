# Slice 05 — implementation checkpoint (NOT accepted)

2026-11-18 03:25 WIB. Based on a285a1806, analyst-slice-05; integration merge check reports already up to date. No main worktree edits, deployment, model/provider calls, role/volume cleanup or credentials read.

## Implemented / checked so far

- Fixture success cleanup runs only after successful run and ownership-checked DB cleanup; exact receipt/root/nonce/DB and temp-root ownership constrain removal. Failure traces retained. New success/failure/foreign-owner tests plus existing fixture controls pass (Node20/20 combined).
- Four baseline TS findings resolved: EventsTable uses CSS style flexWrap; admin mock no longer recursively instantiates full Prisma client; MCP depends on workspace:^ APIclient so built runtime/types share nominal identity. Own offline frozen dependency install and local package build. tsc exit0; affected routes/UI10/10; APIclient23/MCP27 package tests.
- OpenAPI generation + both I2 checks exit0 (185 operations). Exact AST member inspection proves all166 old operation definitions and320 old interface members preserved byte-for-byte;19 new operations/33 interface members. No public/openapi tracked diff (ignored build artifact).
- Production fixture installs frozen in-root workspace dependencies rather than shared host symlink. Public local-resolution regression red→green. Installed Next16 official output tracing docs and Dockerfile inspected first; no framework code or arbitrary host dependency copying. Fresh build has zero27 prior external trace omissions. Dev shortcut remains explicitly non-release.
- Verifier rebuilt from Playwright1.63.0 pinned base index eff16c30e...a4a27 and npm integrity lock. Executed immutableID abeba6069b648185ba74850c923feb81f6eac3f6899f9e1ab28bf8c496777d06; image-local worker equality checked. Historical original base provenance remains unknown, never rewritten.
- First fresh D2/B3 receipt commands7/7 exit0; D2on5, off1, compatibility1, B3 1, notice1; no skips/retries. Final-source rerun underway because harness/source fingerprints changed.
- Isolated standalone smoke passed in Node22 digest-only disposable container: no checkout/host dependency mounts; all symlinks internal/resolvable; real login, SSR dashboard, persisted-analysis execute42, default-off no-image turn. Image bfceb335ec23b05e42546269fefa4b79df79c981b1b32735e2bd0d3dad4aa6ef. Actual deployment/main Dockerfile/startup scripts NOT claimed tested.
- CI uses locked Pi install actual root, local workspace artifacts, same sequential fail-closed browser proof and package-only smoke. Workflow not remotely executed.

## Recorded bounded failures / recovery

Logs under .scratch/analyst-ci-debug/slice05 (not all committed): p2-red (missing export), local-deps-red (missing export), pairing-red (new owned build root) expected TDD reds; later controls green.

Two offline pnpm attempts failed only missing metadata: nonfrozen postcss-preset-env; exact importer frozen policy-check @biomejs/cli-linux-x64. Supervisor authorized one network-enabled frozen install; passed63s, policies intact, no re-resolution. Lock change only MCP importer2lines; verifier separate npm lock excluded from pnpm workspace.

Initial isolated package relocation failed because Node cpSync default rewrote relative links into absolute build-host paths. Single authorized correction verbatimSymlinks:true passed; no dependency added/copied to repair traces. Failed context /tmp/umami-package-proof-bFKjOP retained, successful context removed after ownership-checked DB cleanup.

## Final candidate checkpoint — 2026-11-18 03:44 WIB

Final-source browser/package and strict E1 completed: all7 browser commands, D2on5/off1/compatibility1/B3 1/notice1, all14 E1 commands, PG114/CH114, proven1–12/pendingnone. Package-only final image0496b2d3...63022 executes actual42, no external/dangling symlinks or host dependency mounts. I1/I2 clean. Recovery requalification confirms1,574 strict/1,545 browser exact source hashes and command/stdout pairings; only copied JSON whitespace changed, original execution timestamps/revisions preserved. Durable evidence and detailed boundaries: `scripts/ai/analyst-evals/slice05-validation.md`, `scripts/ai/analyst-evals/evidence/slice05/`.

Required independent review remains pending before merge. CI remote run, paid evaluation/provider vision/target release are not claimed. Historical accepted E1 was not reused as fresh source evidence. No acceptance until review; no later slice started.
