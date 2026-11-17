# URL-error security correction supplemental evidence

Observed **17 November 2026,21:09 WIB (Asia/Jakarta)**. Reviewed base939967ba5.
Reviewer confirmed prior discoveryP1/sourcequalificationP2 resolved, but rejected
new malformed-replica URL credential propagation. This narrow correction is offline;
no model/provider/live evaluation, actual credentials, .env or rollout involved.

`prismaSessionConfig` previously allowed Node's invalidURL TypeError to escape with
an enumerable credential-bearing `input`. New synthetic test first failed exit1,
then helper catches URL-construction failure and throws only **Invalid PostgreSQL
connection configuration**, without original error/cause/properties. Negative control
checks full malformed URL and synthetic password absent from message, stack, JSON,
all own properties (including nonenumerable), and cause. Valid URL/options tests
unchanged. Existing `getSchema` parser exposure is preexisting and deliberately NOT
changed or claimed fixed; would require separate approval.

Executed after correction:

- Pure helper and existing Prisma unit tests: **2 files/16 tests exit0**, full JSON
  retained in `evidence/url-error-correction.json`; red report retained separately.
- One bounded actual policy regression: **4 assertions exit0**, processAsia/Jakarta,
  inherited requestAmerica/New_York, baseURLJakarta/replicaURLNY. Concurrent physical
  pools, reconnect/AI replacement, numeric input/output epochs, Jakarta half-open
  grouping, NY DST, transaction-local restoration all re-executed with new helper.
- Marker preflight/postflight `umami-ai-synthetic-r3`; only preexisting analyst_fixture
  among analyst namespaces afterward. No public/schema/default-role modifications.
- git diff --check exit0. No broad13command evaluator rerun or TypeScript rerun for
  this catch-only fix; prior three baseline diagnostics remain unresolved.

Provenance is supplemental, **not rewritten historical execution**. Original
`utc-clarification-authority.json` and `utc-session-validation.json` retained byte-for-
byte with their original source hashes. They record earlier proven1–9 / pending10–12
and full matrix104-test evidence at the original executed code. New supplemental
receipt hashes the changed helper/tests, current policy harness and docs, records
prior receipt SHA256, and binds new commands to latest source. No claim that changing
hashes turns old executions into a new fullE1. StrictE1 remains NOT PASS pending10–12;
latest acceptance uses explicit earlier broad evidence plus this bounded regression.
Independent re-review required before merge.

Four formatter-dirty files predated this correction: run-offline.ts,
schema-bind-diagnostic.ts, session-policy.ts, prisma-session.ts. Saved inherited diff
outside source `/tmp/slice02-url-inherited-formatting.patch`; preserved formatting.
Compared committed939967ba5 AST to inherited/current equivalents: helper inherited
format-only; three other files AST equivalent ignoring redundant parentheses and
comments. Initial comparator incorrectly included SourceFile text / empty-block
comment text, producing false mismatches; corrected structural comparison excludes
those and compares node kinds/identifier/literal values. Whole diffs manually
inspected. Helper's new catch and new security test are intentional semantic edits;
no runner/harness behavioral change included.
