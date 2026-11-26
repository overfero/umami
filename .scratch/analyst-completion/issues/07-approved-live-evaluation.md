# 07: Execute approved bounded live evaluation

**What to build:** Execute approved bounded live evaluation as an independently verifiable end-to-end slice of the approved completion spec.

**Blocked by:** 06; operator approval of concrete budget and settings

**Status:** resolved (operator-closed after smoke testing; E2 not accepted)

- [ ] Record explicit provider/model/settings, spend ceiling, synthetic fixtures and execution approval before calls.
- [ ] Run baseline and candidate for all twelve canonical scenarios at least three times each under identical settings; retain every failure/cost/latency/screenshot result.
- [ ] E2 validates actual source-qualified report; failure blocks rollout and is not relabeled success.
- [ ] Remain blocked until approval; no automatic spend.

## Selected comparison

- **Baseline:** `405aaaebca7720b44f191a552dcd87ef9c9e4b7c`, the latest commit authored by Giovanni Randy Kusuma in the local integration history, selected by the operator. It already includes `/assistant`, the chat API, and Analyst routes. This replaces the earlier `b13e11bb9` comparison; prior attempts remain historical evidence only.
- **Candidate:** `705a903f2`, the accepted integration through ticket 06.
- Run the same 12 canonical scenarios three times per version using Strangeshi `cx/gpt-6.2-sol`, reasoning `medium`, and matching synthetic fixtures. The source selections do not establish executable image qualification or E2 acceptance.

## Answer

Closed at the operator's request after the synthetic smoke and confirmation rerun. This closes the tracking item, **not the formal E2 gate**. Live preview confirmed scenarios 1–6 in the exercised paths; scenarios 7–12 have host/fixture evidence with remaining live coverage gaps. Scenario 5 needed a rerender after an initial inspection-recording failure. The confirmation run also passed 114 PostgreSQL checks, 77 Analyst/verifier tests, 8 supplemental tests, and 3 Chromium tests. Codespace evidence directory: `~/.umami-preview/ticket7-confirm.aTs0kk/` (not a source-qualified E2 report).

The approved smoke did not run the 72-attempt baseline/candidate comparison or produce an accepted E2 report. The formal checklist above remains unchecked. This administrative closure neither waives the release gate nor authorizes production activity; Ticket 08 may proceed with preparation only until its release prerequisites are met.

## Parent

[Completion spec](../spec.md). Follow the originating spec and retain honest evidence boundaries.
