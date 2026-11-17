// Owns only a new nonce-qualified namespace. Never reseeds or drops legacy analyst_fixture.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fixtureSchema, uniqueFixtureDatabase, FIXTURE_SCHEMA_OWNER } from '../../../src/lib/ai/fixture-database.mjs';
const engine = ['-XAt', '-h', '127.0.0.1', '-p', '25432', '-U', 'ai_synthetic', '-d', 'ai_synthetic', '-v', 'ON_ERROR_STOP=1'];
function query(sql, variables = {}) {
  return execFileSync(join(process.env.PG_BIN ?? '', 'psql'), [...engine,
    ...Object.entries(variables).flatMap(([key, value]) => ['-v', `${key}=${value}`])],
    { input: sql, encoding: 'utf8', timeout: 30_000 }).trim();
}
function ownedNamespace(databaseUrl) {
  const schema = fixtureSchema(databaseUrl);
  if (!schema || schema === 'analyst_fixture') throw new Error('Unique fixture namespace required');
  return schema;
}
function verifyEngine() {
  if (query('select owner from public.ai_synthetic_owner;') !== 'umami-ai-synthetic-r3') throw new Error('Fixture engine refused');
}
export function provisionFixtureDatabase(root, nonce) {
  const databaseUrl = uniqueFixtureDatabase(nonce);
  const schema = ownedNamespace(databaseUrl);
  verifyEngine();
  if (query("select count(*) from pg_namespace where nspname = :'schema';", { schema }) !== '0') throw new Error('Fixture namespace collision');
  query(`create schema ${schema}; comment on schema ${schema} is :'owner';`, { owner: FIXTURE_SCHEMA_OWNER });
  try {
    execFileSync(resolve('node_modules/.bin/prisma'), ['migrate', 'deploy'], {
      cwd: root, env: { PATH: process.env.PATH, HOME: '/tmp', DATABASE_URL: databaseUrl },
      stdio: ['ignore', 'ignore', 'pipe'], timeout: 120_000,
    });
    const seed = readFileSync(join(root, 'scripts/ai/analyst-fixture/seed.sql'), 'utf8');
    if (!seed.startsWith('-- Idempotent synthetic seed') || !seed.includes('set search_path to analyst_fixture;')) throw new Error('Fixture seed anchor missing');
    query(seed.replace('set search_path to analyst_fixture;', `set search_path to ${schema};`));
    return databaseUrl;
  } catch (error) {
    // This provisioning attempt created the namespace above; still verify its marker.
    cleanupFixtureDatabase(databaseUrl, { databaseUrl, schema, nonceSha256: '0'.repeat(64) });
    throw error;
  }
}
export function cleanupFixtureDatabase(databaseUrl, receipt) {
  const schema = ownedNamespace(databaseUrl);
  if (receipt?.databaseUrl !== databaseUrl || receipt?.schema !== schema ||
      typeof receipt?.nonceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(receipt.nonceSha256))
    throw new Error('Fixture cleanup receipt required');
  verifyEngine();
  if (query("select obj_description(oid) from pg_namespace where nspname = :'schema';", { schema }) !== FIXTURE_SCHEMA_OWNER) throw new Error('Nonowned fixture cleanup refused');
  query(`drop schema ${schema} cascade;`);
}
