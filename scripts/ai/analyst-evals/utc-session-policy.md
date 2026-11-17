# Temporary central Prisma session UTC policy

Approved by operator after upstream research; **no dependency upgrade or Date-to-ISO
rewrite**. Business calendars stay explicit, e.g. Asia/Jakarta boundaries, grouping
and display. Historical stored timestamps are not rewritten.

## Caller audit before implementation

Audited all production PrismaPg constructors: base, optional replica and bounded AI
pool in `src/lib/prisma.ts`. All now use `prismaSessionConfig`. Repository search
of query/lib timezone/calendar SQL yielded42 references; product timezone setters
are only existing **SET LOCAL UTC** in analyst execution/discovery. No product
nonUTC setter found. Retention day differences operate on explicitly zoned bucket
strings; property date filters explicitly apply requested timezone; general series
and list-chart nonUTC branches explicitly use AT TIME ZONE. Default UTC list-chart
branch now receives the intended UTC session rather than ambient database default.
No business-semantic product adjustment was necessary for these audited callers.
This is not a claim that every possible application feature was independently
end-to-end tested. Existing UTC/Jakarta/NY fixtures and new boundary tests establish
specified paths. No default user/business timezone changed to UTC.

## Supported constructor configuration / precedence

Inspected exact installed source (not merely generic pg behavior):

- `@prisma/adapter-pg/dist/index.mjs` PrismaPg factory constructs `new pg.Pool(config)`
  for each configured pool; supported constructor accepts pg.PoolConfig.
- `pg8.22.0/lib/connection-parameters.js` parses connectionString **after** object
  config, so URL `options` would override PoolConfig.options. Environment PGOPTIONS
  is fallback only. Thus setting object options alone is insufficient.
- `pg-connection-string2.14.0/index.js` parses URL parameters; duplicate options
  ambiguity is rejected by our helper rather than depending on parser last-value.

The helper removes URL options from the connectionString and composes inherited
PGOPTIONS, URL options, then `-c TimeZone=UTC`. Other options/search_path are retained;
PostgreSQL applies repeated startup assignments in order (verified against actual
physical sessions with conflicting inheritedNY/URLJakarta and replicaURLNY). Odd
trailing backslash/NUL rejected because it could swallow the appended startup flag.
No credentials/options are logged by helper errors. No role/server/global setting.
Every fresh socket/reconnect receives startup config; no single pooled SET, NodeTZ,
or evaluator transaction is responsible for application UTC.

Official references preserved in `date-binding-research.md`: PostgreSQL SET/date
semantics, node-postgres connection/query docs, and exact upstream adapter versions.
7.10.1 still has read and write defects; no upgrade claimed to fix them.

## Trusted SQL constraint

This is a startup operational policy, **not a SQL authorization boundary**. Trusted
production SQL must not change session/transaction timezone to nonUTC. No SQL parser
or query interception guard added. Deliberate SET LOCAL NY/Jakarta in tests shows
raw Date instants are broken **inside** those unsupported transactions; commit and
rollback restoreUTC on the exact physical connection. Those deliberately wrong
results never count as supported timestamp correctness. Bare SET nonUTC is prohibited
and is not claimed automatically restored. No such product caller found in audit.
External DB administrators/session proxies changing settings remain an operational
risk; future upstream fixed-adapter adoption requires new evidence, not assumption.

## Test-first and bounded pre-suite checkpoint

Human observations **17 November 2026,20:30–20:38 WIB** (Asia/Jakarta).
Pure startup config test first failed missing helper. Real pool fixture first
selected pg_sleep(void), causing unsupported type; one attempted source-edit Python
syntax error left that unchanged. These are **harness/tool failures, not product red**;
outputs retained separately. Corrected scalar sleep subselect gave valid actual
red **Asia/Jakarta != UTC** before production policy. Central helper then made
config+existing Prisma tests15/15 pass. Initial policy regression four assertions
passed, followed by actual native loopback HTTP discovery five assertions passingNY.
No evaluator-only timezone wrapper used. Research artifact preserved from supplied
researcher output (original expected worktree path was absent).

Expanded policy test covers actual base/replica concurrent physical PIDs, disconnect/
reconnect; four concurrent AI transaction PIDs and forced replacement of only owned
AI backend PIDs; per-queryUTC/session/schema/lock_timeout and numeric input/literal
output epochs. ORM create/update/filter independently checked via server epoch,
rawDate and rawDate-array input, literal scalar/array/null read, timestamp-without-zone
wall control, invalidDate rejection; microsecond storage independently preserved,
JSDate truncation documented. Actual executor Jakarta midnight [start,end) fixture3,
explicitUTC grouping2+1, Jakarta display; NY spring/fall today midnight epochs.
Same-connection transaction restoration checked after commit and rollback.

Before broad validation: retain red/green checkpoint, then run expanded policy
matrix UTCprocess×requestedUTC/Jakarta/NY plus Jakarta and NY process crosschecks;
full strict runner fresh PG/CH APIs, six preserved1–5 supplements, three native
HTTP/authority supplements and structured evaluator/verifier tests. Exact results
will be retained after execution. Strict E1 must still exit1 pending10–12. Any new
infrastructure failure stops validation rather than silent retries.

## Completed validation

Observed **17 November 2026,20:47:57 WIB** (Asia/Jakarta) full receipt timestamp.
`evidence/utc-clarification-authority.json`: complete:true, all13 subprocesses exit0;
outer strict command **exit1**, proven1–9, pending10–12, pass:false. Fresh PG and CH
API114 checks each, six original dashboard supplements7 assertions each, actual native
HTTP authority5 assertions×requestedUTC/Jakarta/NY, evaluator15 and reusable verifier14
passing tests with full structured reports. API harness now requires nonUTC inherited
request AND actualUTC app session, not a weakened unchecked setup; raw upstream
nonUTC diagnostic independently retains the defect characterization.

`evidence/utc-session-validation.json` retains exact commands/exits and full focused
regression JSON. Expanded policy matrix **five cases×four assertions exit0**:
processUTC/requestUTC, processUTC/requestJakarta, processUTC/requestNY,
processJakarta/requestNY, processNY/requestJakarta. URL baseJakarta/replicaNY conflict
with policy in every case. Matrix case headers include process/request settings.
All evidence reads actual DB sessions; server defaults/global role settings unchanged.

Focused regression **8 files/104 tests exit0** (Prisma config/helpers, analyst definition/
dates, verifier and analyst tools). TypeScript exit2 on same3 baseline diagnostics
EventsTable46/54 flexWrap and admin2fa test61, no changed-path diagnostics. Full receipt
**40 source fingerprints** independently matched executed bytes. No stale API reuse
following shared product change. git diff --check passes. PG postflight marker unchanged,
only analyst_fixture among analyst schemas; owned policy/authority namespaces removed.

Three formatting-dirty files existed at resumption (offline.ts, schema-server.ts,
schema-bind-diagnostic.ts); inherited patch retained outside source. First two ASTs
compared against c940d3f16 are equivalent (parentheses ignored), formatting preserved.
Diagnostic subsequently intentionally constructs raw upstream adapter, explicitly
labeled policy bypass for characterization only. Research copied unchanged from
supplied researcher artifact. Product policy contains no Date rewrite, dependency
upgrade, global config, migration or historical data correction. Independent review
required before merge; compatible operational rollout and preexisting data assessment
remain unperformed. StartupUTC does not retroactively repair potentially bad old writes.
