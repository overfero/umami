# Offline assertion coverage manifest

Contract: originating `wiki/specs/analyst-dashboard-lifecycle.md` §7 scenarios 1–12.
Integrated slices implement **1–9**, not twelve-scenario acceptance. The machine-readable
binding is `offline.ts:requirements`; `summarizeCoverage` requires every bound assertion
from a successfully executed suite. Later slices must add assertions for 10–12, not reuse
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
  hashes and raw command outputs. **Expected exit 1 while scenarios 10–12 are pending.**
  `complete:false` is an interrupted checkpoint, never finished evidence.

## Exact assertions (source references are symbol/string anchors, not titles alone)

`dashboard.ts` named `check(...)` closures contain the assertions listed below. All
SUP assertions must pass on **both engines in all three connection timezones**.
Approximate line references are supplemented with exact anchors so formatting does
not invalidate discoverability.

| Scenario/subrequirement | Executed assertion reference | Independently expected outcome |
| --- | --- | --- |
| 1 exact observed event labels; no invented success meaning | SUP `dashboard.ts:304`, `exact observed labels and daily event occurrences, separate product/ops` | `appliedFilters.event === 'login'`; label/column is exactly `login`; `meaningSource === 'observed_only'`, warning retained. Seeded events use custom event type **2**, separate from mirrored pageviews. |
| 1 daily occurrence series | Same SUP assertion | Product daily occurrences **[3,2,0]**, ops **[1,0,0]**. Repeated staff-1 occurrences and anonymous activity count as occurrences; no bucket arithmetic by a model. |
| 1 identified user totals; no cross-site identity join | SUP `dashboard.ts:328`, `identified users stay source-scoped despite repeated identity` | Product **2**, ops **1**, each result bound to its website ID, despite staff-1 shared between websites. Anonymous excluded. |
| 1 persisted dashboard separates product and ops | SUP `dashboard.ts:340`, `staff board persists separate source widgets and observed-only meaning` | Commit four distinct intended analysis IDs; authenticated persisted-board read must contain exactly staff-0→product series ID, staff-1→ops series ID, staff-2→product identified-users ID, staff-3→ops identified-users ID. Each readback entry must match ID/hash/revision/intent and contain successful complete execution metadata; execute each persisted reference through authenticated saved endpoint with exact results **[3,2,0] / [1,0,0] / [2] / [1]**. Each saved definition equals intended source/metric/semantics. Shared `assertStaffDashboard` is also tested with duplicated/swapped bindings, non-distinct IDs, per-entry denial/failure, wrong hash/intent and wrong actual result; all must throw. |
| 2 filtered event/person series saved/reopened, no chat memory | SUP `dashboard.ts:384`, `filtered event/person series survives real child process reopen` | Save event series and session/person activity series filtered by **country US AND distinctId staff-1**. Event buckets **[2,1,0]**, total **3**; session buckets **[1,1,0]**, bucketSessionSum **2**. Child PID differs, reads same saved board/reference/definition/hash/filters and executes identical rows. |
| 2 new events change rolling, fixed unaffected | API `scripts/test-analyst-api.ts:1693` `before fresh writes: rolling 24h = 0, fixed = 3`; `:1704` `after fresh writes: rolling 24h = 2 (48h-old excluded), fixed stays 3` | Two new events inside rolling24h and one 48h old: **0→2**, fixed **3→3**. True instant writes; range end advances; no original resultId. |
| 2 real process restart, saved replay semantics | API `scripts/test-analyst-api.ts:1732`, `restarted process executes persisted definitions with identical semantics and results` | Fresh process PID; HTTP200; definition/hash/date policy/applied filters preserved; rolling **2**, fixed **3** and exact fixed bounds. |
| 3 correct numeric aggregate | API `:732` `event numeric amount sum = 40` and adjacent loop for average20/median20/min10/max30/count2; SUP `dashboard.ts:450`, `numeric zero/null aggregates and unsupported numeric grouping` | SUP purchase values **10,30,0,missing** → sum **40**, count **3**; zero-only aggregate **0/count1**; absent property **null/count0** and `no_numeric_values`. Missing values never coerce to zero. |
| 3 metric/table display, no invented series | COMP `numeric-render.test.tsx`, `numeric aggregate metric/table renders exact value, zero and unavailable without a series` | Actual AnalysisWidget renders **40** in metric/table, count **3** in table, explicit **0**, null → `Unavailable`. Line request shows reason and table; no Chart. Injected envelopes: not DB-to-browser evidence. |
| 3 unsupported numeric series and grouping rejected | Same SUP numeric assertion | Both series request with numeric metric/property and numeric `groupBy` rejected with exact **unsupported_combination**, never approximated. |
| 4 legitimate zero | API `:563`, `totals unknown event is explicit zero`; SUP coverage assertion | Covered native query returns **0**, completeness **complete**; distinguish zero from absent collection date coverage. |
| 4 missing metric is not zero | EXEC `missing-metric.test.ts`, `omitted native stats key rejects as missing_metric rather than zero` | Inject native stats lacking pageviews → reject exact **missing_metric**, field **metric**. Fault injection, not a claim that an empty DB omits keys. |
| 4 missing numeric data distinct from numeric zero | API `:749`, `missing numeric values are null, not zero`; SUP numeric assertion | Null aggregate/count0/warning versus explicitly observed numeric zero/count1. |
| 4 no collection coverage, correct provenance | SUP `dashboard.ts:474`, `absent collection coverage differs from covered explicit zero` | New empty website discovery **null/null**; covered website exact UTC epochs **1790816400000..1790906400000**, identical for all connection timezones. In Jakarta these are **1 October 2026 08:00 WIB..2 October 2026 09:00 WIB**; epoch numbers are not shifted. |
| 4 top-N/capped output | API `:667`, `top-1 breakdown is labeled partial top-N without fabricated remainder` | Exact row DE3, completeness **partial**, `top_n_truncated`, available **null**; no invented remainder or complete coverage. |
| 5 actual semantic reuse | SUP `dashboard.ts:488`, `matching saved analysis reused; different filter/population never substituted` | Discover/read three same-name analyses. Only exact source/operation/event/filter/date/timezone/population/meaning definition matches. Commit **no new analyses**, persisted board binds exact existing ID, readback and execute **[3,2,0]**, unfiltered original population. |
| 5 reject same-name wrong filter/population | Same SUP reuse assertion | One candidate differs **only country DE filter**, another **only semantic population**. Each hash differs. Board binds neither wrong ID; execute retains desired population and empty filters. Selection is scripted, not a host/model semantic inference guarantee. |

“Person series” is supported native **session activity per bucket**, filtered to a
specific identified person, not filtered distinct-user totals or whole-range uniqueness.
The existing API assertion `filtered identified users → unsupported_combination`
(`scripts/test-analyst-api.ts:764–818`) independently protects that boundary. Reuse
rejection describes the scripted orchestrator's persisted choice, not server-side
rejection of every semantically mismatched authorized analysis ID.

## Pending scenarios (strict acceptance remains blocked)

10. Browser/image/verifier/clipping/narrow/stale evidence cannot yield verified.
11. In-flight cancellation at query/commit/queue/render/repair, no late mutations/images.
12. Native boards and historical snapshots unchanged with flags off.

Scenarios6–9 now bind the complete assertion sets in `authority-evidence.ts`,
`offline.ts` and the map below. Scenarios10–12 remain unproven as groups even when
some reused tests overlap them. Later slices must bind and execute every missing
subrequirement. E2 live selection/visual understanding,
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

Review corrections P1/P2: `staff-dashboard.ts:assertStaffDashboard` and
`staff-dashboard.test.ts` bind the persisted dashboard assertion and mutation controls;
`offline.ts:vitestEvidence` and `vitest-evidence.test.ts` retain/check the complete
structured Vitest report. `run-offline.ts` fingerprints runner/config/parser/setup and
all acceptance tests. A missing or failed report never supplies component/executor
coverage. Review refresh may reuse source-qualified API receipts only; all six affected
supplements and the complete evidence gate execute again.

See `validation.md` for executed receipt/results and limitations. A green title or
this manifest's presence is never evidence by itself.


## Slice02 clarification / authority exact executed map

Receipt: `evidence/clarification-authority.json`, completed thirteen subprocesses,
**not** just a taxonomy or requirement list. New **AUTH-PG** command is
`PGOPTIONS="-c timezone=$ZONE" npx --yes pnpm@12.3.4 exec tsx scripts/ai/analyst-evals/authority.ts`
for UTC, Asia/Jakarta and America/New_York. Every one of its five assertions must
pass in all three zones. **REUSE** is freshly executed exact source-qualified
Vitest assertion extraction from `src/lib/analyst-verifier/authority.test.ts` and
`port.test.ts`; whole structured report is retained as `authorityVitestReport`.
**GENERIC** is the new `generic-authority.test.ts` in evaluator Vitest.
API-PG/CH above both freshly execute all114 checks; no API receipt reuse this time.
Machine anchors below resolve via `authority-evidence.ts` literal assertion names,
not line numbers that drift under formatting. `offline.test.ts` removes **each**
binding to prove it makes its scenario pending; parser tests reject wrong source,
failed/missing results and successful exit without actual assertions.

| Scenario/subrequirement | Exact source-qualified executed evidence | Independent expected outcome / boundary |
| --- | --- | --- |
| 6 meaningful question; no guessed semantics | AUTH-PG `authority.ts:check('discover IDs and schema then ask meaningful ambiguity with needs_input and no guessed mutation')`; `clarification.ts:assertNeedsInput`; negative controls `clarification.test.ts` | Actual `ask_user` emits **Does the observed login event mean a successful staff sign-in, or only a sign-in attempt?**, bounded three options including **Unknown: keep the observed login label**. Persisted task **awaiting_user**, no boards/analyses/revisions/operation mutation, forged guess rejected. Actual reply returns unknown, resumes running and stored observed-only definition unchanged. |
| 6 source IDs/schema discovered without user prompt | Same AUTH-PG assertion | Real `analyst_discover({})` returns exact owned website ID/name + metric capabilities, authenticated native metrics/property routes return **login** and **[]**. Read-only scoped transaction with localUTC guarantees deterministic namespace/timezone. Taxonomy supplies facts, **not** an answer to business meaning. |
| 7 foreign preview/create/save/private execute | API `authorityApiRequirements`: `7.preview`, `7.save`, `7.private`, `7.board` | Foreign website preview/create **403**; private analysis read/execute/PATCH denied; foreign AnalysisWidget reference rejected. Authenticated routes and real engines, not tool doubles. |
| 7 revocation preview/save/execute | AUTH-PG `source revocation denies render authority and existing artifact release`; API `7.execute`, `7.board-save`, `7.bundle` | Transfer website to foreign principal; preview and saved execution **403**, validate referenced board bundle rejected. API board create/update and bundle denied after revocation. |
| 7 foreign/stale/revoked render and artifact release | AUTH-PG `foreign stale malformed and team-revoked references deny capability and artifact release`; `source revocation...` | Mint while authorized, then revoke source, analysis/board ownership, team source membership or increment board/analysis revision: capture preparation, capability exchange and previously minted artifact release denied; denied artifact deleted. Foreign user/task cannot fetch; valid owner/team access remains allowed before each change. Malformed definition denied. Synthetic1x1 PNG validates bytes/privacy boundary, **not a browser screenshot**. |
| 7 exact render envelopes/current authority rechecked | REUSE `authority.test.ts` exact `7.authority`, `7.envelopes`, `7.after-query`, `7.native` and `port.test.ts` `7.render`, `7.canvas` in `reusableAuthorityAssertions` | Current task/board/analysis rights/revisions, wrong source/hash/ID, post-execution revocation, native source revocation and unauthenticated/replayed canvas denied. Injected collaborators + simulated launcher prove host protocol/denial logic, **not DB/browser success**; AUTH-PG supplies real permissions. |
| 7 section access | Source `src/permissions/share.ts:canViewWebsiteSection` and AUTH-PG current website ownership/team revocation | Authenticated section access delegates to current canViewWebsite; no separate user section grant exists. Verifier derives a real user, not a share token. No invented independent section-grant test. Native revoked-source REUSE covers its section helper; share-token-only principals cannot enter authenticated analysis/verifier flow. |
| 7 stale preview/save/execute vocabulary | API `PATCH with expected revision`/`stale expected revision conflicts`, `execute rejects caller overrides`; AUTH-PG stale board/analysis artifact cases | Unsaved preview has no saved-reference revision. Saved execution accepts no caller source/filter/revision override. Stale writes conflict rather than substitute a new saved definition; saved render/artifacts bind exact captured revisions. No claim of a nonexistent preview revision parameter. |
| 8 duplicate commit / concurrency | API `8.replay` | Same task/principal/key replay returns exact original board ID; concurrent same-key commit results one board, exactly two analyses/revisions, no duplicate metadata. |
| 8 conflicting key and revision atomicity | API `8.key`, `8.reference`, `8.revision` | Changed request under key **409**; task scoping distinct; bad refs rejected without write. Stale board revision after grant claim/new analysis writes **409**, counts unchanged, grant unused, operation absent. |
| 8 actual partial failure | AUTH-PG `partial failure after metadata writes rolls back board analyses revisions operation and task provenance` | Trusted transaction-record callback sees **+1 board,+1 analysis,+1 revision** inside transaction, writes task provenance, then throws seeded error. All durable counts and entire task row unchanged; operation key absent. Fault injection **after actual PG writes**, not prevalidation/mock success. |
| 9 existing edit confirmation; decline/stale unchanged | AUTH-PG `declined and stale existing-board approval leave metadata unchanged; accepted exact edit applies` | Actual existing board (not task-owned) gets exact target/revision diff. Decline denied; revision changes during wait conflict. Whole board row + counts unchanged versus immediately before reply; no grants minted. Accepted exact edit changes name/revision once. |
| 9 grant binding/expiry/revocation/single-use | API `9.binding`, `9.revoked`, `9.single-use`, `8.revision` | Foreign/task/diff/expired grants denied with no mutation. Revoked source denies after grant; matching grant consumed once; same key replays, fresh key cannot reuse. Stale CAS rollback leaves grant unconsumed. |
| 9 sharing/deletion/edit generic aliases | GENERIC `generic edit share delete and method aliases cannot dispatch lifecycle writes even with nested approval claims` | POST/PUT/PATCH/DELETE across existing board/delete/share/shares, analyses, bundle and nested team board routes all **denied**, no confirmation or fetch. Lower/mixed-case and unsupported methods invalid. Nested model confirmation/task/_method claims cannot grant authority. A throwing fetch spy is denial evidence, **not mocked persisted success**. |
| 9 unsupported sharing unchanged | API `9.sharing`, `9.share-unchanged` | Actual sharing route refuses AnalysisWidget board, widget intact and share count0, independent of generic-tool denial. Unsupported capability stays denied, not enabled by confirmation. |

`needs_input` here is the evaluation **outcome** defined in originating UX vocabulary:
meaningful unresolved question + actual persisted awaiting_user + no guessed mutation.
It is not a product task-status enum. Code validates question/interaction/persistence;
scripted fixture does **not** prove a live model notices ambiguity or selects the
right question. Definition/artifact hashes prove provenance, never model judgment.
No native Pi, paid provider, image inspection, browser render or deployment claimed.
Full scenario10–12 group proof and strictE1 PASS remain later slice03 work.
