# Slice01 executed validation

Observed **17 November 2026, 16:24:39 Asia/Jakarta (WIB)**. Base ancestry:
`18a63432d` is an ancestor of isolated branch `analyst-slice-01`.

## Durable evidence

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
