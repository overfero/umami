/* eslint-disable no-console */
/** Real synthetic API/tool supplement. No model, browser or paid provider is involved. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const engine = process.argv[2];
assert.ok(['postgres', 'clickhouse'].includes(engine), 'explicit synthetic engine required');
const child = process.env.ANALYST_DASHBOARD_CHILD
  ? JSON.parse(process.env.ANALYST_DASHBOARD_CHILD)
  : null;
const namespace = child?.namespace ?? `analyst_eval_${Date.now()}_${process.pid}`;
assert.match(namespace, /^analyst_eval_\d+_\d+$/);
const base = 'postgresql://ai_synthetic@127.0.0.1:25432/ai_synthetic';
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
async function ch(sql: string) {
  const response = await fetch('http://127.0.0.1:28123/', {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from('ai_synthetic:synthetic-only').toString('base64')}`,
    },
    body: sql,
    signal: AbortSignal.timeout(10_000),
  });
  const text = await response.text();
  assert.ok(response.ok, text.slice(0, 300));
  return text;
}
process.env.DATABASE_URL = `${base}?schema=${namespace}`;
delete process.env.DATABASE_REPLICA_URL;
delete process.env.REDIS_URL;
delete process.env.CLOUD_MODE;
process.env.APP_SECRET = `synthetic-${namespace}`;
process.env.AI_ANALYST_ENABLED = 'true';
delete process.env.AI_ANALYST_VERIFIER_ENABLED;
if (engine === 'clickhouse')
  process.env.CLICKHOUSE_URL = `http://ai_synthetic:synthetic-only@127.0.0.1:28123/${namespace}`;
else delete process.env.CLICKHOUSE_URL;
const day = 86_400_000;
const start = Date.UTC(2026, 9, 1);
const ids = child?.ids ?? {
  owner: randomUUID(),
  product: randomUUID(),
  ops: randomUUID(),
  empty: randomUUID(),
};
const emitted: string[] = [];
async function check(name: string, fn: () => unknown | Promise<unknown>) {
  await fn();
  emitted.push(name);
  console.log(`ASSERTION ${name}`);
}
async function main() {
  assert.equal(psql('select owner from public.ai_synthetic_owner'), 'umami-ai-synthetic-r3');
  let pgCreated = false,
    chCreated = false;
  let client: any;
  try {
    if (!child) {
      psql(`create schema ${namespace}`);
      pgCreated = true;
      execFileSync(path.resolve('node_modules/.bin/prisma'), ['migrate', 'deploy'], {
        env: process.env,
        stdio: ['ignore', 'ignore', 'inherit'],
      });
      if (engine === 'clickhouse') {
        await ch(`CREATE DATABASE ${namespace}`);
        chCreated = true;
        for (const ddl of readFileSync('db/clickhouse/schema.sql', 'utf8')
          .replace(/--.*$/gm, '')
          .replaceAll('umami.', `${namespace}.`)
          .split(';')
          .map(s => s.trim())
          .filter(Boolean))
          await ch(ddl);
      }
    }
    client = (await import('@/lib/prisma')).default.client;
    const { createSecureToken } = await import('@/lib/jwt');
    const { secret } = await import('@/lib/crypto');
    const previews = await import('@/app/api/analyses/preview/route');
    const analyses = await import('@/app/api/analyses/route');
    const savedRoute = await import('@/app/api/analyses/[analysisId]/route');
    const executions = await import('@/app/api/analyses/[analysisId]/execute/route');
    const boardRoute = await import('@/app/api/boards/[boardId]/route');
    const { ensureTask } = await import('@/lib/ai/assistant/analyst/task');
    const { executeAnalystTool } = await import('@/lib/ai/assistant/analyst/tools');
    const { analystDeps } = await import('@/lib/ai/assistant/analyst/deps');
    const { normalizeDefinition, hashDefinition } = await import('@/lib/analyst/definition');
    const auth = { user: { id: ids.owner, role: 'user', isAdmin: false } } as any;
    async function api(handler: any, method: string, body?: unknown, params: any = {}) {
      const response = await handler(
        new Request(params.requestUrl ?? 'http://localhost/api/synthetic', {
          method,
          headers: {
            authorization: `Bearer ${createSecureToken({ userId: ids.owner, role: 'user' }, secret())}`,
            'content-type': 'application/json',
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        }),
        { params: Promise.resolve(params) },
      );
      return { status: response.status, body: await response.json() };
    }
    const preview = async (definition: any) => {
      const r = await api(previews.POST, 'POST', { definition });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      return r.body;
    };
    const definition = (source: string, patch: any = {}) => ({
      schemaVersion: 1,
      source: { websiteId: source },
      operation: 'totals',
      metric: 'events',
      event: 'login',
      datePolicy: { type: 'fixed', startAt: start, endAt: start + 3 * day },
      timezone: 'UTC',
      semanticBinding: {
        label: 'login',
        unit: 'occurrences',
        population: 'observed custom events',
        meaningSource: 'observed_only',
      },
      ...patch,
    });
    if (child) {
      const read = await api(savedRoute.GET, 'GET', undefined, { analysisId: child.analysisId });
      const execution = await api(executions.POST, 'POST', {}, { analysisId: child.analysisId });
      const board = await api(boardRoute.GET, 'GET', undefined, { boardId: child.boardId });
      console.log(`REOPEN ${JSON.stringify({ pid: process.pid, read, execution, board })}`);
      return;
    }
    await client.user.create({
      data: { id: ids.owner, username: `eval-${ids.owner}`, password: 'not-a-login', role: 'user' },
    });
    await client.website.createMany({
      data: ['product', 'ops', 'empty'].map(key => ({
        id: ids[key],
        name: key,
        domain: `${key}.invalid`,
        userId: ids.owner,
      })),
    });
    const sessions = [
      { id: randomUUID(), site: ids.product, distinct: 'staff-1', country: 'US' },
      { id: randomUUID(), site: ids.product, distinct: 'staff-2', country: 'DE' },
      { id: randomUUID(), site: ids.product, distinct: '', country: 'US' },
      { id: randomUUID(), site: ids.ops, distinct: 'staff-1', country: 'US' },
    ];
    // Independent worksheet: product login counts [3,2,0], ops [1,0,0].
    // Product staff-1 repeats on day 2; anonymous login counts as occurrence, never identified.
    const rows = [
      [0, 1, 'login', undefined],
      [0, 2, 'login', undefined],
      [1, 3, 'login', undefined],
      [0, 25, 'login', undefined],
      [2, 26, 'login', undefined],
      [3, 1, 'login', undefined],
      [0, 4, 'purchase', 10],
      [1, 4, 'purchase', 30],
      [0, 5, 'purchase', 0],
      [1, 5, 'purchase', undefined],
      [0, 6, 'zero_amount', 0],
    ].map(([s, hour, name, amount]) => ({
      s: sessions[Number(s)],
      at: start + Number(hour) * 3_600_000,
      name: String(name),
      amount,
      id: randomUUID(),
    }));
    // Native session series counts pageview-active sessions. Mirror login instants as pageviews;
    // never pretend a session series supports an event predicate (the schema rejects it).
    const analyticsRows = [
      ...rows.map(r => ({ ...r, type: 2 })),
      ...rows
        .filter(r => r.name === 'login')
        .map(r => ({ ...r, id: randomUUID(), name: '', type: 1 })),
    ];
    if (engine === 'postgres') {
      await client.$transaction(async (tx: any) => {
        await tx.$executeRawUnsafe("SET LOCAL TimeZone = 'UTC'");
        for (const s of sessions)
          await tx.session.create({
            data: {
              id: s.id,
              websiteId: s.site,
              distinctId: s.distinct || null,
              country: s.country,
              createdAt: new Date(start),
            },
          });
        for (const r of analyticsRows) {
          await tx.websiteEvent.create({
            data: {
              id: r.id,
              websiteId: r.s.site,
              sessionId: r.s.id,
              visitId: r.s.id,
              createdAt: new Date(r.at),
              urlPath: '/staff',
              eventName: r.name || null,
              eventType: r.type,
            },
          });
          if (r.amount !== undefined)
            await tx.eventData.create({
              data: {
                id: randomUUID(),
                websiteId: r.s.site,
                websiteEventId: r.id,
                dataKey: 'amount',
                dataType: 2,
                numberValue: r.amount,
                createdAt: new Date(r.at),
              },
            });
        }
      });
    } else {
      const insert = (table: string, data: any[]) =>
        ch(
          `INSERT INTO ${namespace}.${table} FORMAT JSONEachRow\n${data.map(r => JSON.stringify(r)).join('\n')}`,
        );
      const at = (ms: number) => new Date(ms).toISOString().replace('T', ' ').replace('.000Z', '');
      await insert(
        'website_event',
        analyticsRows.map(r => ({
          website_id: r.s.site,
          session_id: r.s.id,
          visit_id: r.s.id,
          event_id: r.id,
          event_type: r.type,
          event_name: r.name,
          distinct_id: r.s.distinct,
          country: r.s.country,
          url_path: '/staff',
          created_at: at(r.at),
        })),
      );
      await insert(
        'event_data',
        rows
          .filter(r => r.amount !== undefined)
          .map(r => ({
            website_id: r.s.site,
            session_id: r.s.id,
            event_id: r.id,
            event_name: r.name,
            data_key: 'amount',
            data_type: 2,
            number_value: r.amount,
            created_at: at(r.at),
          })),
      );
    }
    const chatId = randomUUID();
    await client.aiChat.create({
      data: { id: chatId, userId: ids.owner, title: 'Staff activity' },
    });
    const task = await ensureTask(ids.owner, chatId, 'Staff activity');
    const scope = { userId: ids.owner, chatId, taskId: task.id };
    const deps = analystDeps();
    const tool = async (name: any, args: any) =>
      (
        await executeAnalystTool(name, args, {
          auth,
          scope,
          deps,
          interaction: { signal: new AbortController().signal } as any,
        })
      ).json as any;
    const widget = (id: string, props: any) => ({
      id,
      component: { type: 'AnalysisWidget', props: { visualization: 'table', ...props } },
    });
    const board = (name: string, columns: any[]) => ({
      type: 'mixed',
      name,
      parameters: { rows: [{ id: 'row', columns }] },
    });
    const series = definition(ids.product, { operation: 'series', unit: 'day' });
    await check(
      'exact observed labels and daily event occurrences, separate product/ops',
      async () => {
        for (const [site, expected] of [
          [ids.product, [3, 2, 0]],
          [ids.ops, [1, 0, 0]],
        ] as const) {
          const result = await preview({ ...series, source: { websiteId: site } });
          assert.equal(result.appliedFilters.event, 'login');
          assert.equal(result.semanticBinding.label, 'login');
          assert.equal(result.semanticBinding.meaningSource, 'observed_only');
          assert.deepEqual(
            result.rows.map((r: any) => r.y),
            expected,
          );
          assert.equal(result.source.websiteId, site);
          assert.ok(result.warnings.includes('observed_only_meaning'));
          assert.deepEqual(result.columns, [
            { key: 't', label: 'Bucket start', type: 'time' },
            { key: 'y', label: 'login', type: 'number' },
          ]);
        }
      },
    );
    await check('identified users stay source-scoped despite repeated identity', async () => {
      const p = await preview(
        definition(ids.product, { metric: 'identified_users', event: undefined }),
      );
      const o = await preview(
        definition(ids.ops, { metric: 'identified_users', event: undefined }),
      );
      assert.equal(p.rows[0].value, 2);
      assert.equal(o.rows[0].value, 1);
      assert.equal(p.source.websiteId, ids.product);
      assert.equal(o.source.websiteId, ids.ops);
    });
    await check(
      'staff board persists separate source widgets and observed-only meaning',
      async () => {
        const defs = [
          series,
          { ...series, source: { websiteId: ids.ops } },
          definition(ids.product, { metric: 'identified_users', event: undefined }),
          definition(ids.ops, { metric: 'identified_users', event: undefined }),
        ];
        const commit = await tool('analyst_commit_draft', {
          board: board(
            'Staff observed activity',
            defs.map((_, i) => widget(`staff-${i}`, { analysisRef: `a${i}` })),
          ),
          analyses: defs.map((definition, i) => ({
            ref: `a${i}`,
            name: i < 2 ? 'login' : 'identified users',
            definition,
          })),
          operationKey: 'staff-board',
        });
        assert.equal(commit.ok, true, JSON.stringify(commit));
        const readback = await tool('analyst_readback', { boardId: commit.board.id });
        assert.equal(readback.ok, true, JSON.stringify(readback));
        assert.equal(readback.data.analyses.length, 4);
        for (let i = 0; i < defs.length; i++) {
          const stored = await deps.getAnalysis(commit.analyses[i].id);
          assert.deepEqual(
            stored.definition,
            JSON.parse(JSON.stringify(normalizeDefinition(defs[i]))),
          );
          assert.equal(stored.definitionHash, hashDefinition(normalizeDefinition(defs[i])));
        }
      },
    );
    await check('filtered event/person series survives real child process reopen', async () => {
      for (const metric of ['events', 'sessions']) {
        const filtered = {
          ...series,
          metric,
          ...(metric === 'sessions' ? { event: undefined } : {}),
          filters: [
            { dimension: 'country', operator: 'eq', values: ['US'] },
            { dimension: 'distinctId', operator: 'eq', values: ['staff-1'] },
          ],
        };
        // Session buckets describe active sessions, not whole-range unique people or event-filtered people.
        const def = normalizeDefinition(filtered);
        const created = await api(analyses.POST, 'POST', {
          operationKey: `filtered-${metric}`,
          name: `US ${metric}/day`,
          definition: def,
        });
        assert.equal(created.status, 200, JSON.stringify(created.body));
        const analysisId = created.body.analysis.id;
        const committed = await tool('analyst_commit_draft', {
          board: board('Filtered saved', [widget('filtered', { analysisId })]),
          analyses: [],
          operationKey: `filtered-board-${metric}`,
        });
        assert.equal(committed.ok, true, JSON.stringify(committed));
        const before = await api(executions.POST, 'POST', {}, { analysisId });
        assert.deepEqual(
          before.body.rows.map((r: any) => r.y),
          metric === 'events' ? [2, 1, 0] : [1, 1, 0],
        );
        assert.deepEqual(
          before.body.totals,
          metric === 'events' ? { total: 3 } : { bucketSessionSum: 2 },
        );
        const output = execFileSync(
          path.resolve('node_modules/.bin/tsx'),
          ['scripts/ai/analyst-evals/dashboard.ts', engine],
          {
            env: {
              ...process.env,
              ANALYST_DASHBOARD_CHILD: JSON.stringify({
                namespace,
                ids,
                analysisId,
                boardId: committed.board.id,
              }),
            },
            encoding: 'utf8',
          },
        );
        const reopened = JSON.parse(output.split('REOPEN ')[1]);
        assert.notEqual(reopened.pid, process.pid);
        assert.equal(reopened.read.status, 200);
        assert.equal(reopened.execution.status, 200);
        assert.equal(reopened.board.status, 200);
        assert.deepEqual(reopened.read.body.definition, JSON.parse(JSON.stringify(def)));
        assert.deepEqual(reopened.execution.body.rows, before.body.rows);
        assert.deepEqual(reopened.execution.body.appliedFilters, before.body.appliedFilters);
        assert.equal(reopened.execution.body.definitionHash, before.body.definitionHash);
        assert.equal(
          reopened.board.body.parameters.rows[0].columns[0].component.props.analysisId,
          analysisId,
        );
      }
    });
    await check('numeric zero/null aggregates and unsupported numeric grouping', async () => {
      const numeric = definition(ids.product, {
        operation: 'numeric_property',
        metric: 'sum',
        event: 'purchase',
        property: { owner: 'event', name: 'amount' },
      });
      const sum = await preview(numeric);
      assert.deepEqual(sum.rows, [{ metric: 'sum', value: 40, count: 3 }]);
      assert.deepEqual((await preview({ ...numeric, event: 'zero_amount' })).rows, [
        { metric: 'sum', value: 0, count: 1 },
      ]);
      const missing = await preview({ ...numeric, property: { owner: 'event', name: 'absent' } });
      assert.deepEqual(missing.rows, [{ metric: 'sum', value: null, count: 0 }]);
      assert.ok(missing.warnings.includes('no_numeric_values'));
      for (const patch of [
        { operation: 'series', unit: 'day' },
        { groupBy: { dimension: 'country' } },
      ]) {
        const rejected = await api(previews.POST, 'POST', { definition: { ...numeric, ...patch } });
        assert.notEqual(rejected.status, 200);
        assert.equal(rejected.body.error.code, 'unsupported_combination');
      }
    });
    await check('absent collection coverage differs from covered explicit zero', async () => {
      const covered = await tool('analyst_discover', { websiteId: ids.product });
      const empty = await tool('analyst_discover', { websiteId: ids.empty });
      assert.equal(covered.ok, true);
      assert.equal(empty.ok, true);
      assert.deepEqual(empty.data.coverage, { startAt: null, endAt: null });
      assert.deepEqual(covered.data.coverage, {
        startAt: start + 3_600_000,
        endAt: start + 26 * 3_600_000,
      });
      const zero = await preview(definition(ids.product, { event: 'never_observed' }));
      assert.equal(zero.rows[0].value, 0);
      assert.equal(zero.completeness, 'complete');
    });
    await check(
      'matching saved analysis reused; different filter/population never substituted',
      async () => {
        const desired = normalizeDefinition(series);
        const differentFilter = normalizeDefinition({
          ...series,
          filters: [{ dimension: 'country', operator: 'eq', values: ['DE'] }],
        });
        const differentPopulation = normalizeDefinition({
          ...series,
          semanticBinding: { ...series.semanticBinding, population: 'successful staff logins' },
        });
        const create = async (key: string, definition: any) => {
          const r = await api(analyses.POST, 'POST', {
            name: 'login',
            operationKey: key,
            definition,
          });
          assert.equal(r.status, 200);
          return r.body.analysis;
        };
        const bad = await create('different-filter', differentFilter);
        const badPopulation = await create('different-population', differentPopulation);
        const good = await create('exact-match', desired);
        const discover = await tool('analyst_discover', {});
        assert.equal(discover.ok, true);
        const candidates = discover.data.analyses.filter((a: any) =>
          [bad.id, badPopulation.id, good.id].includes(a.id),
        );
        assert.equal(candidates.length, 3);
        const read = await Promise.all(
          candidates.map((a: any) => api(savedRoute.GET, 'GET', undefined, { analysisId: a.id })),
        );
        // Scripted semantic comparison, never represented as model selection or server inference.
        const matches = read.filter(r => {
          try {
            assert.deepEqual(r.body.definition, JSON.parse(JSON.stringify(desired)));
            return true;
          } catch {
            return false;
          }
        });
        assert.equal(matches.length, 1);
        assert.equal(matches[0].body.id, good.id);
        assert.notEqual(bad.definitionHash, good.definitionHash);
        assert.notEqual(badPopulation.definitionHash, good.definitionHash);
        const commit = await tool('analyst_commit_draft', {
          board: board('Reuse exact observed semantics', [
            widget('reused', { analysisId: good.id }),
          ]),
          analyses: [],
          operationKey: 'reuse',
        });
        assert.equal(commit.ok, true, JSON.stringify(commit));
        assert.equal(commit.analyses.length, 0);
        const saved = await api(boardRoute.GET, 'GET', undefined, { boardId: commit.board.id });
        const bound = saved.body.parameters.rows[0].columns[0].component.props.analysisId;
        assert.equal(bound, good.id);
        assert.notEqual(bound, bad.id);
        assert.notEqual(bound, badPopulation.id);
        const replay = await tool('analyst_readback', { boardId: commit.board.id });
        assert.equal(replay.ok, true, JSON.stringify(replay));
        const result = await api(executions.POST, 'POST', {}, { analysisId: bound });
        assert.deepEqual(
          result.body.rows.map((r: any) => r.y),
          [3, 2, 0],
        );
        assert.deepEqual(result.body.appliedFilters.filters, []);
        assert.equal(result.body.semanticBinding.population, 'observed custom events');
      },
    );
    console.log(
      `EVIDENCE ${JSON.stringify({ suite: `${engine}-supplement`, assertions: emitted, passed: true })}`,
    );
  } finally {
    await client?.$disconnect();
    if (chCreated) await ch(`DROP DATABASE ${namespace}`);
    if (pgCreated) psql(`drop schema ${namespace} cascade`);
  }
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
