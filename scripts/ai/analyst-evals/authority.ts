/* eslint-disable no-console */
/** Disposable real PostgreSQL authority seams; no browser, model or mocked database. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { crc32, deflateSync } from 'node:zlib';

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
    const { ensureTask } = await import('@/lib/ai/assistant/analyst/task');
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
    const store = createArtifactStore({ authorize: verifierAuthority });
    await check('source revocation denies render authority and existing artifact release', async () => {
      assert.equal(await verifierAuthority(scope), true);
      const artifact = await store.put(scope, [{ mime: 'image/png', bytes: image() }]);
      assert.equal((await store.get(artifact.id, { userId: owner, taskId: task.id })).length, 1);
      const capabilities = createCapabilityStore({ authorize: verifierAuthority });
      const { token } = capabilities.issue(scope);
      await client.website.update({ where: { id: website }, data: { userId: foreign } });
      // Evaluate all boundaries before asserting: retain booleans only, never pixels/tokens.
      const captureDenied = await prepareVerifierWidgets(scope, [{ id: 'login', definitionHash: analysis.definitionHash }]).then(() => false, () => true);
      const releaseDenied = await store.get(artifact.id, { userId: owner, taskId: task.id }).then(() => false, () => true);
      const capabilityDenied = await capabilities.exchange(token, VERIFIER_AUDIENCE).then(() => false, () => true);
      assert.deepEqual({ captureDenied, releaseDenied, capabilityDenied, authorityDenied: !(await verifierAuthority(scope)) },
        { captureDenied: true, releaseDenied: true, capabilityDenied: true, authorityDenied: true });
      assert.equal(store.size(), 0);
      await client.website.update({ where: { id: website }, data: { userId: owner } });
    });
    store.cleanup({ userId: owner, taskId: task.id });
    console.log(`EVIDENCE ${JSON.stringify({ suite: 'authority-pg', assertions, passed: true })}`);
  } finally {
    await client?.$disconnect();
    if (created) psql(`drop schema ${namespace} cascade`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
