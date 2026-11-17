# 03: Prove visual failure, cancellation and compatibility

**What to build:** Prove visual failure, cancellation and compatibility as an independently verifiable end-to-end slice of the approved completion spec.

**Blocked by:** 02

**Status:** resolved

- [x] Prove every subrequirement of scenarios 10–12, including clipped/narrow/stale screenshots and absent image capability.
- [x] Exercise in-flight query/commit/queue/render/repair cancellation with no late mutation or image leak.
- [x] Prove flags-off native board and historical snapshot compatibility, reusing genuine existing assertions.
- [x] All twelve groups and subrequirements are covered; strict E1 completes without invented verified states.

## Acceptance evidence

Resolved **2026-11-18 02:35 WIB (Asia/Jakarta)** after independent final ACCEPT of `790fa69ce51bb339b23415d8290895826b0567e9`, merge `3f82dfb4b58f6fada937960815746212a2031f15`, exact accepted-tree comparison and successful scoped merged gates.

- Fresh evaluator 35 passed (including real pinned-ID Docker negatives and image policy), product/verifier 117 passed / 1 existing non-evidence skip, checker 13 passed, Node fixture/verifier 17 passed; all exit 0. Diff check exit 0.
- Accepted full strict E1 receipt requalified against all 1,567 exact source hashes, browser 1,538 hashes, seven paired browser commands and retained report hashes: proven scenarios **1–12**, pending **none**. This reuses the accepted run, not a fresh full E1/browser execution or live proof.
- TypeScript exit 2 retains four known UI/admin/MCP baseline diagnostics; no global I1/release pass. Required ticket 05 followups include new successful-fixture temporary build-tree cleanup P2 and existing 25 Next + 2 styled-jsx external trace omissions/nonhermetic packaging before release. Neither is claimed fixed by merging.
- [Committed integration summary](../integration-slice03.md) records review pointers, exact hashes, command exits, local raw evidence paths, preserved formatter patch/AST proof, and acceptance limits. Source receipt hashes/revisions remain unchanged. No provider calls or deployment.

## Parent

[Completion spec](../spec.md). Follow the originating spec and retain honest evidence boundaries.
