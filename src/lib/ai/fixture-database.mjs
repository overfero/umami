export const LEGACY_FIXTURE_DATABASE =
  'postgresql://ai_synthetic@127.0.0.1:25432/ai_synthetic?schema=analyst_fixture';
export const FIXTURE_SCHEMA_OWNER = 'umami-analyst-fixture-r1';
/** Canonical loopback-only synthetic DB URL. No passwords, extra params, aliases or escaping. */
export function fixtureSchema(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    const schema = url.searchParams.get('schema');
    if (!schema || !/^(?:analyst_fixture|analyst_fixture_[a-f0-9]{24})$/.test(schema)) return null;
    const canonical = `postgresql://ai_synthetic@127.0.0.1:25432/ai_synthetic?schema=${schema}`;
    return databaseUrl === canonical ? schema : null;
  } catch {
    return null;
  }
}
export function uniqueFixtureDatabase(nonce) {
  if (!/^[a-f0-9]{24}$/.test(nonce)) throw new Error('Invalid fixture namespace');
  return `postgresql://ai_synthetic@127.0.0.1:25432/ai_synthetic?schema=analyst_fixture_${nonce}`;
}
