# Analyst lifecycle evaluation (E1/E2)

The originating contract is `wiki/specs/analyst-dashboard-lifecycle.md` §7. Offline
assertions are **not** live reasoning, image understanding or a release approval.

## E1: deterministic, assertion-linked evidence

```sh
source /home/overfero/miniconda3/etc/profile.d/conda.sh
conda activate umami
export PG_BIN="$CONDA_PREFIX/bin"
# Generate into this checkout's src/generated/prisma, not a shared dependency directory.
DATABASE_URL=postgresql://ai_synthetic@127.0.0.1:25432/ai_synthetic \
  npx --yes pnpm@12.3.4 exec prisma generate
npx --yes pnpm@12.3.4 exec tsx scripts/ai/eval-analyst.ts \
  --offline --strict --output /tmp/analyst-offline.json
```

Requires the owned disposable PostgreSQL/ClickHouse pair on **127.0.0.1:25432/28123**,
role/database `ai_synthetic`, and PostgreSQL `public.ai_synthetic_owner` marker
`umami-ai-synthetic-r3`. No application `.env` or live credentials are needed. The
harness creates/drops only its unique namespaces; it never modifies `public` or
`analyst_fixture`. Database loopback calls occur; there are **no model/provider calls**.
Do not describe this as having no network traffic.

The runner executes real authenticated route handlers and task-bound tools, existing
PostgreSQL/ClickHouse API acceptance, real child-process reopen, and the separately
classified component/fault-injection tests. The exact assertion manifest is
[`scripts/ai/analyst-evals/coverage.md`](../scripts/ai/analyst-evals/coverage.md), backed
by executable `requirements` in `offline.ts`. Missing executed assertions fail closed.
A successful process exit without assertion names and completion markers is insufficient.

**Current scope: scenarios 1–5. Scenarios 6–12 remain pending. Consequently full
`--offline --strict` must exit 1, even when every implemented assertion passes.**
Non-strict output also says `NOT PASS` for pending coverage; it never claims all twelve
are verified. Existing requirements for scenarios 6–12 are unchanged, not replaced by
weaker taxonomy, post-cancel or direct-executor proxies.

`--output` records command outputs, assertion receipts, source revision, dirty state,
source/fixture hashes and observation time in **Asia/Jakarta (WIB)**. It checkpoints after
each subprocess (`complete:false`); an interrupted checkpoint is not completed evidence.
The final report has `complete:true`, `proven`, and `pending`. It retains the full
Vitest structured report (including every file/assertion status and failure messages),
and fingerprints the runner, config, setup, parsers, acceptance assertions and tests.
It is not an E2 live report.

For a review-only supplement correction, `--reuse-api-receipt <completed-offline.json>`
may reuse only the previous PG/CH API commands. It requires the exact API harness and
approved production-fix fingerprints, checks that other API dependency paths have not
changed since that receipt, and records the previous receipt SHA-256. All six supplement
executions and Vitest still run freshly. Omit this option for an entirely fresh E1 run.

The API harness intentionally uses a process-local
`PGOPTIONS='-c timezone=America/New_York'`; its actual Prisma connection asserts the
non-UTC setting. The supplement runs under UTC, Asia/Jakarta and America/New_York and
requires identical epoch provenance in all three. Fixed spec bounds remain canonical
UTC instants. For example epoch `1790812800000` is **1 October 2026 07:00 WIB**;
displaying it in Jakarta must not change that number.

### Evidence boundaries

- Tool choices, matching/rejection of semantic candidates and the board plan are scripted.
  Their persisted effects and real query results are asserted; reliable model selection is E2.
- Numeric correctness is measured against real PG/CH rows including zero and absent values.
  `numeric-render.test.tsx` separately imports the real AnalysisWidget but injects its query
  envelope and component wrappers. It proves DOM rendering, not a real browser, Docker
  renderer, screenshot inspection or the DB-to-browser transport.
- `missing-metric.test.ts` injects an omitted native stats key into the real executor.
  It proves the failure contract, not that an empty database omits that key. Empty native
  queries normally return an explicit zero.
- Absent collection coverage is discovery `{startAt:null,endAt:null}`, independently of a
  covered source's complete zero result. The executor does not itself emit a
  `missing_collection_coverage` code. No activity conclusion follows from absent coverage.
- Filtered session series means native pageview-active session buckets; it does not promise
  an event-filtered distinct-person series or whole-range unique users. The API rejects
  unsupported filtered identified-user totals instead of substituting sessions.

## E2: separately approved live report

```sh
npx --yes pnpm@12.3.4 exec tsx scripts/ai/eval-analyst.ts \
  --check-report docs/ai-analyst-eval.json
```

The check-report implementation is separately owned. A missing approved live report is
NOT PASS. No model spend, live baseline/candidate run, image-capability preflight or
release execution is authorized by offline success. All originating live thresholds
and the separate target-bound release gate remain required.
