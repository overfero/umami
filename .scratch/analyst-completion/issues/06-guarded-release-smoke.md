# 06: Deliver target-guarded synthetic release smoke

**What to build:** Deliver target-guarded synthetic release smoke as an independently verifiable end-to-end slice of the approved completion spec.

**Blocked by:** 05

**Status:** resolved

- [x] Implement externally testable I3 CLI refusing missing/mismatched target approval and non-synthetic configuration.
- [x] Verify source/build, auth denials, image/verifier, feature flags and ingest HTTP plus stored-event proof (readiness is unsigned operator-attested; real local Next/PG ingestion/storage separately observed).
- [x] Cleanup is bounded and never auto-enables flags or accesses real data.
- [x] Local positive/negative tests pass without paid calls or release execution.

## Answer

Resolved **2026-11-18 05:45 WIB (Asia/Jakarta)** for **offline tooling/local-test scope only**. Accepted committed slice06 `b07889a29567fb9ab84378d34ee101de83b3d8b1` merged into `analyst-completion` as **`07ff4928db342b773f5cbdb751964962d63fde2c`** from `23812fb0e70ae950d45c56e63976f28d9917af6d`; merge tree exactly matches accepted source. Final independent ACCEPT `81f912b8-d9eb-4b7c-9823-1dcec077f551_reviewer_output.md` resolves previous REJECT `22c578a4-dc2d-47de-acde-f59ce09f9156_reviewer_output.md` after explicit root build/config input binding and zero-request stale-approval regressions.

Fresh merged public CLI/source tests **66/66**, actual disposable Next/owned PostgreSQL smoke **1/1**, I1 TypeScript, I2 OpenAPI/client checks and diff hygiene all exit **0**. Real local assertions require ingest200/200, two stored events, auth401/401 and ownership cleanup. Missing required vision fails closed before target requests. No setup failure or generated/dependency changes. [Integration summary](../integration-slice06.md) records exact merge, commands/exits, runtime/build map, preserved local state and limits.

Source/build/image/verifier/flag readiness remains **unsigned operational operator attestation**, not authenticated deployment provenance or actual provider vision. Test image/verifier facts are protocol-only even with real local storage. **Actual-target I3, actual provider qualification, live evaluation, hosted CI/full deployment/rollback and final release acceptance remain pending.** Existing later production selection and US$25 cumulative live authorization were not exercised: no production requests, provider calls, `.env`/key reads, deployment or next-slice launch. Parent starts07 separately. Resolving this deliverable does not claim a release.

## Parent

[Completion spec](../spec.md). Follow the originating spec and retain honest evidence boundaries.
