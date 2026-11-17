# Guarded analyst release smoke (slice 06)

This is **tooling**, not a release, live evaluation or permission to contact a deployment.
No target URL, credential, `.env`, SSH, rollback or production configuration is discovered.
No provider is invoked. Flags are never set by this runner.

## Public boundary

```sh
npx --yes pnpm@12.3.4 exec tsx scripts/ai/release-analyst-smoke.ts --synthetic-only --require-ingest
# Add --require-vision when needed; manifest.policy.requireVision also enforces it.
```

Absent approval fails locally, exit 1, before fetch or mutation. Both switches are mandatory;
unknown/duplicate options fail. **A CLI switch is not approval.** Only the explicit records below
confer authority. No URL override is accepted. A target is an exact canonical base URL ending
in `/` (including any deployment base path), plus environment `staging`, `release`, or
`local-disposable`. HTTPS is mandatory except explicit local-disposable `127.0.0.1` HTTP.
Credentials, query, fragment, encoded paths and ambiguous slash/dot normalization are refused.
Every request stays beneath that base path. All redirects are failures, never followed.
Embedded schema/evidence URLs are never fetched.

## Inputs and operational trust

Pass paths through these environment names (not arguments):

- `RELEASE_ANALYST_APPROVAL_FILE`
- `RELEASE_ANALYST_MANIFEST_FILE`
- `RELEASE_ANALYST_READINESS_FILE`
- `RELEASE_ANALYST_VERIFIER_EVIDENCE_FILE`
- `RELEASE_ANALYST_VISION_FILE`, only when vision required
- exactly one of `RELEASE_ANALYST_TOKEN` / `RELEASE_ANALYST_TOKEN_FILE`

Each input file must be an operator-owned regular file, mode 0600 or stricter, at most 2 MiB,
one link, no final symlink. Do not use existing application secret files. Token files contain
only the token (optional surrounding whitespace); the record binds SHA-256 of the token, not
its printed value. File SHA-256 values refer to **exact bytes**, including JSON whitespace.
The runner prints neither input paths nor target, token, profile, request/response body or
exceptions. Errors use fixed categories. A report may contain only newly generated owned IDs,
markers, source fingerprints and sanitized status. Store private input records separately.

The authoritative strict schemas are `analyst-contract.ts` and `analyst-input.ts`. Unknown
fields are rejected. To prepare a record offline, import `currentSource()` (read-only git
revision and exact runtime/build tracked file hash map); serialize a manifest conforming to
`manifestSchema`. This is not an approval writer. The recorded explicit operator approval
must independently bind manifest, readiness, token/principal, optional vision receipt, exact
target, timestamps, synthetic operations and limits. Approval/readiness last at most one hour,
are nonfuture and must leave room for the complete bounded run. Missing facts never default
true. The manifest records expected app image, build ID, verifier image, flags, vision policy
and optional exact provider/model/settings hash. The readiness record separately states the
observed identity/flags/principal and its observer, time and expiry; equality is mandatory.

**No introspection route exists in the product.** Deployed source/image/build/flags and the
executed verifier preflight are therefore fresh **operator attestations**, not independently
measured by heartbeat and not cryptographic deployment provenance. Local source hashes and
record equality detect inconsistency, not a dishonest operator or compromised target. This
trust boundary is in every output. A copied image tag, self-declared pass or synthetic receipt
cannot be described as independent deployment authentication.

Verifier attestation must bind immutable verifier image and worker/images/entrypoint hashes,
executed synthetic desktop+narrow image transport, missing/expired capability denials and a
separate retained execution record. Its exact bytes are hash-bound; its JSON is exactly the
readiness `verifier` facts minus `evidenceSha256`, plus manifestSha256, target, issuedAt and
verifierImage. These facts remain operator-reported. They do not prove OS confinement or
configured-model vision. Retain underlying real execution logs for release review.

When required, provision a separately qualified `analyst-actual-provider-vision-v1` receipt:
exact manifest/configuration, qualifier, and the actual `executeVisionChallenge` execution
(including measured cost/usage, independently expected challenge/answer hashes and evidence
hash). Execution must be inside the recorded approval interval, before now, successful and
configuration-equal. Synthetic/mock/offline/fixture/contract providers are rejected. There is
no model call, fallback, metered adapter or grant writer here. The unsigned qualifier attests
actual execution; hash equality is not proof that the model actually saw an image. Without a
qualified receipt, `--require-vision` / policy fails **before target requests**. With no vision
requirement, output says `pending-not-requested`, never vision-passed. Tests do not fabricate
an actual-provider positive receipt or claim a real preflight happened.

## Runtime and cleanup

The runner observes JSON heartbeat, unauthenticated auth/website denials and an authenticated
principal match. It creates exactly one website, with random client-assigned UUID, unique
synthetic name and `.invalid` domain. It never lists/reuses existing websites or reads user
analytics. Create response **and** independent readback must match ID/name/domain/userId/
createdBy, no team/deletion. Only then send one pageview and one custom event (UUID-preserving
46-character event marker, synthetic browser user agent). It queries only that website and
marker in a bounded time window/page, requiring exactly two distinct stored event IDs, one
pageview and the exact named event. HTTP 200 alone is not pass (bot-ack 200 also fails storage).
No retry/polling, no background writes, no general query/SQL port. Maximum 20 requests, one
website, two events, 120 seconds; request timeout 10 seconds, response maximum 128 KiB.

Finally it independently reads ownership again before a single DELETE of that exact created
ID. No delete on uncertain creation, changed ownership/marker, redirect or unknown ID. Failed
storage checks still attempt safe cleanup. Cleanup failures fail the run and report retained
new resource IDs/markers for explicit bounded operator review. No wildcard cleanup, volumes,
schema resets, flag enabling, migration, credential setup or deletion of existing resources.
A lost create response may have created a resource: retain its attempted ID, do not guess.
Deletion acknowledges the application's API, not independent physical byte erasure.

## Local tests and limits

```sh
node --import tsx --test scripts/ai/release-smoke/release-analyst-smoke.test.ts
PG_BIN="$CONDA_PREFIX/bin" node --import tsx --test scripts/ai/release-smoke/release-analyst-smoke.app.test.ts
```

First suite is CLI + disposable protocol servers, not proof of Umami storage/deployment.
It covers approval no-request negatives, redirects/schema URLs, secrets, missing evidence,
HTTP200/no storage, uncertain ownership and cleanup failure retention. The second uses the
real Next handlers, sanitized source project (no `.env`), explicit flags-off fixture env,
existing marker-qualified synthetic PG engine and a new unique `analyst_fixture_<nonce>`
namespace. It never uses public/legacy fixture namespace or deletes a volume. The existing
fixture provisioning guard verifies engine ownership. Only successful owned runs remove their
own DB namespace/project; failures retain evidence. Seeded admin credentials are disposable
and never logged. Images/verifier records in these tests are clearly invented protocol-only
records; real storage success does not qualify deployment/verifier/provider facts.

Actual approved-target I3, paid evaluation07, actual provider vision preflight, hosted CI,
full deployment/Docker startup, authenticated rendered-dashboard review, backup/compatible
rollback and final release08 remain separate gates. Do not run against a user deployment
until concrete target records and required provider evidence are separately approved.
