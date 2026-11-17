# Offline assertion coverage manifest

Contract: originating `wiki/specs/analyst-dashboard-lifecycle.md` §7 scenarios 1–12.
This slice implements **1–5**, not twelve-scenario acceptance. The machine-readable
binding is `offline.ts:requirements`; `summarizeCoverage` requires every bound assertion
from a successfully executed suite. Later slices must add assertions for 6–12, not reuse
the former weak proxies. `offline.test.ts` removes each required assertion in turn and
checks that the corresponding scenario becomes pending. An empty selection fails.

## Commands / evidence classes

All commands run from the checkout root after the setup in `docs/ai-analyst-eval.md`.

- **API-PG / API-CH**:
  `PGOPTIONS='-c timezone=America/New_York' npx --yes pnpm@12.3.4 exec tsx scripts/test-analyst-api.ts --postgres`
  and the identical command with `--clickhouse`. Real authenticated route handlers,
  disposable PG metadata, actual selected analytics engine. No mocked SQL.
- **SUP-PG / SUP-CH**:
  `PGOPTIONS="-c timezone=$ZONE" npx --yes pnpm@12.3.4 exec tsx scripts/ai/analyst-evals/dashboard.ts postgres`
  and the identical command with `clickhouse`, **each for** `ZONE=UTC`,
  `ZONE=Asia/Jakarta`, and `ZONE=America/New_York`. Real routes/task-bound tools,
  authenticated API execution, real fresh child process, disposable engines.
- **COMP / EXEC / GATE**:
  `npx --yes pnpm@12.3.4 exec vitest run -c scripts/ai/analyst-evals/vitest.config.ts`.
  COMP is real component DOM rendering with injected envelopes/wrappers. EXEC is
  the real executor with a fault-injected missing native key. GATE tests the evidence
  acceptance rules only. None is DB, browser, screenshot or live reasoning evidence.
- **E1**:
  `npx --yes pnpm@12.3.4 exec tsx scripts/ai/eval-analyst.ts --offline --strict --output /tmp/analyst-offline.json`.
  Executes the commands above, checks names against their outputs, records source
  hashes and raw command outputs. **Expected exit 1 while scenarios 6–12 are pending.**
  `complete:false` is an interrupted checkpoint, never finished evidence.

## Exact assertions (source references are symbol/string anchors, not titles alone)

`dashboard.ts` named `check(...)` closures contain the assertions listed below. All
SUP assertions must pass on **both engines in all three connection timezones**.
Approximate line references are supplemented with exact anchors so formatting does
not invalidate discoverability.

| Scenario/subrequirement | Executed assertion reference | Independently expected outcome |
| --- | --- | --- |
| 1 exact observed event labels; no invented success meaning | SUP `dashboard.ts:303`, `exact observed labels and daily event occurrences, separate product/ops` | `appliedFilters.event === 'login'`; label/column is exactly `login`; `meaningSource === 'observed_only'`, warning retained. Seeded events use custom event type **2**, separate from mirrored pageviews. |
| 1 daily occurrence series | Same SUP assertion | Product daily occurrences **[3,2,0]**, ops **[1,0,0]**. Repeated staff-1 occurrences and anonymous activity count as occurrences; no bucket arithmetic by a model. |
| 1 identified user totals; no cross-site identity join | SUP `dashboard.ts:327`, `identified users stay source-scoped despite repeated identity` | Product **2**, ops **1**, each result bound to its website ID, despite staff-1 shared between websites. Anonymous excluded. |
| 1 persisted dashboard separates product and ops | SUP `dashboard.ts:339`, `staff board persists separate source widgets and observed-only meaning` | Commit/readback four widgets; each saved source/metric/semantic binding/definition and definitionHash equals intended definition. Two separate series and two separate identified-user totals; no joined population. |
| 2 filtered event/person series saved/reopened, no chat memory | SUP `dashboard.ts:374`, `filtered event/person series survives real child process reopen` | Save event series and session/person activity series filtered by **country US AND distinctId staff-1**. Event buckets **[2,1,0]**, total **3**; session buckets **[1,1,0]**, bucketSessionSum **2**. Child PID differs, reads same saved board/reference/definition/hash/filters and executes identical rows. |
| 2 new events change rolling, fixed unaffected | API `scripts/test-analyst-api.ts:1693` `before fresh writes: rolling 24h = 0, fixed = 3`; `:1704` `after fresh writes: rolling 24h = 2 (48h-old excluded), fixed stays 3` | Two new events inside rolling24h and one 48h old: **0→2**, fixed **3→3**. True instant writes; range end advances; no original resultId. |
| 2 real process restart, saved replay semantics | API `scripts/test-analyst-api.ts:1732`, `restarted process executes persisted definitions with identical semantics and results` | Fresh process PID; HTTP200; definition/hash/date policy/applied filters preserved; rolling **2**, fixed **3** and exact fixed bounds. |
| 3 correct numeric aggregate | API `:732` `event numeric amount sum = 40` and adjacent loop for average20/median20/min10/max30/count2; SUP `dashboard.ts:440`, `numeric zero/null aggregates and unsupported numeric grouping` | SUP purchase values **10,30,0,missing** → sum **40**, count **3**; zero-only aggregate **0/count1**; absent property **null/count0** and `no_numeric_values`. Missing values never coerce to zero. |
| 3 metric/table display, no invented series | COMP `numeric-render.test.tsx`, `numeric aggregate metric/table renders exact value, zero and unavailable without a series` | Actual AnalysisWidget renders **40** in metric/table, count **3** in table, explicit **0**, null → `Unavailable`. Line request shows reason and table; no Chart. Injected envelopes: not DB-to-browser evidence. |
| 3 unsupported numeric series and grouping rejected | Same SUP numeric assertion | Both series request with numeric metric/property and numeric `groupBy` rejected with exact **unsupported_combination**, never approximated. |
| 4 legitimate zero | API `:563`, `totals unknown event is explicit zero`; SUP coverage assertion | Covered native query returns **0**, completeness **complete**; distinguish zero from absent collection date coverage. |
| 4 missing metric is not zero | EXEC `missing-metric.test.ts`, `omitted native stats key rejects as missing_metric rather than zero` | Inject native stats lacking pageviews → reject exact **missing_metric**, field **metric**. Fault injection, not a claim that an empty DB omits keys. |
| 4 missing numeric data distinct from numeric zero | API `:749`, `missing numeric values are null, not zero`; SUP numeric assertion | Null aggregate/count0/warning versus explicitly observed numeric zero/count1. |
| 4 no collection coverage, correct provenance | SUP `dashboard.ts:464`, `absent collection coverage differs from covered explicit zero` | New empty website discovery **null/null**; covered website exact UTC epochs **1790816400000..1790906400000**, identical for all connection timezones. In Jakarta these are **1 October 2026 08:00 WIB..2 October 2026 09:00 WIB**; epoch numbers are not shifted. |
| 4 top-N/capped output | API `:667`, `top-1 breakdown is labeled partial top-N without fabricated remainder` | Exact row DE3, completeness **partial**, `top_n_truncated`, available **null**; no invented remainder or complete coverage. |
| 5 actual semantic reuse | SUP `dashboard.ts:478`, `matching saved analysis reused; different filter/population never substituted` | Discover/read three same-name analyses. Only exact source/operation/event/filter/date/timezone/population/meaning definition matches. Commit **no new analyses**, persisted board binds exact existing ID, readback and execute **[3,2,0]**, unfiltered original population. |
| 5 reject same-name wrong filter/population | Same SUP reuse assertion | One candidate differs **only country DE filter**, another **only semantic population**. Each hash differs. Board binds neither wrong ID; execute retains desired population and empty filters. Selection is scripted, not a host/model semantic inference guarantee. |

“Person series” is supported native **session activity per bucket**, filtered to a
specific identified person, not filtered distinct-user totals or whole-range uniqueness.
The existing API assertion `filtered identified users → unsupported_combination`
(`scripts/test-analyst-api.ts:764–818`) independently protects that boundary. Reuse
rejection describes the scripted orchestrator's persisted choice, not server-side
rejection of every semantically mismatched authorized analysis ID.

## Pending scenarios (strict acceptance remains blocked)

6. Meaningful question for material ambiguity; discover schema/IDs without user prompting.
7. Foreign/stale/revoked authority at preview/save/execute/render/artifact release.
8. Duplicate commit, key/revision conflicts and atomic partial-failure behavior.
9. Generic/alias edit/share/delete confirmation, declined/stale approval unchanged.
10. Browser/image/verifier/clipping/narrow/stale evidence cannot yield verified.
11. In-flight cancellation at query/commit/queue/render/repair, no late mutations/images.
12. Native boards and historical snapshots unchanged with flags off.

Some existing API tests exercise portions of 7–9/11–12, but this manifest does not
claim those groups complete from those portions. Later slices must bind all their
subrequirements and execute their exact assertions. E2 live selection/visual understanding,
Docker/browser integration and release-target smoke are separately gated, not inferred.

## Discovered defects and authorized minimal fixes

- **PG red**: discovery under America/New_York returned start **1790802000000** for
  a fixture whose first event is **1790816400000**, a -4h shift. `analystDeps.dateRange`
  now uses the existing read-only scope with `SET LOCAL TimeZone='UTC'`, matching
  executor handling; no global timezone or database-role mutation. SUP asserts exact
  first/last epochs under UTC/Jakarta/New_York. Seeding itself writes true UTC instants.
- **CH red**: native `min`/`max` returned epoch0 for an empty website, falsely exposing
  collection coverage. Shared helper uses native `minOrNull`/`maxOrNull` instead of
  converting epoch0 to null. Actual empty/nonempty paths are exercised on CH.
  The other caller, authenticated `/websites/{websiteId}/daterange`, simply returns
  this result and already accepts PostgreSQL's null aggregate values. Epoch0 is
  outside this helper's existing **2000-01-01** lower bound, so a helper-level epoch0
  collection fixture is not supported and is not claimed.
- **Evaluator red**: `.hash`/`.definition` assumed a nonexistent normalization API;
  the new supplement calls `hashDefinition(normalizeDefinition(...))` and uses the
  normalized definition directly. Fixture event-data `createdAt` is seeded at event
  time, fixing the original numeric40 fixture mismatch. No executor substitution.
- **Setup red**: API harness initially failed because connection timezone was UTC.
  Approved process-local `PGOPTIONS` makes its actual Prisma connection non-UTC;
  no database/schema/role defaults were changed.

See `validation.md` for executed receipt/results and limitations. A green title or
this manifest's presence is never evidence by itself.
