import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import {
  sanitizedProject,
  writeReceipt,
  fixtureEnv,
  cleanupFixtureProject,
} from '../analyst-fixture/app.mjs';
import { cleanupFixtureDatabase, provisionFixtureDatabase } from '../analyst-fixture/database.mjs';
import { sha256 } from './analyst-contract';
import { testInput } from './analyst-test-input';

test('CLI against disposable real Next handlers + unique owned PostgreSQL proves HTTP ingestion AND stored events, not deployment/image/vision', {
  timeout: 240000,
}, async () => {
  const nonce = randomBytes(32).toString('hex');
  const root = sanitizedProject(resolve('.'), nonce);
  let databaseUrl: string | undefined;
  let child: ReturnType<typeof spawn> | undefined;
  let passed = false;
  try {
    const generate = spawnSync(join(root, 'node_modules/.bin/prisma'), ['generate'], {
      cwd: root,
      env: {
        PATH: process.env.PATH,
        HOME: '/tmp',
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://ai_synthetic@127.0.0.1:25432/ai_synthetic',
      },
      timeout: 60000,
      stdio: 'pipe',
    });
    assert.equal(generate.status, 0, 'disposable Prisma generation');
    databaseUrl = provisionFixtureDatabase(root, nonce.slice(0, 24));
    writeReceipt(root, nonce, undefined, databaseUrl);
    const lease = createServer();
    await new Promise<void>(resolve => lease.listen(0, '127.0.0.1', resolve));
    const port = String((lease.address() as { port: number }).port);
    await new Promise<void>(resolve => lease.close(() => resolve()));
    child = spawn(
      join(root, 'node_modules/.bin/next'),
      ['dev', '--webpack', '--hostname', '127.0.0.1', '--port', port],
      {
        cwd: root,
        env: {
          ...fixtureEnv({
            dir: root,
            port,
            nonce,
            piRoot: undefined,
            verifier: false,
            flagsOff: true,
            databaseUrl,
          }),
          NODE_ENV: 'development',
        },
        stdio: 'ignore',
      },
    );
    const baseUrl = `http://127.0.0.1:${port}/`;
    const deadline = Date.now() + 90000;
    let ready = false;
    while (Date.now() < deadline && child.exitCode === null) {
      try {
        const r = await fetch(`${baseUrl}api/heartbeat`, { signal: AbortSignal.timeout(2000) });
        if (r.status === 200) {
          ready = true;
          break;
        }
      } catch {
        /* Owned dev server can refuse connections while compiling; readiness stays false. */
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    assert.equal(ready, true, 'owned disposable app readiness');
    const login = await fetch(`${baseUrl}api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'umami' }),
      signal: AbortSignal.timeout(30000),
    });
    assert.equal(login.status, 200, 'disposable seeded credentials only');
    const auth = await login.json();
    // Compile real routes before the bounded smoke. These requests are confined to this owned app.
    for (const [path, method] of [
      ['api/auth/verify', 'POST'],
      ['api/websites', 'GET'],
      ['api/send', 'POST'],
      ['api/websites/00000000-0000-4000-8000-000000000000', 'GET'],
      ['api/websites/00000000-0000-4000-8000-000000000000/events', 'GET'],
    ]) {
      await fetch(baseUrl + path, { method, signal: AbortSignal.timeout(30000) });
    }
    const input = testInput(baseUrl);
    try {
      input.approval.principalId = auth.user.id;
      input.readiness.principalId = auth.user.id;
      input.approval.authSha256 = sha256(auth.token);
      input.env.RELEASE_ANALYST_TOKEN = auth.token;
      input.approval.limits.durationMs = 120000;
      input.save();
      const smoke = spawn(
        process.execPath,
        [
          '--import',
          'tsx',
          'scripts/ai/release-analyst-smoke.ts',
          '--synthetic-only',
          '--require-ingest',
        ],
        {
          env: { PATH: process.env.PATH, NODE_ENV: 'test', ...input.env },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
      let stdout = '';
      smoke.stdout!.on('data', part => {
        stdout += part;
      });
      // Never echo raw child diagnostics or auth response on assertion failure.
      smoke.stderr!.resume();
      const code = await new Promise(resolve => smoke.once('close', resolve));
      const report = JSON.parse(stdout);
      assert.equal(code, 0, `smoke category=${report.category} cleanup=${report.cleanup?.status}`);
      assert.equal(report.runtimeObserved.storedEvents, 2);
      assert.deepEqual(report.runtimeObserved.ingestStatuses, [200, 200]);
      assert.deepEqual(report.runtimeObserved.authDenials, [401, 401]);
      assert.equal(report.cleanup.status, 'deleted-owned');
      assert.equal(report.vision, 'pending-not-requested');
      assert.equal(stdout.includes(auth.token), false);
      passed = true;
    } finally {
      input.cleanup();
    }
  } finally {
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await new Promise<void>(resolve => {
        const timer = setTimeout(() => {
          child!.kill('SIGKILL');
          resolve();
        }, 5000);
        child!.once('exit', () => {
          clearTimeout(timer);
          resolve();
        });
      });
    }
    if (databaseUrl && passed) {
      const receipt = JSON.parse(readFileSync(join(root, '.analyst-fixture-receipt.json'), 'utf8'));
      cleanupFixtureDatabase(databaseUrl, receipt);
      cleanupFixtureProject(root, nonce, databaseUrl);
    } else {
      console.log(
        JSON.stringify({
          retainedOwnedFixture: root,
          schema: databaseUrl ? `analyst_fixture_${nonce.slice(0, 24)}` : null,
          reason: 'failure-evidence-retained-no-shared-cleanup',
        }),
      );
    }
  }
});
