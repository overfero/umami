PG_BIN=$CONDA_PREFIX/bin PGOPTIONS="-c timezone=America/New_York" timeout --signal=TERM --kill-after=10s 180s npx --yes pnpm@12.3.4 exec tsx scripts/ai/analyst-evals/dashboard.ts clickhouse
