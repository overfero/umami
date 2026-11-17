# 04: Validate live reports fail-closed

**What to build:** Validate live reports fail-closed as an independently verifiable end-to-end slice of the approved completion spec.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Add pure report-validation tests and CLI checks rejecting empty metadata, arbitrary groups, zero/fewer-than-three runs and incomplete baseline/candidate coverage. Evidence: merged `report.test.ts` metadata, canonical coverage and CLI regression tests passed.
- [x] Require canonical twelve scenarios, identical qualified model/settings, source/image/fixture evidence, costs and screenshot coverage. Evidence: independent ACCEPT review of `18a63432d..fb4cec946`; merged qualification, accounting, screenshot and per-job pagination tests passed.
- [x] All safety and required supported lifecycle runs must pass; all failures retained. Evidence: merged validator tests reject failed/aborted/unknown outcomes and unreconciled failure/cost ledgers; this validates supplied records, not actual live execution.
- [x] Accept a complete synthetic VALIDATION fixture without calling any live model; documentation distinguishes validator test from live evidence. Evidence: pure fixture test passed; CLI test rejects VALIDATION evidence; `docs/ai-analyst-report-schema.md` states independent authentication and live-evaluation boundaries.

## Parent

[Completion spec](../spec.md). Follow the originating spec and retain honest evidence boundaries.

## Resolution evidence

- Recorded at **2026-11-17 16:58:09 WIB (Asia/Jakarta, UTC+07:00)**.
- Independent review: **ACCEPT — slice-local merge verdict: OK**, no findings, in `/home/overfero/.pi/agent/sessions/--home-overfero-Project-ocbc-umami--/subagent-artifacts/5112d9fc-20bd-4c73-a984-411a4f6ac9d4_reviewer_output.md`. Review covered committed `18a63432d..fb4cec946` and fix range `791ba0764..fb4cec946`; reviewer did not independently execute checks.
- Merged only committed `analyst-slice-04` tip `fb4cec946be5c0d68927625d342a9084a5a61200` (including `791ba0764`) into `analyst-completion` at `02521a61f157335b354be2fd4d7c6272aa8af8a1`, using `git merge --no-ff`. The six merged slice files match the accepted source tip exactly; dirty source-worktree formatting was not copied or staged.
- Integration-byte validation: after `source /home/overfero/miniconda3/etc/profile.d/conda.sh` and `conda activate umami`, ran `npx --yes pnpm@12.3.4 exec tsx --test scripts/ai/analyst-report/report.test.ts`: **13 tests passed, 0 failed, 0 skipped**. Log: `/tmp/analyst-slice04-merged-tests.PLxBfI.log`. `git diff --check` passed. No tracked dependency changes resulted.
- Scope: validator/CLI consistency checks and synthetic fixtures only. No live model, production, database, deployment, or `.env` access; no push or merge to `main`. Unrelated untracked files were not staged or removed.
- Pending gates: authenticated approval/evidence review, separately authorized live evaluation and release/rollout readiness. Existing global TypeScript failure is not cleared by this slice-local acceptance; global TypeScript checks were not rerun here.
