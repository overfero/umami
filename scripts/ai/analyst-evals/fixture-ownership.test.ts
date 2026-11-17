// @vitest-environment node
import { expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { provisionFixtureDatabase, cleanupFixtureDatabase } from '../analyst-fixture/database.mjs';
import { uniqueFixtureDatabase } from '../../../src/lib/ai/fixture-database.mjs';

it('unique fixture collision and nonowned cleanup refuse without changing the namespace or legacy fixture', () => {
  const nonce = randomBytes(12).toString('hex');
  const schema = `analyst_fixture_${nonce}`;
  const databaseUrl = uniqueFixtureDatabase(nonce);
  expect(schema).toMatch(/^analyst_fixture_[a-f0-9]{24}$/);
  const query = (sql: string) =>
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
        '-v',
        `schema=${schema}`,
      ],
      { input: sql, encoding: 'utf8', timeout: 10_000 },
    ).trim();
  expect(query('select owner from public.ai_synthetic_owner')).toBe('umami-ai-synthetic-r3');
  const legacy = query(
    "select oid::text || ':' || coalesce(obj_description(oid),'') from pg_namespace where nspname='analyst_fixture'",
  );
  const receipt = { databaseUrl, schema, nonceSha256: 'a'.repeat(64) };
  query(
    `create schema :"schema"; create table :"schema".canary(value integer); insert into :"schema".canary values(42); comment on schema :"schema" is 'not-the-fixture-owner'`,
  );
  try {
    expect(() => provisionFixtureDatabase(process.cwd(), nonce)).toThrow(
      'Fixture namespace collision',
    );
    expect(() => cleanupFixtureDatabase(databaseUrl, receipt)).toThrow(
      'Nonowned fixture cleanup refused',
    );
    expect(() =>
      cleanupFixtureDatabase(databaseUrl, { ...receipt, schema: 'analyst_fixture' }),
    ).toThrow('Fixture cleanup receipt required');
    expect(() =>
      cleanupFixtureDatabase(
        'postgresql://ai_synthetic@127.0.0.1:25432/ai_synthetic?schema=analyst_fixture',
        receipt,
      ),
    ).toThrow('Unique fixture namespace required');
    expect(query('select value from :"schema".canary')).toBe('42');
    expect(query("select obj_description(:'schema'::regnamespace)")).toBe('not-the-fixture-owner');
    expect(
      query(
        "select oid::text || ':' || coalesce(obj_description(oid),'') from pg_namespace where nspname='analyst_fixture'",
      ),
    ).toBe(legacy);
  } finally {
    // This test created the canary namespace above; never delegate foreign-marker cleanup.
    query('drop schema :"schema" cascade');
  }
});
