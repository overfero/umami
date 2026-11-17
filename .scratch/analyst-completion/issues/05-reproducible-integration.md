# 05: Make all integration gates reproducible and clean

**What to build:** Make all integration gates reproducible and clean as an independently verifiable end-to-end slice of the approved completion spec.

**Blocked by:** 03, 04

**Status:** ready-for-agent

- [ ] Resolve every TypeScript diagnostic, including UI/admin/MCP, narrowly with affected regression evidence.
- [ ] Generate and check synchronized OpenAPI/client artifacts without unrelated changes.
- [ ] CI resolves actual Pi installation, builds required workspace artifacts and executes sequential D2 flags-on/off plus B3 without silent acceptance skips.
- [ ] Final I1/I2 checks and affected E1/A–D regressions pass; capture source-qualified receipts.

## Required integration followups from accepted slice 03

Recorded **2026-11-18 02:35 WIB (Asia/Jakarta)**; [accepted integration summary](../integration-slice03.md), merge `3f82dfb4b58f6fada937960815746212a2031f15`. These are **required**, not optional notes or fixes supplied by the merge:

- [ ] **P2 successful fixture temp build-tree cleanup:** final independent ACCEPT (`ef607777-eb18-4c2c-a2fa-8937ba9e43f2_reviewer_output.md`) identifies `scripts/ai/analyst-fixture/app.mjs:198–204,264–279`: ordinary successful child shutdown cleans the owned DB namespace but leaves its sanitized temporary project/build tree. After successful ownership-checked database cleanup on clean exit, remove only that invocation's owned project; preserve failed compiler traces. Add a clean-success removal regression and retain startup failure/namespace ownership controls. Earlier schema-startup cleanup P2 is fixed; this new successful-run filesystem cleanup P2 is **not**.
- [ ] **Packaging before release:** explicitly resolve or qualify the existing **25 Next + 2 styled-jsx external trace omissions/shared dependencies** and demonstrate the intended release packaging without silently relying on shared build-host dependencies. Current accepted standalone/default-off evidence is **nonhermetic**, not deployment readiness. Do not promote synthetic image grants, default-off route success or unsigned/operator-controlled receipts to actual provider vision or authenticated build provenance. Original verifier base/build correspondence remains unknown despite pinned executing worker/entrypoint byte equality.
- [ ] **Keep all TypeScript/UI/admin/MCP work:** merged `tsc --noEmit` exit 2 reproduces EventsTable.tsx:46/54 `flexWrap`, admin/users/[userId]/2fa/route.test.ts:61 excessive instantiation, and mcp/route.ts:28 local/published API-client `fetchImpl` private type identity (four diagnostics). Source acceptance environment had three; MCP remains the known integration workspace-artifact baseline, not fixed here. Build required workspace artifacts reproducibly and narrowly resolve every diagnostic with affected tests; do not claim I1 pass until clean.
- [ ] **Keep OpenAPI/client synchronization and actual Pi/CI gates:** generate/check synchronized OpenAPI and API-client artifacts, actual installed Pi resolution and workspace builds, sequential D2 flags-on/off plus B3 without silent acceptance skips, final I1/I2 and affected E1/A–D. Retain source-qualified evidence. The existing skipped native-Pi Vitest is not a substitute for D2 execution.

Accepted slice 03 strict receipt proves all twelve **deterministic** scenario groups; no live reasoning/provider vision, hermetic packaging, paid evaluation or full-release acceptance follows. Parent starts this slice separately after integration review.

## Parent

[Completion spec](../spec.md). Follow the originating spec and retain honest evidence boundaries.
