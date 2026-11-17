/* eslint-disable no-console */
/** Read-only bind probes after seeding one uniquely owned disposable table. Not acceptance. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const namespace = `analyst_bind_${Date.now()}_${process.pid}`;
assert.match(namespace, /^analyst_bind_\d+_\d+$/);
const psql = (sql: string) => execFileSync(`${process.env.PG_BIN}/psql`, ['-XAt', '-h', '127.0.0.1', '-p', '25432', '-U', 'ai_synthetic', '-d', 'ai_synthetic', '-v', 'ON_ERROR_STOP=1', '-c', sql], { encoding: 'utf8' }).trim();
assert.equal(psql('select owner from public.ai_synthetic_owner'), 'umami-ai-synthetic-r3');
process.env.DATABASE_URL = `postgresql://ai_synthetic@127.0.0.1:25432/ai_synthetic?schema=${namespace}`;
for (const key of ['DATABASE_REPLICA_URL', 'REDIS_URL', 'CLOUD_MODE', 'CLICKHOUSE_URL']) delete process.env[key];
let client: any;
try {
  psql(`create schema ${namespace}; create table ${namespace}.website_event (created_at timestamptz(6), event_name varchar(50)); insert into ${namespace}.website_event values ('2026-10-01T01:00:00Z', 'login')`);
  client = (await import('@/lib/prisma')).default.client;
  const probe = async (parameter: Date | string) => {
    const [result] = await client.$queryRawUnsafe(`select current_setting('TimeZone') as timezone,
      extract(epoch from $1::timestamptz)*1000 as timestamptz_epoch,
      $1::timestamp::text as timestamp_wall,
      ('2026-10-01T01:00:00Z'::timestamptz between $1::timestamptz and '2026-10-04T00:00:00Z'::timestamptz) as seed_in_bound_range`, parameter);
    return { parameterType: parameter instanceof Date ? 'Date' : 'offset-aware ISO string', input: parameter, ...result };
  };
  const literal = psql(`select count(*), min(extract(epoch from created_at)*1000) from ${namespace}.website_event where created_at between '2026-10-01T00:00:00Z'::timestamptz and '2026-10-04T00:00:00Z'::timestamptz`);
  assert.equal(literal, '1|1790816400000.000000');
  const date = await probe(new Date(1790812800000));
  const iso = await probe('2026-10-01T00:00:00.000Z');
  assert.equal(Number(iso.timestamptz_epoch), 1790812800000);
  assert.equal(iso.seed_in_bound_range, true);
  console.log(JSON.stringify({ tableType: 'timestamptz(6)', expectedStartEpoch: 1790812800000, literal, date, iso }, (_key, value) => typeof value === 'bigint' ? value.toString() : value));
} finally {
  await client?.$disconnect();
  psql(`drop schema ${namespace} cascade`);
}
