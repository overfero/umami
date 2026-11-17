/* eslint-disable no-console */
/** Disposable real PostgreSQL authority seams; no browser, model or mocked database. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { crc32, deflateSync } from 'node:zlib';
import { assertNeedsInput, clarification } from './clarification';

const namespace = `analyst_authority_${Date.now()}_${process.pid}`;
const base = 'postgresql://ai_synthetic@127.0.0.1:25432/ai_synthetic';
const psql = (sql: string) => execFileSync(`${process.env.PG_BIN}/psql`, [
  '-XAt', '-h', '127.0.0.1', '-p', '25432', '-U', 'ai_synthetic', '-d', 'ai_synthetic',
  '-v', 'ON_ERROR_STOP=1', '-c', sql,
], { encoding: 'utf8' }).trim();
assert.match(namespace, /^analyst_authority_\d+_\d+$/);
process.env.DATABASE_URL = `${base}?schema=${namespace}`;
for (const key of ['DATABASE_REPLICA_URL', 'REDIS_URL', 'CLOUD_MODE', 'CLICKHOUSE_URL']) delete process.env[key];
process.env.APP_SECRET = `synthetic-${namespace}`;
process.env.AI_ANALYST_ENABLED = 'true';
delete process.env.AI_ANALYST_VERIFIER_ENABLED;

// Independent valid 1x1 PNG, not a screenshot or evidence of visual judgment.
function image() {
  const chunk = (type: string, data: Buffer) => {
    const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
    const content = Buffer.concat([Buffer.from(type), data]);
    const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(content));
    return Buffer.concat([length, content, checksum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0); header.writeUInt32BE(1, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.from([0, 255, 255, 255, 255]))), chunk('IEND', Buffer.alloc(0))]);
}
const assertions: string[] = [];
async function check(name: string, fn: () => Promise<void>) {
  await fn(); assertions.push(name); console.log(`ASSERTION ${name}`);
}
async function main() {
  assert.equal(psql('select owner from public.ai_synthetic_owner'), 'umami-ai-synthetic-r3');
  let created = false;
  let client: any;
  try {
    psql(`create schema ${namespace}`); created = true;
    execFileSync(path.resolve('node_modules/.bin/prisma'), ['migrate', 'deploy'], {
      env: process.env, stdio: ['ignore', 'ignore', 'inherit'],
    });
    client = (await import('@/lib/prisma')).default.client;
    const { ensureTask, pause, resume, getTask } = await import('@/lib/ai/assistant/analyst/task');
    const { executeAnalystTool } = await import('@/lib/ai/assistant/analyst/tools');
    const { executeTool, Interaction } = await import('@/lib/ai/assistant/tools');
    const { analystDeps } = await import('@/lib/ai/assistant/analyst/deps');
    const { createSecureToken } = await import('@/lib/jwt');
    const { secret } = await import('@/lib/crypto');
    const preview = await import('@/app/api/analyses/preview/route');
    const execution = await import('@/app/api/analyses/[analysisId]/execute/route');
    const { createArtifactStore } = await import('@/lib/analyst-verifier/images.mjs');
    const { createCapabilityStore, VERIFIER_AUDIENCE } = await import('@/lib/analyst-verifier/capability.mjs');
    const { verifierAuthority, prepareVerifierWidgets } = await import('@/lib/ai/assistant/analyst/deps');
    const { normalizeDefinition, hashDefinition } = await import('@/lib/analyst/definition');
    const owner = randomUUID(), foreign = randomUUID(), website = randomUUID(), chatId = randomUUID();
    for (const id of [owner, foreign]) await client.user.create({ data: {
      id, username: `authority-${id}`, password: 'not-a-login', role: 'user',
    } });
    await client.website.create({ data: { id: website, userId: owner, name: 'Observed login', domain: 'synthetic.invalid' } });
    await client.aiChat.create({ data: { id: chatId, userId: owner, title: 'Authority' } });
    const task = await ensureTask(owner, chatId, 'What does login mean?');
    const definition = normalizeDefinition({ schemaVersion: 1, source: { websiteId: website },
      operation: 'totals', metric: 'events', event: 'login',
      datePolicy: { type: 'fixed', startAt: 1790812800000, endAt: 1791072000000 }, timezone: 'Asia/Jakarta',
      semanticBinding: { label: 'login', unit: 'occurrences', population: 'observed events', meaningSource: 'observed_only' },
    });
    const analysis = await client.savedAnalysis.create({ data: { id: randomUUID(), userId: owner,
      name: 'login', schemaVersion: 1, revision: 1, status: 'draft', definition,
      definitionHash: hashDefinition(definition), createdByTaskId: task.id,
    } });
    const board = await client.board.create({ data: { id: randomUUID(), userId: owner, name: 'Private', description: '', type: 'mixed',
      parameters: { rows: [{ id: 'row', columns: [{ id: 'login', component: {
        type: 'AnalysisWidget', props: { analysisId: analysis.id, visualization: 'table' },
      } }] }] },
    } });
    const scope = { userId: owner, taskId: task.id, boardId: board.id, boardRevision: 1,
      analysisRevisions: { [analysis.id]: 1 } };
    const taskScope = { userId: owner, chatId, taskId: task.id };
    const auth = { user: { id: owner, role: 'user', isAdmin: false } } as any;
    const credentials = new Headers({ authorization: `Bearer ${createSecureToken({ userId: owner, role: 'user' }, secret())}` });
    const api = async (handler: any, method: string, body?: any, params: any = {}, query = '') => {
      const response = await handler(new Request(`http://localhost/api/synthetic${query}`, {
        method, headers: credentials,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }), { params: Promise.resolve(params) });
      return { status: response.status, body: await response.json() };
    };
    const counts = async () => ({ boards: await client.board.count(), analyses: await client.savedAnalysis.count(),
      revisions: await client.savedAnalysisRevision.count(), operations: await client.analysisOperation.count() });
    await check('discover IDs and schema then ask meaningful ambiguity with needs_input and no guessed mutation', async () => {
      const sessionId = randomUUID(), eventId = randomUUID();
      await client.$transaction(async (tx: any) => {
        await tx.$executeRawUnsafe("SET LOCAL TimeZone = 'UTC'");
        await tx.session.create({ data: { id: sessionId, websiteId: website, createdAt: new Date(1790816400000) } });
        await tx.websiteEvent.create({ data: { id: eventId, websiteId: website, sessionId, visitId: sessionId,
          eventType: 2, eventName: 'login', urlPath: '/synthetic', createdAt: new Date(1790816400000) } });
      });
      const discover: any = (await executeAnalystTool('analyst_discover', {}, { auth, scope: taskScope,
        deps: analystDeps(), interaction: new Interaction(() => {}, new AbortController().signal) })).json;
      assert.deepEqual(discover.data.websites, [{ id: website, name: 'Observed login' }]);
      assert.ok(discover.data.capabilities.metrics);
      // Real authenticated native schema reads. IDs and property facts are never asked of the user.
      const metrics = await import('@/app/api/websites/[websiteId]/metrics/route');
      const properties = await import('@/app/api/websites/[websiteId]/event-data/properties/route');
      const dates = '?startAt=1790812800000&endAt=1791072000000';
      const { withAiRead, getAiQueryScope } = await import('@/lib/ai/query');
      const schemaRead = (work: () => Promise<any>) => withAiRead(async () => {
        await getAiQueryScope()!.tx.$executeRawUnsafe("SET LOCAL TimeZone = 'UTC'");
        return work();
      }, new AbortController().signal);
      const taxonomy = await schemaRead(() => api(metrics.GET, 'GET', undefined, { websiteId: website }, `${dates}&type=event`));
      assert.equal(taxonomy.status, 200);
      assert.deepEqual(taxonomy.body.map((r: any) => r.x), ['login']);
      const schema = await schemaRead(() => api(properties.GET, 'GET', undefined, { websiteId: website }, dates));
      assert.equal(schema.status, 200); assert.deepEqual(schema.body, []);
      const before = await counts();
      const events: any[] = [];
      const controller = new AbortController();
      const interaction = new Interaction(p => events.push(p), controller.signal, 300000,
        { pause: () => pause(taskScope), resume: () => resume(taskScope) });
      const pending = executeTool('ask_user', { ...clarification, options: [...clarification.options], allowText: false },
        { credentials, interaction, analyst: true });
      for (let i = 0; !events.length && i < 100; i++) await new Promise(r => setTimeout(r, 10));
      try {
        const stored = await getTask(taskScope);
        assert.equal(assertNeedsInput({ part: events[0], taskStatus: stored!.status, before, after: await counts() }), 'needs_input');
        assert.equal(interaction.reply({ kind: 'question', partId: events[0].id, answer: 'Successful login guessed' }), false);
        assert.deepEqual(await counts(), before);
        assert.equal(interaction.reply({ kind: 'question', partId: events[0].id, answer: clarification.options[2] }), true);
        assert.equal(await pending, 'Unknown: keep the observed login label');
        assert.equal((await getTask(taskScope))!.status, 'running');
        assert.deepEqual((await client.savedAnalysis.findUnique({ where: { id: analysis.id } })).definition, definition);
        assert.deepEqual(await counts(), before);
      } finally { controller.abort(); await pending; }
    });
    await check('declined and stale existing-board approval leave metadata unchanged; accepted exact edit applies', async () => {
      const bundle = { boardId: board.id, expectedRevision: 1,
        board: { type: 'mixed', name: 'Confirmed edit', parameters: board.parameters }, analyses: [] };
      const before = await counts();
      const original = await client.board.findUnique({ where: { id: board.id } });
      for (const mode of ['declined', 'stale', 'accepted']) {
        const parts: any[] = [];
        const controller = new AbortController();
        const interaction = new Interaction(p => parts.push(p), controller.signal);
        const pending = executeAnalystTool('analyst_request_change', bundle, { auth, scope: taskScope, deps: analystDeps(), interaction });
        for (let i = 0; !parts.length && i < 100; i++) await new Promise(r => setTimeout(r, 10));
        try {
          assert.equal(parts[0]?.type, 'confirm');
          assert.deepEqual(JSON.parse(parts[0].message).target, board.id);
          assert.equal(JSON.parse(parts[0].message).expectedRevision, 1);
          if (mode === 'stale') await client.board.update({ where: { id: board.id }, data: { revision: 2 } });
          const priorReply = await client.board.findUnique({ where: { id: board.id } });
          assert.equal(interaction.reply({ kind: 'confirm', partId: parts[0].id, confirmed: mode !== 'declined' }), true);
          const result: any = (await pending).json;
          assert.equal(result.ok, mode === 'accepted', JSON.stringify(result));
          if (mode !== 'accepted') {
            assert.equal(result.code, mode === 'declined' ? 'denied' : 'conflict');
            assert.deepEqual(await client.board.findUnique({ where: { id: board.id } }), priorReply);
            assert.deepEqual(await counts(), before);
            assert.equal(await client.analysisConfirmation.count(), 0);
          } else {
            const edited = await client.board.findUnique({ where: { id: board.id } });
            assert.equal(edited.name, 'Confirmed edit'); assert.equal(edited.revision, 2);
            assert.equal(await client.analysisConfirmation.count(), 1);
          }
        } finally { controller.abort(); await pending; }
        await client.board.update({ where: { id: board.id }, data: { name: original.name, revision: 1 } });
      }
    });
    await check('partial failure after metadata writes rolls back board analyses revisions operation and task provenance', async () => {
      const { validateBundle } = await import('@/lib/analyst/bundle');
      const { commitBundle } = await import('@/queries/prisma/analysis');
      const request = await validateBundle(auth, { taskId: task.id, board: { type: 'mixed', name: 'Must roll back',
        parameters: { rows: [{ id: 'r', columns: [{ id: 'w', component: { type: 'AnalysisWidget', props: { analysisRef: 'new', visualization: 'table' } } }] }] } },
        analyses: [{ ref: 'new', name: 'Never durable', status: 'draft', definition }] });
      const before = await counts();
      const taskBefore = await client.analystTask.findUnique({ where: { id: task.id } });
      await assert.rejects(commitBundle({ ...request, userId: owner, operationKey: 'injected-final-failure' }, {
        chatId, record: async (tx: any, result: any) => {
          // Assert the failure is AFTER all writes, not prevalidation pretending to prove rollback.
          assert.equal(await tx.savedAnalysis.count(), before.analyses + 1);
          assert.equal(await tx.savedAnalysisRevision.count(), before.revisions + 1);
          assert.equal(await tx.board.count(), before.boards + 1);
          assert.ok(result.board.id);
          await tx.analystTask.update({ where: { id: task.id }, data: { operationKeys: ['must-rollback'] } });
          throw new Error('synthetic final metadata failure');
        },
      }), /synthetic final metadata failure/);
      assert.deepEqual(await counts(), before);
      assert.deepEqual(await client.analystTask.findUnique({ where: { id: task.id } }), taskBefore);
      assert.equal(await client.analysisOperation.count({ where: { key: 'injected-final-failure' } }), 0);
    });
    const store = createArtifactStore({ authorize: verifierAuthority });
    await check('source revocation denies render authority and existing artifact release', async () => {
      assert.equal(await verifierAuthority(scope), true);
      const artifact = await store.put(scope, [{ mime: 'image/png', bytes: image() }]);
      assert.equal((await store.get(artifact.id, { userId: owner, taskId: task.id })).length, 1);
      const capabilities = createCapabilityStore({ authorize: verifierAuthority });
      const { token } = capabilities.issue(scope);
      await client.website.update({ where: { id: website }, data: { userId: foreign } });
      assert.equal((await api(preview.POST, 'POST', { definition })).status, 403);
      assert.equal((await api(execution.POST, 'POST', {}, { analysisId: analysis.id })).status, 403);
      const { validateBundle } = await import('@/lib/analyst/bundle');
      await assert.rejects(validateBundle(auth, { taskId: task.id, board: { type: 'mixed', name: 'Denied source', parameters: board.parameters }, analyses: [] }));
      // Evaluate all boundaries before asserting: retain booleans only, never pixels/tokens.
      const captureDenied = await prepareVerifierWidgets(scope, [{ id: 'login', definitionHash: analysis.definitionHash }]).then(() => false, () => true);
      const releaseDenied = await store.get(artifact.id, { userId: owner, taskId: task.id }).then(() => false, () => true);
      const capabilityDenied = await capabilities.exchange(token, VERIFIER_AUDIENCE).then(() => false, () => true);
      assert.deepEqual({ captureDenied, releaseDenied, capabilityDenied, authorityDenied: !(await verifierAuthority(scope)) },
        { captureDenied: true, releaseDenied: true, capabilityDenied: true, authorityDenied: true });
      assert.equal(store.size(), 0);
      await client.website.update({ where: { id: website }, data: { userId: owner } });
    });
    await check('foreign stale malformed and team-revoked references deny capability and artifact release', async () => {
      const expectDenied = async (change: () => Promise<void>, restore: () => Promise<void>) => {
        assert.equal(await verifierAuthority(scope), true);
        const artifact = await store.put(scope, [{ mime: 'image/png', bytes: image() }]);
        const capabilities = createCapabilityStore({ authorize: verifierAuthority });
        const { token } = capabilities.issue(scope);
        await change();
        try {
          assert.equal(await verifierAuthority(scope), false);
          await assert.rejects(capabilities.exchange(token, VERIFIER_AUDIENCE), /revoked/);
          await assert.rejects(store.get(artifact.id, { userId: owner, taskId: task.id }), /revoked/);
          await assert.rejects(prepareVerifierWidgets(scope, [{ id: 'login', definitionHash: analysis.definitionHash }]));
        } finally { await restore(); }
      };
      const artifact = await store.put(scope, [{ mime: 'image/png', bytes: image() }]);
      await assert.rejects(store.get(artifact.id, { userId: foreign, taskId: task.id }), /out_of_scope/);
      await assert.rejects(store.get(artifact.id, { userId: owner, taskId: randomUUID() }), /out_of_scope/);
      store.discard(artifact.id);
      assert.equal(await verifierAuthority({ ...scope, userId: foreign }), false);
      for (const [model, id, patch, restore] of [
        ['board', board.id, { revision: 2 }, { revision: 1 }],
        ['savedAnalysis', analysis.id, { revision: 2 }, { revision: 1 }],
        ['savedAnalysis', analysis.id, { userId: foreign }, { userId: owner }],
        ['savedAnalysis', analysis.id, { definition: { schemaVersion: 999 } }, { definition }],
        ['board', board.id, { userId: foreign }, { userId: owner }],
      ] as const) await expectDenied(() => client[model].update({ where: { id }, data: patch }),
        () => client[model].update({ where: { id }, data: restore }));
      const teamId = randomUUID(), membershipId = randomUUID();
      await client.team.create({ data: { id: teamId, name: 'Synthetic authority team' } });
      const member = { id: membershipId, userId: owner, teamId, role: 'team-owner' };
      await client.teamUser.create({ data: member });
      await client.website.update({ where: { id: website }, data: { userId: null, teamId } });
      await expectDenied(() => client.teamUser.delete({ where: { id: membershipId } }),
        () => client.teamUser.create({ data: member }));
      await client.website.update({ where: { id: website }, data: { userId: owner, teamId: null } });
      const token = createSecureToken({ userId: foreign, role: 'user' }, secret());
      const foreignPreview = await preview.POST(new Request('http://localhost/api/analyses/preview', {
        method: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify({ definition }),
      }));
      assert.equal(foreignPreview.status, 403);
      const override = await api(execution.POST, 'POST', { source: { websiteId: website } }, { analysisId: analysis.id });
      assert.equal(override.status, 400);
    });
    store.cleanup({ userId: owner, taskId: task.id });
    console.log(`EVIDENCE ${JSON.stringify({ suite: 'authority-pg', assertions, passed: true })}`);
  } finally {
    await client?.$disconnect();
    if (created) psql(`drop schema ${namespace} cascade`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
