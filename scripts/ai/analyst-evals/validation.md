# Slice01 executed validation

Observed **17 November 2026, 16:24:39 Asia/Jakarta (WIB)**. Base ancestry:
`18a63432d` is an ancestor of isolated branch `analyst-slice-01`.

## Review correction receipt (P1 / P2)

Observed **17 November 2026, 16:52:38 Asia/Jakarta (WIB)**. Review refresh is
[`evidence/dashboard-numeric-review.json`](evidence/dashboard-numeric-review.json).
The earlier `dashboard-numeric.json` is retained as historical/source-qualified API
receipt, not current P1/P2 proof. The refresh contains:

- Six freshly executed real supplements (PG/CH × UTC/Jakarta/New_York), all seven
  named assertions passing each, now including exact persisted staff-widget bindings,
  per-entry successful readback and authenticated saved-execution values.
- Fresh Vitest **six files / ten passing tests**. The **entire structured JSON report**
  is retained in `vitestReport`, including every assertion, status and failure messages;
  it is not just a reference to a deleted temporary file.
- Sixteen current source fingerprints, including runner, config, setup, evidence parser,
  shared staff acceptance assertion and every evaluator test. All16 fingerprints were
  independently recomputed against executed worktree bytes and matched.
- Two reused unchanged API commands (114 checks each), validated by API harness/fix
  fingerprints and production dependency diff guard; `reusedFrom` records the previous
  receipt path and SHA-256. No claim of a fresh broad API rerun in this refresh.
- Completed strict output `proven:[1,2,3,4,5]`, `pending:[6,7,8,9,10,11,12]`;
  **actual shell exit1 retained** in `/tmp/slice01-review-eval.exit`.

Exact refresh command (after activating umami/exporting PG_BIN):

```sh
node_modules/.bin/tsx scripts/ai/eval-analyst.ts --offline --strict \
  --reuse-api-receipt scripts/ai/analyst-evals/evidence/dashboard-numeric.json \
  --output /tmp/slice01-review-evidence.json
```

Test-first red: new staff-acceptance test initially could not import the missing
assertion module; Vitest-report test failed before `vitestEvidence` existed. After
minimal implementation, mutation controls reject duplicate/swapped bindings,
non-distinct IDs, individual denial/failure, wrong intent/hash and incorrect results.
The same `assertStaffDashboard` is used by real supplement and negative controls.
`vitestEvidence` retains full results and cannot accept absent/failed command/report.
Direct `npx --yes pnpm@12.3.4 exec vitest run -c scripts/ai/analyst-evals/vitest.config.ts`
also passed all10 tests. Tsc remains exit2 with the same three unrelated diagnostics;
no new changed-path diagnostics. No production code changed for this review fix.

### Preexisting dirty formatting provenance

Five dirty files were present at recovery before any new edit: `api-evidence.test.ts`,
`offline.test.ts`, `offline.ts`, `run-offline.ts`, and historical `dashboard-numeric.json`.
The full diff was saved outside source at `/tmp/slice01-review-inherited-dirty.patch`.
All five diffs were manually inspected: only formatting/optional trailing commas;
JSON structural comparison was identical. Source mtimes were **16:28:21 WIB**, after
previous report; responsible formatter/process is unknown. No semantic inherited edit
was executed. These verified formatting changes are preserved in the scoped correction
commit, not silently discarded. The historical receipt's JSON values are unchanged.

## Original durable evidence

[`evidence/dashboard-numeric.json`](evidence/dashboard-numeric.json) is the completed
fresh recovery run, not the abandoned first run. It contains **nine successful
subprocesses**, raw stdout, named assertions, source revision `18a63432d`,
`sourceDirty:true`, seven exact SHA-256 source fingerprints and fixture hash.
The dirty flag is intentional: code was executed before committing. Those fingerprints
were independently rechecked against this checkout after execution; all seven matched.
The receipt is offline/scripted and must never be submitted as an approved live report.

Executed from this checkout after activating `umami` and exporting
`PG_BIN=$CONDA_PREFIX/bin`:

| Command | Actual result |
| --- | --- |
| `DATABASE_URL=postgresql://ai_synthetic@127.0.0.1:25432/ai_synthetic npx --yes pnpm@12.3.4 exec prisma generate` | Passed; generated worktree-local `src/generated/prisma`, not shared node_modules. |
| `npx --yes pnpm@12.3.4 exec tsx scripts/test-analyst-api.ts --postgres` with process-local NY PGOPTIONS | Passed **114 checks**, including real connection timezone, restart and rolling/fixed fresh writes. |
| Same with `--clickhouse` | Passed **114 checks**, actual CH queries plus PG metadata. A separate recovery CH run also exited0 with114 checks. |
| `tsx scripts/ai/analyst-evals/dashboard.ts postgres`, each UTC/Jakarta/NY PGOPTIONS | All **three passed, seven named assertions each**. |
| Same with `clickhouse` | All **three passed, seven named assertions each**. |
| `npx --yes pnpm@12.3.4 exec vitest run -c scripts/ai/analyst-evals/vitest.config.ts` | Passed **4 files / 6 tests**, including negative evidence controls, real component DOM and missing-key injected contract. Repeated inside completed E1 run via JSON reporter with all6 assertions passing. |
| `npx --yes pnpm@12.3.4 exec vitest run src/lib/ai/assistant/analyst/analyst.test.ts` | Passed **26 tests**. |
| `npx --yes pnpm@12.3.4 exec vitest run src/lib/ai/assistant/analyst/deps.test.ts src/lib/analyst/definition.test.ts` | Passed **1 selected file /39 tests**; `deps.test.ts` does not exist, so this is definition coverage only, not a claimed deps-test pass. Real discovery regression is SUP above. |
| `tsx scripts/ai/eval-analyst.ts --offline --strict --output /tmp/slice01-evidence.json` | Finished all9 subprocesses; final report `complete:true`, `proven:[1,2,3,4,5]`, `pending:[6,7,8,9,10,11,12]`, `pass:false`; printed **NOT PASS**. Full strict E1 remains intentionally blocked. Background launch did not retain shell exit status; failure is evidenced by final report/output, not a fabricated exit-status receipt. |
| `npx --yes pnpm@12.3.4 exec tsc --noEmit` | Exit **2**, three existing diagnostics: EventsTable.tsx46/54 unsupported flexWrap, admin 2fa route.test.ts61 excessive type instantiation. **No changed-path diagnostics**; old evaluator .hash/.definition errors removed. Other diagnostics belong to integration slice. |
| `git diff --check` | Passed. |
| PostgreSQL owned namespace/marker check after execution | Only existing `analyst_fixture` among `analyst_%` namespaces; marker unchanged `umami-ai-synthetic-r3`. Harness namespaces dropped; no public or analyst_fixture mutation. |

The runner pins actual tools through local `node_modules/.bin` after the documented
pnpm/bootstrap step. Shared dependencies are symlinked; generated Prisma is local.
No project `.env` or live credential was read/copied, and no model, deployment, workflow
or checkReport change was made by this slice.

## Red evidence and honest failures

- Initial evidence-unit test failed because the acceptance module did not exist; after
  implementation, two controls passed. API-output parser regression separately failed
  `apiEvidence is not a function` before implementing completion/count validation.
- Real supplement initially exposed a discovery **-4h epoch shift under NY** and CH
  empty website **epoch0/epoch0**. The authorized production changes were made only
  after those failed exact assertions; now exact nonempty epochs and null empty
  coverage pass both engines in all three connection timezones.
- Initial API test under UTC failed its unchanged non-UTC setup assertion; approved
  process-local PGOPTIONS corrected the test setup without changing role/database defaults.
- Original `/tmp/slice01-eval.log` ended after starting CH and had no completed receipt.
  It is not counted. Recovery ran affected source and completed all9 commands with
  durable checkpoints; no missing command is represented as passed.

## Remaining gates

Scenarios6–12 require later assertion-complete slices; E1 strict is **not accepted**
for all twelve yet. Live model selection/meaning judgment and screenshot understanding
are unproven. Numeric rendering is component-only evidence, not B3/D2. Full integration
TypeScript remains red on unrelated paths. Independent reviewer gate remains required.
Live E2 and target-bound release approval/execution remain pending; no spend or target
approval is inferred from these tests.
