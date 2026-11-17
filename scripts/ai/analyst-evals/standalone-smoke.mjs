// Runs INSIDE a disposable container containing only the assembled Next standalone package.
import assert from 'node:assert/strict';
import { lstatSync, readdirSync, realpathSync } from 'node:fs';
import { join } from 'node:path';

for (const name of ['AI_OFFLINE_FIXTURE', 'AI_PI_ROOT', 'AI_PROVIDER_KEY'])
  assert.equal(process.env[name], undefined, name);
function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (lstatSync(file).isSymbolicLink())
      assert.ok(realpathSync(file).startsWith('/app/'), `external package symlink: ${file}`);
    else if (entry.isDirectory()) inspect(file);
  }
}
inspect('/app');
const origin = 'http://127.0.0.1:3367';
for (let attempt = 0; ; attempt++) {
  try {
    await fetch(origin);
    break;
  } catch (error) {
    if (attempt === 40) throw error;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
}
const login = await fetch(`${origin}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'umami' }),
});
assert.equal(login.status, 200);
const { token } = await login.json();
const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
const request = async (path, body) => {
  const response = await fetch(`${origin}/api${path}`, {
    headers,
    ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}),
  });
  assert.equal(response.status, 200, `${path}: ${await response.clone().text()}`);
  return response.json();
};
const { analysis } = await request('/analyses', {
  operationKey: `isolated-package-${Date.now()}`,
  name: 'Isolated packaged views',
  status: 'ready',
  definition: {
    schemaVersion: 1,
    source: { websiteId: 'a11a1a00-0000-4000-8000-000000000001' },
    operation: 'totals',
    metric: 'pageviews',
    timezone: 'UTC',
    datePolicy: { type: 'fixed', startAt: Date.UTC(2026, 9, 1), endAt: Date.UTC(2026, 9, 15) },
    semanticBinding: {
      label: 'Isolated views',
      unit: 'pageviews',
      population: 'all synthetic visitors',
      meaningSource: 'observed_only',
    },
  },
});
const execution = await request(`/analyses/${analysis.id}/execute`, {});
assert.equal(execution.rows[0].value, 42);
const page = await fetch(`${origin}/dashboard`, { headers });
assert.equal(page.status, 200);
assert.match(await page.text(), /<html/);
const chat = await request('/ai/assistant/chats', { title: 'Isolated default-off capability' });
const turn = await fetch(`${origin}/api/ai/assistant/chats/${chat.id}/turn`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ message: 'No provider calls' }),
});
assert.equal(turn.status, 200);
const text = await turn.text();
assert.ok(!text.includes('"type":"image"') && !text.includes('umamiImageEnvelope'));
assert.ok(!text.includes('rendered_not_inspected') && !text.includes('"status":"complete"'));
console.log(
  JSON.stringify({
    packageOnly: true,
    externalSymlinks: false,
    authenticatedLogin: true,
    pageRendered: true,
    analysisValue: execution.rows[0].value,
    defaultOffNoImages: true,
    limitations:
      'Disposable synthetic database; no model, provider vision or target release acceptance.',
  }),
);
