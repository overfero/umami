# 06: Deliver target-guarded synthetic release smoke

**What to build:** Deliver target-guarded synthetic release smoke as an independently verifiable end-to-end slice of the approved completion spec.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Implement externally testable I3 CLI refusing missing/mismatched target approval and non-synthetic configuration.
- [ ] Verify source/build, auth denials, image/verifier, feature flags and ingest HTTP plus stored-event proof.
- [ ] Cleanup is bounded and never auto-enables flags or accesses real data.
- [ ] Local positive/negative tests pass without paid calls or release execution.

## Parent

[Completion spec](../spec.md). Follow the originating spec and retain honest evidence boundaries.
