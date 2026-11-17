/* eslint-disable no-console */
/** Real application pools, timestamp transport and explicit business-calendar acceptance. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
const namespace = `analyst_utc_${Date.now()}_${process.pid}`;
assert.match(namespace, /^analyst_utc_\d+_\d+$/);
const psql = (sql: string) =>
  execFileSync(
    `${process.env.PG_BIN}/psql`,
    [
      '-XAt',
      '-h',
      '127.0.0.1',
      '-p',
      '25432',
      '-U',
      'ai_synthetic',
      '-d',
      'ai_synthetic',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      sql,
    ],
    { encoding: 'utf8' },
  ).trim();
const base = `postgresql://ai_synthetic@127.0.0.1:25432/ai_synthetic?schema=${namespace}`;
// Contradict URL and inherited timezone, preserving independently requested search_path.
process.env.PGOPTIONS = `${process.env.PGOPTIONS ?? ''} -c search_path=${namespace}`.trim();
process.env.DATABASE_URL = `${base}&options=${encodeURIComponent('-c timezone=Asia/Jakarta -c lock_timeout=2345')}`;
process.env.DATABASE_REPLICA_URL = `${base}&options=${encodeURIComponent('-c timezone=America/New_York -c lock_timeout=2345')}`;
for (const key of ['REDIS_URL', 'CLOUD_MODE', 'CLICKHOUSE_URL']) delete process.env[key];
let client: any;
let created = false;
const assertions: string[] = [];
async function check(name: string, fn: () => Promise<void>) {
  await fn();
  assertions.push(name);
  console.log(`ASSERTION ${name}`);
}
try {
  assert.equal(psql('select owner from public.ai_synthetic_owner'), 'umami-ai-synthetic-r3');
  psql(`create schema ${namespace}`);
  created = true;
  execFileSync(path.resolve('node_modules/.bin/prisma'), ['migrate', 'deploy'], {
    env: process.env,
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  client = (await import('@/lib/prisma')).default.client;
  const state = async (db: any) => {
    const [s] = await db.$queryRawUnsafe(
      "select pg_backend_pid() as pid, current_schema() as schema, current_setting('TimeZone') as timezone, current_setting('lock_timeout') as lock_timeout, extract(epoch from $1::timestamptz)*1000 as bound_epoch, '2026-10-01T01:00:00.123Z'::timestamptz as preseeded, (select 1 from pg_sleep(0.08)) as waited",
      new Date(1790816400123),
    );
    assert.equal(s.timezone, 'UTC');
    assert.equal(s.schema, namespace);
    assert.equal(s.lock_timeout, '2345ms');
    assert.equal(Number(s.bound_epoch), 1790816400123);
    assert.equal(s.preseeded.getTime(), 1790816400123);
    return s.pid;
  };
  await check(
    'base replica and AI physical pools start UTC preserving owned schema and options; reconnect stays UTC',
    async () => {
      for (const db of [client.$primary(), client.$replica()]) {
        const pids = await Promise.all(Array.from({ length: 4 }, () => state(db)));
        assert.ok(new Set(pids).size >= 2, 'physical concurrency must be observed');
        await db.$disconnect();
        const reconnected = await state(db);
        assert.ok(!pids.includes(reconnected));
      }
      const { withAiRead, getAiQueryScope } = await import('@/lib/ai/query');
      const pids = await Promise.all(
        Array.from({ length: 4 }, () =>
          withAiRead(() => state(getAiQueryScope()!.tx), new AbortController().signal),
        ),
      );
      assert.equal(new Set(pids).size, 4);
      // Terminate only PIDs just observed from this owned AI pool; replacement sockets
      // must receive the same startup policy, not inherit a one-connection SET.
      for (const pid of pids)
        assert.equal(psql(`select pg_terminate_backend(${Number(pid)})`), 't');
      await new Promise(resolve => setTimeout(resolve, 100));
      const replacements = await Promise.all(
        Array.from({ length: 4 }, () =>
          withAiRead(() => state(getAiQueryScope()!.tx), new AbortController().signal),
        ),
      );
      assert.equal(new Set(replacements).size, 4);
      assert.ok(replacements.every(pid => !pids.includes(pid)));
    },
  );
  const primary = client.$primary();
  const owner = randomUUID(),
    website = randomUUID(),
    sessionId = randomUUID();
  await primary.user.create({
    data: { id: owner, username: `utc-${owner}`, password: 'not-a-login', role: 'user' },
  });
  await primary.website.create({
    data: { id: website, userId: owner, name: 'UTC transport', domain: 'synthetic.invalid' },
  });
  await primary.session.create({ data: { id: sessionId, websiteId: website } });
  const instant = 1790816400123;
  await check(
    'raw Date and ORM create update filter preserve independent stored epochs; preseeded scalar array reads preserve instants',
    async () => {
      const id = randomUUID();
      await primary.websiteEvent.create({
        data: {
          id,
          websiteId: website,
          sessionId,
          visitId: sessionId,
          urlPath: '/policy',
          createdAt: new Date(instant),
        },
      });
      assert.equal(
        psql(
          `select extract(epoch from created_at)*1000 from ${namespace}.website_event where event_id='${id}'`,
        ),
        '1790816400123.000000',
      );
      const updated = instant + 1000;
      await primary.websiteEvent.update({ where: { id }, data: { createdAt: new Date(updated) } });
      assert.equal(
        psql(
          `select extract(epoch from created_at)*1000 from ${namespace}.website_event where event_id='${id}'`,
        ),
        '1790816401123.000000',
      );
      assert.equal(
        (await primary.websiteEvent.findMany({ where: { createdAt: new Date(updated) } })).length,
        1,
      );
      const [raw] = await primary.$queryRawUnsafe(
        'select extract(epoch from $1::timestamptz)*1000 as epoch',
        new Date(instant),
      );
      assert.equal(Number(raw.epoch), instant);
      const [wall] = await primary.$queryRawUnsafe(
        'select $1::timestamp::text as wall',
        new Date(instant),
      );
      assert.equal(wall.wall, '2026-10-01 01:00:00.123');
      const [arrayInput] = await primary.$queryRawUnsafe(
        'select extract(epoch from ($1::timestamptz[])[1])*1000 as epoch',
        [new Date(instant)],
      );
      assert.equal(Number(arrayInput.epoch), instant);
      // Independent literal storage prevents input/output adapter errors cancelling each other.
      psql(
        `update ${namespace}.website_event set created_at='2026-10-01T01:00:00.123456Z' where event_id='${id}'`,
      );
      const stored = await primary.websiteEvent.findUnique({ where: { id } });
      assert.equal(stored.createdAt.getTime(), instant); // JS Date truncates sub-millisecond precision.
      assert.equal(
        psql(
          `select extract(epoch from created_at)*1000 from ${namespace}.website_event where event_id='${id}'`,
        ),
        '1790816400123.456000',
      );
      const [read] = await primary.$queryRawUnsafe(
        "select '2026-10-01T01:00:00.123Z'::timestamptz as scalar, ARRAY['2026-10-01T01:00:00.123Z'::timestamptz, NULL] as dates, NULL::timestamptz as absent",
      );
      assert.equal(read.scalar.getTime(), instant);
      assert.equal(read.dates[0].getTime(), instant);
      assert.equal(read.dates[1], null);
      assert.equal(read.absent, null);
      await assert.rejects(
        primary.websiteEvent.update({ where: { id }, data: { createdAt: new Date(NaN) } }),
      );
    },
  );
  await check(
    'Jakarta midnight half-open grouping and New York DST boundaries remain explicit under UTC sessions',
    async () => {
      const { normalizeDefinition } = await import('@/lib/analyst/definition');
      const { executeAnalysis } = await import('@/lib/analyst/execute');
      const { resolveDatePolicy } = await import('@/lib/analyst/dates');
      // Jakarta Oct2: 17:00Z preceding UTC day, next midnight excluded.
      const start = 1790874000000,
        end = 1790960400000;
      for (const [index, at] of [start - 1, start, start + 1, end - 1, end].entries())
        await primary.websiteEvent.create({
          data: {
            id: randomUUID(),
            websiteId: website,
            sessionId,
            visitId: randomUUID(),
            urlPath: `/boundary-${index}`,
            eventType: 2,
            eventName: 'boundary',
            createdAt: new Date(at),
          },
        });
      const def = normalizeDefinition({
        schemaVersion: 1,
        source: { websiteId: website },
        operation: 'series',
        metric: 'events',
        event: 'boundary',
        unit: 'day',
        timezone: 'Asia/Jakarta',
        datePolicy: { type: 'fixed', startAt: start, endAt: end },
        semanticBinding: {
          label: 'boundary',
          unit: 'occurrences',
          population: 'observed',
          meaningSource: 'observed_only',
        },
      });
      const result = await executeAnalysis(
        { user: { id: owner, role: 'user', isAdmin: false } } as any,
        def,
        { now: end },
      );
      assert.deepEqual(result.rows, [{ t: '2026-10-02T00:00:00+07:00', y: 3 }]);
      const utcGrouping = await executeAnalysis(
        { user: { id: owner, role: 'user', isAdmin: false } } as any,
        { ...def, timezone: 'UTC' },
        { now: end },
      );
      assert.deepEqual(utcGrouping.rows, [
        { t: '2026-10-01T00:00:00Z', y: 2 },
        { t: '2026-10-02T00:00:00Z', y: 1 },
      ]);
      const { formatInTimeZone } = await import('date-fns-tz');
      assert.equal(
        formatInTimeZone(new Date(start), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm'),
        '2026-10-02 00:00',
      );
      const spring = resolveDatePolicy(
        { type: 'rolling', window: 'today' } as any,
        'America/New_York',
        Date.parse('2026-03-09T03:59:59Z'),
      );
      assert.equal(spring.startAt, Date.parse('2026-03-08T05:00:00Z'));
      const fall = resolveDatePolicy(
        { type: 'rolling', window: 'today' } as any,
        'America/New_York',
        Date.parse('2026-11-02T04:59:59Z'),
      );
      assert.equal(fall.startAt, Date.parse('2026-11-01T04:00:00Z'));
    },
  );
  await check(
    'trusted SET LOCAL nonUTC is unsupported inside transaction and restores UTC on commit and rollback',
    async () => {
      for (const zone of ['Asia/Jakarta', 'America/New_York'])
        for (const rollback of [false, true]) {
          let changedPid: number;
          const work = primary.$transaction(async (tx: any) => {
            const [before] = await tx.$queryRawUnsafe(
              "select pg_backend_pid() as pid, current_setting('TimeZone') as timezone",
            );
            assert.equal(before.timezone, 'UTC');
            changedPid = before.pid;
            await tx.$executeRawUnsafe(`SET LOCAL TimeZone = '${zone}'`);
            const [s] = await tx.$queryRawUnsafe(
              'select extract(epoch from $1::timestamptz)*1000 as epoch',
              new Date(instant),
            );
            assert.notEqual(Number(s.epoch), instant); // Deliberately broken; never a supported date-semantic pass.
            if (rollback) throw new Error('synthetic rollback');
          });
          if (rollback) await assert.rejects(work, /synthetic rollback/);
          else await work;
          const restored = await Promise.all(Array.from({ length: 4 }, () => state(primary)));
          assert.ok(
            restored.includes(changedPid!),
            'restoration must observe the exact transaction connection',
          );
        }
    },
  );
  console.log(
    `EVIDENCE ${JSON.stringify({ suite: 'session-policy-pg', assertions, passed: true })}`,
  );
} finally {
  await client?.$disconnect();
  if (created) psql(`drop schema ${namespace} cascade`);
}
