# Analyst lifecycle: evidence-complete evaluation and release

Status: ready-for-agent

## Problem Statement

The analyst implementation has passing historical A1–A3, B1–B2, C1–C2 and D1 evidence plus fresh local D2 and B3 passes, but evaluation and release acceptance is incomplete. The unfinished offline evaluator does not prove all twelve required scenarios, its live-report checker accepts invalid zero-run reports, integration checks fail, and the analyst release-smoke deliverable is absent. The user needs every remaining requirement demonstrably completed, without silently relabeling partial evidence as verified or automatically spending money/deploying.

## Solution

Deliver evidence-complete deterministic acceptance, a fail-closed live evaluation gate, reproducible integration checks, and a guarded release smoke. Reuse existing real tests by exact assertion references instead of duplicating proven behavior. Fill every missing assertion. Finish with separately approved live baseline/candidate evaluation and target-bound release verification. A blocked approval is pending work, never completion.

## User Stories

1. As an analyst, I want exact observed event labels, so that names do not invent business semantics.
2. As an analyst, I want identified-user totals and daily occurrence series, so that people and occurrences remain distinct.
3. As an analyst, I want product and ops displayed separately, so that identities are not joined across websites.
4. As a dashboard owner, I want saved filters and semantics preserved across a real process restart.
5. As a dashboard owner, I want new events to change rolling results while fixed results remain fixed.
6. As an analyst, I want numeric aggregates rendered faithfully and unsupported numeric series rejected.
7. As an analyst, I want legitimate zero, missing metrics, no collection coverage and capped top-N output distinguished.
8. As a dashboard owner, I want matching analyses reused without substituting different populations or filters.
9. As a user, I want material ambiguity resolved by a meaningful question rather than guessed semantics.
10. As a resource owner, I want foreign, stale and revoked references rejected at every use and artifact-release boundary.
11. As a user, I want duplicate requests idempotent and conflicting/partially failed bundles atomic.
12. As a resource owner, I want edits, sharing and deletion protected by current confirmation, including generic aliases.
13. As a user, I want declined or stale approvals to leave resources unchanged.
14. As a user, I want render failures, inaccessible verifiers, absent image capability, clipping and stale screenshots never labeled verified.
15. As a user, I want cancellation during query, commit, queue, render and repair to prevent late mutations or image leaks.
16. As an existing user, I want native boards and historical snapshots preserved with flags off.
17. As a maintainer, I want all twelve scenario groups bound to independent expected assertions.
18. As a maintainer, I want existing verified tests reused only where their assertions actually prove requirements.
19. As a release owner, I want malformed, arbitrary-scenario and zero-run reports rejected.
20. As a release owner, I want baseline/candidate results under identical model settings with at least three runs per scenario and all required runs passing.
21. As a release owner, I want source/image revision, fixture hash, screenshot coverage, latency and costs retained with all failures.
22. As a maintainer, I want clean TypeScript and synchronized generated API contracts reproducible from a checkout.
23. As a release owner, I want smoke tooling to refuse unapproved targets and never enable flags automatically.
24. As a release owner, I want auth denials, image/verifier preflight, flags and HTTP plus persisted-event ingest evidence.
25. As the operator, I want explicit spend and target approval before live or release execution.
26. As the operator, I want small independently verifiable slices, fresh subagents and a final review, so that completion is auditable.

## Implementation Decisions

- The originating analyst-dashboard-lifecycle spec remains authoritative; this completion spec closes gaps rather than reducing acceptance.
- Keep tool-direct offline orchestration, with an explicit twelve-scenario coverage manifest binding each subrequirement to real assertion evidence. Reuse existing native offline Pi, API, database and browser tests at their highest useful seams. A fresh task is not a process restart; taxonomy is not a user question; a successful tool call is not visual understanding.
- Expected fixtures are independent of model output. Failures and missing evidence fail strict acceptance. Offline results never imply live reasoning or visual understanding.
- Live report validation is pure, testable and fail-closed. Require canonical scenarios, baseline/candidate runs, minimum counts, consistent settings, approved bounded spend, qualified sources, measured outcomes and all required safety/supported-lifecycle runs passing.
- Resolve all TypeScript diagnostics, including existing UI/admin/MCP findings, using narrow behavior-preserving fixes with regression evidence. Preserve diagnostic provenance rather than pretending earlier failures did not happen.
- Restore reproducible API generation and checks; preserve existing client behavior. Generate only intended artifacts and inspect resulting changes.
- Reproduce D2 using sequential flags-on/off phases with persisted phase evidence; ensure CI does not silently skip flags-off. Build workspace dependencies before production renderer verification and resolve the pinned Pi install from its actual installation path.
- Release smoke requires explicit target approval, synthetic-only resources and bounded cleanup. No automatic flag changes, destructive migration, credential setup or production data access.
- Work on one integration branch. Each implementer uses fresh context and an isolated worktree; independent slices may run concurrently. Shared engines/ports and integration gates are serialized. Do not overwrite unrelated untracked user files.
- Live evaluation and release tickets stay blocked until concrete budget/settings and target approvals are recorded. No automatic model calls or deployment.

## Testing Decisions

- Test externally observable behavior, not internal call counts. Prefer existing authenticated API/turn, disposable real Postgres/ClickHouse, native Pi deterministic provider, real browser plus Docker verifier and public CLI seams.
- For every originating scenario, enumerate all subrequirements and exact test/assertion evidence. Execute coverage-linked commands or bind reproducible source-qualified receipts; never accept file existence or mocked response as proof.
- Add regression tests before fixes where the seam reproduces the failure. Negative controls include empty/0-run reports, wrong scenario IDs, incomplete baseline/candidate runs, stale approval and screenshot evidence, and missing target/spend approval.
- Preserve A–D historical verified evidence and fresh D2/B3 receipts; rerun affected gates after integration changes. Reusing a test requires the relevant assertion, not its title.
- TypeScript, diff hygiene and API generation/checks must pass at final integration. Record failure baseline and fix all remaining diagnostics for the requested final state.
- Release smoke is locally testable without network/model spend; actual release acceptance requires the separately approved target run.
- Final independent standards/spec review is required. Live and release results remain pending until actually executed.

## Out of Scope

- Automatic spending, deployment, production feature-flag changes or target selection.
- Product redesign, relaxing security/confinement, replacing native Pi transport, or weakening originating acceptance to make commands green.
- Broad unrelated refactors, new credentials, destructive data changes and treating historical green tests as fresh execution.

## Further Notes

Approved by the user: reuse is allowed only if all twelve scenarios are proven; E2 checker tightened offline; finish all remaining gates via slices/subagents with live/release approval gates. Eight slices and their dependency graph approved. Evidence pointers: [audit](../analyst-ci-debug/evaluation-audit.md), [D2/B3](../analyst-ci-debug/verification.md), [originating spec](../../wiki/specs/analyst-dashboard-lifecycle.md). These pointers describe evidence, not authorization to spend or deploy.
