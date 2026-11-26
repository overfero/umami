# 08: Verify approved release and final acceptance

**What to build:** Verify approved release and final acceptance as an independently verifiable end-to-end slice of the approved completion spec.

**Blocked by:** formal E2 acceptance (Ticket 07 closed at smoke scope); operator approval of exact release target

**Status:** needs-info

- [ ] Record concrete target and release authorization before release actions.
- [ ] Execute I3 on approved target with persisted ingest and verifier/image evidence; preserve rollback and security requirements.
- [ ] Independent standards/spec reviews resolve all findings; every gate has actual passing evidence before claiming complete.
- [ ] Integrate accepted changes, resolve tickets, retain deliverables and clean implementation worktrees; blocked approvals remain explicit pending work.

## Release preparation

The preceding smoke and confirmation rerun are useful regression evidence, not formal E2 acceptance. Use the [guarded I3 runbook](../../../scripts/ai/release-smoke/analyst-smoke.md) for the release lane. Before any target action, record the exact canonical base URL and environment, source-qualified app build and immutable verifier image, synthetic principal and operations, time/request bounds, readiness and vision evidence as required, and rollback owner/procedure. Run preparation checks locally without contacting a release target. Do not treat the temporary zrok preview as an approved release target.

## Parent

[Completion spec](../spec.md). Follow the originating spec and retain honest evidence boundaries.
