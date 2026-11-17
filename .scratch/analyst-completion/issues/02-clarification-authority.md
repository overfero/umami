# 02: Prove clarification and authority lifecycle

**What to build:** Prove clarification and authority lifecycle as an independently verifiable end-to-end slice of the approved completion spec.

**Blocked by:** 01

**Status:** resolved

- [x] Prove all subrequirements of scenarios 6–9 through real seams or exact reusable evidence.
- [x] Exercise meaningful clarification and needs_input, foreign/stale/revoked checks through artifact release, atomic conflict/partial failure and confirmation bypass protection.
- [x] Declined/stale approval leaves resources unchanged; sharing/deletion and generic aliases are covered.
- [x] Update manifest and run affected regressions.

## Acceptance evidence

Resolved 2026-11-17 21:32 WIB (Asia/Jakarta).

- Independent final review ACCEPT for committed source `321149ed4`, following corrections to discovery proof, source-qualified assertions, central UTC session policy and malformed-URL error sanitization.
- Merged into `analyst-completion` at `313602e6a40e850b99d8462fbd968013ce655951`; accepted source ancestry verified.
- Fresh merged-tree checks: Prisma session 16 tests, evaluator 15 tests, report checker 13 tests, affected regressions 80 tests, date regressions 60 tests, actual PostgreSQL policy 4 assertions and native HTTP authority 5 assertions. All corresponding recorded exit files are 0; diff hygiene exit 0.
- Local raw commands/logs/exits: `.scratch/analyst-ci-debug/integration-slice02/`. Committed source-qualified scenario receipts and mappings: `scripts/ai/analyst-evals/coverage.md` and its referenced evidence. Local integration logs are not represented as committed artifacts.
- `needs_input` is the evaluation outcome mapped to observed meaningful question and persisted `awaiting_user`, not an invented product state. Scripted proof does not establish live model reasoning.
- Full E1 remains NOT PASS pending scenarios 10–12 (slice 03). Global TypeScript exit 2 retains four baseline diagnostics (EventsTable twice, admin 2FA test and MCP client type identity), assigned to slice 05; no global I1 pass claimed.
- Provenance-generation helper failed with exit 127 before running; this bookkeeping failure did not invalidate completed tests. Parent independently inspected the recorded exits and merge before resolving this ticket. No fresh full E1 integration receipt, live calls or deployment claimed.

## Parent

[Completion spec](../spec.md). Follow the originating spec and retain honest evidence boundaries.
