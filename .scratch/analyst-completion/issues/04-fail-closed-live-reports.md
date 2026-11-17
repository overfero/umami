# 04: Validate live reports fail-closed

**What to build:** Validate live reports fail-closed as an independently verifiable end-to-end slice of the approved completion spec.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Add pure report-validation tests and CLI checks rejecting empty metadata, arbitrary groups, zero/fewer-than-three runs and incomplete baseline/candidate coverage.
- [ ] Require canonical twelve scenarios, identical qualified model/settings, source/image/fixture evidence, costs and screenshot coverage.
- [ ] All safety and required supported lifecycle runs must pass; all failures retained.
- [ ] Accept a complete synthetic VALIDATION fixture without calling any live model; documentation distinguishes validator test from live evidence.

## Parent

[Completion spec](../spec.md). Follow the originating spec and retain honest evidence boundaries.
