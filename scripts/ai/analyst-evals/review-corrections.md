# Slice02 independent review correction checkpoint

Observed **17 November 2026, 20:13 WIB (Asia/Jakarta)**. Exact committed review
base **9a23be11e**, integration **cfe13e5d8** already merged by **5a26ea171**.
Review P1/P2 verdict was REJECT. This checkpoint fixes P2 and diagnoses P1;
**ticket02 remains incomplete, scenario6 pending, re-review required**.

## P1: withdrawn proof, real HTTP red, diagnosed defect; no product fix

FIRST withdrew the historical scenario6 claim in coverage/validation and replaced
its machine binding with a new assertion name. The old wrapped assertion cannot
qualify6; a negative regression verifies that. Historical receipts are retained,
not rewritten or relabeled as current proof.

Removed evaluator withAiRead/SET LOCAL UTC from schema reads. The new regression
uses real `executeTool('analytics_schema')` with trusted context/credentials and
normal fetch, over actual loopback HTTP to native authenticated GET handlers.
`schema-server.ts` is only an HTTP transport adapter for those handlers: no query
substitution, scoped transaction, mock fetch success or timezone adjustment.
It discovers the website ID first, requires literal login taxonomy and expected
property schemas, then retains the meaningful ask_user/wait/no-mutation assertions.
**It fails before clarification at the native discovery assertion**, so6 is not
proven by this new regression. New path and fixture fingerprinted in runner.

Bounded diagnosis (actual commands/exits/raw outputs in review-corrections.json):

1. Native loopback HTTP red, NY: expected **['login']**, actual **[]**, exit1.
2. Read-only probes: owned qualified seed **login|2|1790816400000**, pool schema
   **public**, search_path **"$user", public**. Date filters correct ISO and
   eventType[2]. URL schema qualifies Prisma ORM tables, not every native pooled
   raw SQL connection. Process-local fixture PGOPTIONS search_path now sets only
   the unique owned namespace. No role/database default or public fixture changed.
3. Same native red after owned search_path, exit1. Search-path fix alone does NOT
   solve discovery; not represented as green. Parameter probe shows intended
   **1790812800000** bound as **1790827200000** in NY. Seed01:00Z is outside the
   actual04:00Z start. Date decoding misleadingly returns ISO00:00Z; database
   extract(epoch), not serialized output appearance, establishes actual instant.
4. Approved diagnostic-only `schema-bind-diagnostic.ts`, exactly one bounded run
   per NY/Jakarta/UTC, all exit0. Separate known-owned table `timestamptz(6)`,
   literal offset-aware range count1, seeded epoch1790816400000. Date parameter
   cast `$1::timestamptz`: NY1790827200000(+4h), Jakarta1790787600000(-7h),
   UTC1790812800000. Explicit ISO string bind retains1790812800000 all3.
   `$1::timestamp` wall text recorded separately: timestamp-without-zone is not
   being claimed equivalent to timestamptz instant semantics.

Actual native bind path: `getEventMetrics` compares TIMESTAMPTZ created_at BETWEEN
Date parameters from getQueryFilters; `src/lib/prisma.ts:executeRawQuery` passes
Dates unchanged into Prisma raw args. Pinned `@prisma/adapter-pg` mapArg routes
Dates through formatDateTime producing naive UTC-wall text with no offset.
Session timezone then changes the interpreted instant. This is not a universal
claim about all Prisma writes/types; evidence concerns the actual raw Date bind.

Smallest proposed production fix (NOT approved/implemented): preserve explicit
Date instants at the shared raw placeholder-bind seam, e.g. Date.toISOString before
passing args. Blast radius all native raw Date placeholders; parent/operator must
approve seam and regression scope. Need real loopback discovery parity UTC/Jakarta/NY
and affected caller tests before6 can become proven. No more discovery reruns or
product mutations after instructed checkpoint. No evaluator transaction/UTC fallback.

## P2: source-qualified generic authority acceptance, red→green

Wrong-source report with exact generic assertion title reproduced acceptance (red
exit1). `offline.ts:vitestEvidence` now additionally requires exact source suffix
`/scripts/ai/analyst-evals/generic-authority.test.ts` for generic-authority evidence;
other existing bindings remain intact. Wrong-source negative control plus correct
source positive control execute. Evaluator gate **9 files/15 tests exit0**; full
structured report retained. No mocked database/browser success asserted.

Requalified historical unchanged1–5/7–9 executed evidence with freshly executed
source-qualified evaluator report: **proven1,2,3,4,5,7,8,9; pending6,10,11,12;
pass:false**. This is an executed coverage requalification, **not a fresh fullE1
or engine rerun**. Old API/product sources unchanged, so broad suites were not
rerun. StrictE1 remains NOT PASS. No new authority-timezone success claimed.

## Formatting / hygiene / limits

Six dirty files predated correction. Saved full inherited diff at
`/tmp/slice02-review-inherited-formatting.patch`; preserved all formatting. Compared
ASTs against exact9a23be11e: five identical, authority-evidence.test.ts differed only
by parentheses around assignment arrow-expression bodies (equivalent return/value
and mutation semantics). Manually inspected that entire small diff. Emitted text
comparison differed because formatting/trailing commas survive printer; it was
not accepted as AST equivalence proof. Final changes explicitly include formatting.

TypeScript exit2, unchanged baseline EventsTable46/54 flexWrap and admin2fa test61;
no changed-path diagnostics. git diff --check exit0. Postflight PG marker unchanged,
only existing analyst_fixture among analyst schemas. Every diagnostic/authority
namespace dropped in finally, including failed runs. No public/analyst_fixture
mutation, role-global setting, dependency, lock, .env, workflow, live or deploy change.
Security fix remains unchanged and reviewer-approved. E2/I3 and independent re-review
remain separate gates. Human times WIB, machine epochs preserved.
