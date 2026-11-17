# 05: Make all integration gates reproducible and clean

**What to build:** Make all integration gates reproducible and clean as an independently verifiable end-to-end slice of the approved completion spec.

**Blocked by:** 03, 04

**Status:** resolved

- [x] Resolve every TypeScript diagnostic, including UI/admin/MCP, narrowly with affected regression evidence.
- [x] Generate and check synchronized OpenAPI/client artifacts without unrelated changes.
- [x] CI resolves actual Pi installation, builds required workspace artifacts and executes sequential D2 flags-on/off plus B3 without silent acceptance skips (local execution seams/retained receipts; remote hosted CI remains unexecuted).
- [x] Final I1/I2 checks and affected E1/A–D regressions pass; capture source-qualified receipts (fresh merged scoped checks plus explicitly historical strict/browser/package reuse).

## Required integration followups from accepted slice 03

Recorded **2026-11-18 02:35 WIB (Asia/Jakarta)**; [accepted integration summary](../integration-slice03.md), merge `3f82dfb4b58f6fada937960815746212a2031f15`. These were **required**, not optional notes or fixes supplied by that merge. Descriptions below preserve the historical baseline; completed resolution/evidence is in **Answer**:

- [x] **P2 successful fixture temp build-tree cleanup:** final independent ACCEPT (`ef607777-eb18-4c2c-a2fa-8937ba9e43f2_reviewer_output.md`) identifies `scripts/ai/analyst-fixture/app.mjs:198–204,264–279`: ordinary successful child shutdown cleans the owned DB namespace but leaves its sanitized temporary project/build tree. After successful ownership-checked database cleanup on clean exit, remove only that invocation's owned project; preserve failed compiler traces. Add a clean-success removal regression and retain startup failure/namespace ownership controls. Earlier schema-startup cleanup P2 is fixed; this new successful-run filesystem cleanup P2 is **not**.
- [x] **Packaging before release:** explicitly resolve or qualify the existing **25 Next + 2 styled-jsx external trace omissions/shared dependencies** and demonstrate the intended release packaging without silently relying on shared build-host dependencies. Current accepted standalone/default-off evidence is **nonhermetic**, not deployment readiness. Do not promote synthetic image grants, default-off route success or unsigned/operator-controlled receipts to actual provider vision or authenticated build provenance. Original verifier base/build correspondence remains unknown despite pinned executing worker/entrypoint byte equality.
- [x] **Keep all TypeScript/UI/admin/MCP work:** merged `tsc --noEmit` exit 2 reproduces EventsTable.tsx:46/54 `flexWrap`, admin/users/[userId]/2fa/route.test.ts:61 excessive instantiation, and mcp/route.ts:28 local/published API-client `fetchImpl` private type identity (four diagnostics). Source acceptance environment had three; MCP remains the known integration workspace-artifact baseline, not fixed here. Build required workspace artifacts reproducibly and narrowly resolve every diagnostic with affected tests; do not claim I1 pass until clean.
- [x] **Keep OpenAPI/client synchronization and actual Pi/CI gates:** generate/check synchronized OpenAPI and API-client artifacts, actual installed Pi resolution and workspace builds, sequential D2 flags-on/off plus B3 without silent acceptance skips, final I1/I2 and affected E1/A–D. Retain source-qualified evidence. The existing skipped native-Pi Vitest is not a substitute for D2 execution.

Accepted slice 03 strict receipt proves all twelve **deterministic** scenario groups; no live reasoning/provider vision, hermetic packaging, paid evaluation or full-release acceptance follows. Parent starts this slice separately after integration review.

## Answer

Resolved **2026-11-18 04:42 WIB** by accepted committed slice05 `15bfb944ae52eab819d086a19a9f03be23d59f85`, merge **`3f295eb3a65b853f7a7defc085ff5705ae6fc9db`** into `analyst-completion` from `a285a1806`. Independent ACCEPT `19a2e99f-22f4-4c9f-a8b0-2b526d55272e_reviewer_output.md` supersedes prior REJECT after curated assistant JSON/SSE contract, strict evidence reconstruction and shell-only wording corrections. Original followup descriptions above are retained as historical requirements, not current unresolved findings.

Fresh MAIN integration conda umami / Node22 / Python3.12 / PG16 / pinned pnpm12.3.4: frozen install0 (policies intact, no re-resolution or lock churn), graph-ordered workspace build0; **I1 tsc0**, **I2 generation/checks0**, diff hygiene0; existing166 operation definitions/320 interface members exact. API-client25 + MCP27, affected UI/admin/handler/MCP/contract40, fixture/verifier20, evaluator/strict-qualifier/browser-pairing37 all pass with no skips. Successful fixture cleanup and ownership/failure retention are covered. Old published MCP private-type identity mismatch is gone in MAIN's workspace graph.

Fresh qualification0 reconstructs all twelve deterministic groups against the original git revision:1,574 strict/1,545 browser hashes,14 strict commands/7 paired browser commands, immutable verifier image byte equality. Exact historical E1/browser/package hashes, original revisions/timestamps and fresh command/exit logs are recorded in [integration-slice05.md](../integration-slice05.md). No fresh full E1/browser/package execution or fabricated outer-shell exit is claimed. Build-time contract/client changes are supplemented by fresh transport/handler tests; runtime execution seams remain equal to historical source. Original receipts are unchanged.

Earlier27 external trace omissions are resolved/qualified by the accepted isolated standalone package smoke: no host dependency mounts or escaping symlinks; **application-shell HTML only**, with separately stronger authenticated API execution **42**. **Remote hosted CI, complete main-Dockerfile startup/deployment, authenticated dashboard-content rendering, live/provider vision, paid evaluation and target-bound release acceptance remain unproved/separately gated for06/08.** This resolves deterministic integration scope, not release authorization. Local formatting patch and all45 preexisting untracked status entries preserved; source-worktree dirty formatter not copied. Parent starts06 separately; no next ticket launched here.

## Parent

[Completion spec](../spec.md). Follow the originating spec and retain honest evidence boundaries.
