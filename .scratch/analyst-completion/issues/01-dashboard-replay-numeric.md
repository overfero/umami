# 01: Prove dashboard, replay and numeric correctness

**What to build:** Prove dashboard, replay and numeric correctness as an independently verifiable end-to-end slice of the approved completion spec.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Prove every subrequirement of originating scenarios 1–5 with independently expected real evidence, reusing existing assertions where sufficient. Evidence: independent slice01 ACCEPT of committed `94fc14c76`; [assertion coverage manifest](../../../../scripts/ai/analyst-evals/coverage.md).
- [x] Exercise real process restart and fresh-event rolling versus fixed comparison, event labels, identified users, daily series, numeric rendering/rejection, zero/missing/coverage/top-N and semantic reuse. Evidence: accepted source-qualified slice receipt; fresh merged-source API commands (114 checks each), six timezone supplements (seven assertions each), evaluator six files / ten tests. Integration strict run was interrupted; see explicit limits below.
- [x] Repair relevant evaluator API/fixture errors; provide a coverage manifest with exact assertion references and commands. Evidence: accepted scoped PG UTC and CH empty-coverage fixes, merged-source supplement assertions pass; [validation](../../../../scripts/ai/analyst-evals/validation.md).
- [x] Strict acceptance fails on missing evidence; no scripted choice is represented as live reasoning. Evidence: accepted slice strict result `pass:false`, scenarios 1–5 proven, 6–12 pending, reviewed shell exit 1; merged evidence controls and fail-closed report tests pass. No completed integration strict CLI exit is claimed.

## Parent

[Completion spec](../spec.md). Follow the originating spec and retain honest evidence boundaries.

## Resolution evidence

Recorded **2026-11-17 17:20 WIB (Asia/Jakarta, UTC+07:00)**.

- Independent **ACCEPT — slice01 only**, no findings, committed `18a63432d..94fc14c76`, correction `018631d2d..94fc14c76`: `/home/overfero/.pi/agent/sessions/--home-overfero-Project-ocbc-umami--/subagent-artifacts/920b33be-1d60-4875-b833-6935463133cf_reviewer_output.md`. Reviewer inspected snapshots; no independent test execution.
- Merged committed `analyst-slice-01` tip `94fc14c76` into `analyst-completion` at **`f8d89cd3fde389a482e53bccf9bdb06bf0b74feb`**. Only expected CLI import seam resolved: slice04 fail-closed checker retained alongside slice01 offline dispatcher; obsolete offline implementation removed. No dirty source-worktree formatting copied.
- Actual merged-source gates: report checker **13 tests / exit 0**; evaluator **6 files / 10 tests / exit 0**; analyst **26 tests / exit 0**; definition **39 tests / exit 0**; diff hygiene **exit 0**. Exact logs/status files and provenance: [integration evidence](../../analyst-ci-debug/integration-slice01/summary.md).
- Fresh strict integration attempt completed seven successful commands (PG API114, three PG supplements; CH API114, two CH supplements) before user-requested interruption in CH New York. Original checkpoint remains **`complete:false`**, no captured CLI exit/end. Only missing CH New York supplement was continued under explicit **180-second timeout**, **exit 0 / seven assertions**. This is affected-path integration evidence, **not a completed strict E1 run**. No broad retry.
- Historical slice-local structured Vitest/strict receipt is accepted evidence only, not byte-current integration proof. Merged CLI differs; cached receipt reuse was not used. Post-run integration hashes verified against merge bytes are separately labeled in provenance, not retrofitted into interrupted receipt.
- `tsc --noEmit` actual **exit 2**, four unrelated diagnostics: EventsTable `flexWrap` at46/54, admin2fa test instantiation at61, MCP client private-type mismatch at28. Earlier slice report listed three; current fourth is disclosed, not silently fixed. No merged-path diagnostic. I1 remains red.
- Slice04 was already merged `02521a61f` and resolved `9f529d846`. Both bounded slices are now merged/tested; **STOP**. Full E1 **NOT PASS**, scenarios6–12 pending; live reasoning, visual/browser and release gates not accepted. No next slice, branch cleanup, main merge, push, model call, production, `.env` or deploy.
