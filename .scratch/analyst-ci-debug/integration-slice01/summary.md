# Slice01 + slice04 bounded integration evidence

Recorded **2026-11-17 17:20 WIB (Asia/Jakarta, UTC+07:00)** on `analyst-completion`.

## Merge and scope

- Slice04 already merged at `02521a61f`, ticket resolved in `9f529d846`.
- Slice01 committed tip `94fc14c76` (including `fd4a18948` / `018631d2d`) merged with `--no-ff` at `f8d89cd3fde389a482e53bccf9bdb06bf0b74feb`.
- Only conflict: `scripts/ai/eval-analyst.ts` imports. Retained slice04 fail-closed `validateReport`/`checkReport` and CLI behavior, plus slice01 `runOffline` dispatch; removed obsolete offline implementation. No other integration product changes.
- Independent slice01 **ACCEPT**, no findings: `/home/overfero/.pi/agent/sessions/--home-overfero-Project-ocbc-umami--/subagent-artifacts/920b33be-1d60-4875-b833-6935463133cf_reviewer_output.md`. Reviewer inspected committed snapshots, not dirty source-worktree formatting; reviewer did not execute tests.
- Source-worktree post-turn formatting was not copied. Integration preexisting formatter patch saved locally as `premerge-formatting.patch`. A later integration-only formatter diff was saved as `postturn-formatting.patch`, manually inspected and verified equal by parsed TypeScript AST node kinds/child order/leaf text, then restored to merge bytes. Early ad-hoc transpile-text/scanner comparison attempts failed because of formatting/template scanning, not product tests. No formatter change is staged.

## Actual merged-source validation

Activated conda `umami`; Node v22.23.5, pinned `npx --yes pnpm@12.3.4` (version checked: 12.3.4). Commands and raw output are adjacent `.command`, `.log`, `.exit` files.

| Command | Result |
| --- | --- |
| `npx --yes pnpm@12.3.4 exec tsx --test scripts/ai/analyst-report/report.test.ts` | exit **0**, 13 passed, no skipped/failed tests (`report.*`). |
| `npx --yes pnpm@12.3.4 exec vitest run -c scripts/ai/analyst-evals/vitest.config.ts` | exit **0**, six files / ten tests (`evaluator.*`). Aggregate log only; no new structured JSON was emitted. |
| `npx --yes pnpm@12.3.4 exec vitest run src/lib/ai/assistant/analyst/analyst.test.ts` | exit **0**, 26 passed (`analyst.*`). |
| `npx --yes pnpm@12.3.4 exec vitest run src/lib/analyst/definition.test.ts` | exit **0**, 39 passed (`definition.*`). |
| `npx --yes pnpm@12.3.4 exec tsc --noEmit` | exit **2**, four unrelated diagnostics, detailed below (`tsc.*`). |
| `git diff --check` | exit **0** (`diff-check.*`). |

### Interrupted strict run — not a completed acceptance run

With `PG_BIN=$CONDA_PREFIX/bin`, launched `e1.command` without API receipt reuse. `e1-receipt.json` is the **original, unmodified `complete:false` checkpoint**; `e1.log` retains progress. The user requested stop/continue while it was in the ClickHouse New York supplement; parent interrupted the run and confirmed no remaining eval/dashboard process. **There is no `e1.exit` or `e1-end.txt`. No strict CLI exit is claimed.** Do not treat this checkpoint as a completed/reusable runner receipt.

Seven subprocesses completed successfully before interruption, with full output retained in the checkpoint:

1. PostgreSQL API: **114 checks**, process-local New York `PGOPTIONS`.
2. PostgreSQL supplements: UTC, Jakarta, New York, **seven named assertions each**.
3. ClickHouse API: **114 checks**, process-local New York `PGOPTIONS`.
4. ClickHouse supplements: UTC and Jakarta, **seven named assertions each**.

Only the missing ClickHouse New York supplement was then executed separately:

```sh
PG_BIN=$CONDA_PREFIX/bin PGOPTIONS='-c timezone=America/New_York' \
  timeout --signal=TERM --kill-after=10s 180s \
  npx --yes pnpm@12.3.4 exec tsx scripts/ai/analyst-evals/dashboard.ts clickhouse
```

**Actual exit 0**, seven named assertions and `EVIDENCE ... passed:true`, retained in `ch-ny.*`. No broad suite was restarted. These are partial integration command results, not a relabeled complete strict run. `integration-provenance.json` records this distinction and sixteen post-run hashes checked against committed `f8d89cd3f` bytes. The interrupted runner did not reach its source-hash/final-report stage; these post-run hashes do not retroactively fill that gap.

Accepted slice-local structured evidence remains in `scripts/ai/analyst-evals/evidence/dashboard-numeric-review.json`: six files / ten tests, scenarios 1–5 proven, 6–12 pending, `pass:false`, reviewed strict shell exit 1. This is historical accepted evidence, **not a fresh integration receipt**. Its CLI fingerprint cannot match the merged `eval-analyst.ts`; no claim that cached receipt hashes match integration source. The integration test log is fresh but aggregate-only; no synthetic structured report was invented.

### TypeScript findings (not fixed)

- `src/app/(main)/websites/[websiteId]/events/EventsTable.tsx:46,54`: unsupported `flexWrap` on `RowProps` (two TS2322).
- `src/app/api/admin/users/[userId]/2fa/route.test.ts:61`: TS2589 excessive type instantiation.
- `src/app/mcp/route.ts:28`: TS2322 local/installed `UmamiClient` private `fetchImpl` identity mismatch. This fourth diagnostic is additional to the three listed in slice01's earlier environment; it is outside merged paths and not silently fixed.

No changed-path diagnostics. Global I1 is **not passing**.

## Boundaries and stop

Harnesses used their own disposable PG schemas / CH databases. Pre/postflight checks retained unchanged owner marker `umami-ai-synthetic-r3`, only existing `analyst_fixture` among PG `analyst_%` schemas, and only system/default CH databases after continuation. No write to public/analyst_fixture, model, production, `.env`, deployment, main merge or push. No unrelated untracked files were staged or removed.

**Slice01 and slice04 are merged and affected tests are green. Full E1 is NOT PASS: scenarios 6–12 remain pending.** Interrupted integration CLI acceptance remains incomplete. No live E2, browser/visual or release acceptance is inferred. Stop after ticket01 bookkeeping; no next ticket, cleanup or further suite launch.
