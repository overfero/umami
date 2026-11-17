# Analyst lifecycle evaluation (E1/E2)

`scripts/ai/eval-analyst.ts` is the analyst-lifecycle counterpart to the spec's required
12-scenario acceptance set (`wiki/specs/analyst-dashboard-lifecycle.md` §"Acceptance scenarios
and evaluation"). It has two independent modes.

## E1 — offline (no network, no model, no native Pi process)

```sh
npx --yes pnpm@12.3.4 exec tsx scripts/ai/eval-analyst.ts --offline --strict
```

Requires a disposable Postgres fixture (`scripts/ai/synthetic-engines/setup.sh`, or the
equivalent manual `ai_synthetic_owner` marker + `ai_synthetic` role/db on 127.0.0.1:25432 used by
`scripts/test-analyst-api.ts`). Set `PG_BIN` if `psql` is not on `PATH`.

This drives the 12 required scenario groups by calling the real production
`executeAnalystTool`/`ensureTask` lifecycle (`src/lib/ai/assistant/analyst/{task,tools,deps}.ts`)
and the real board/analysis persistence directly, in-process. The tool-call sequence for each
scenario is **scripted in this file**, not decided by an LLM or routed through the native Pi CLI:
this proves the lifecycle/authority/repair/verifier contracts a natural-language agent turn would
exercise, not that a live model reliably chooses the same tool calls on its own. That is a
materially narrower claim than D2 (which does drive the real native Pi RPC loop) — it is the
tradeoff made explicitly to keep this harness affordable to build and run; see the inline comment
at the top of `eval-analyst.ts`.

Two scenario groups are honestly narrower than the spec's full description, noted inline where
they occur:

- **Material ambiguity** (#6): without Pi there is no "ask the user a clarifying question" step
  to exercise. The harness instead asserts the *tool-evidence* precondition for that UX step:
  discovery returns raw, unresolved taxonomy, and a definition claiming a stronger meaning
  (`repository_definition`) is never silently substituted for `observed_only`.
- **Flags-off compatibility** (#12): this script never sets `AI_ANALYST_ENABLED=false` itself
  (the direct-tool-call path it drives doesn't go through that flag check at all). It instead
  exercises the narrower, still-real guarantee: a saved analysis keeps executing read-only through
  the exact same executor boards use, independent of the create/commit path the flag gates.

`--strict` exits non-zero if any of the 12 groups is missing or fails to reach its required final
state (`verified`, `data_verified_visual_pending`, `needs_input`, `blocked`, or `cancelled` per
the spec's final-state vocabulary). A scenario whose evidence is incomplete is reported as that
scenario's own failure, never silently reported as `verified`.

## E2 — check a recorded live evaluation report

```sh
npx --yes pnpm@12.3.4 exec tsx scripts/ai/eval-analyst.ts --check-report docs/ai-analyst-eval.json
```

Validates the shape and scenario/run/safety thresholds of a previously recorded **live**
evaluation report (same configured model/settings, baseline vs. candidate, ≥3 runs per scenario,
every safety-relevant group's runs all required to pass). It runs nothing itself and makes no
network or model call; a missing report file is `NOT PASS`, not a silent skip. Producing that
report is a separately approved, spend-ceilinged release gate — not part of this repository's
offline test suite.
