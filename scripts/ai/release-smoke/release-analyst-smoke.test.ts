import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { chmodSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { testInput } from './analyst-test-input';
import { sha256 } from './analyst-contract';

const cli = async (
  env: Record<string, string> = {},
  args = ['--synthetic-only', '--require-ingest'],
) => {
  const child = spawn(
    process.execPath,
    ['--import', 'tsx', 'scripts/ai/release-analyst-smoke.ts', ...args],
    {
      env: { PATH: process.env.PATH, NODE_ENV: 'test', ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let output = '';
  child.stdout!.on('data', data => {
    output += data;
  });
  child.stderr!.on('data', data => {
    output += data;
  });
  const code = await new Promise(resolve => child.on('close', resolve));
  return { code, output };
};

test('public CLI refuses absent recorded approval without contacting an environment-suggested target or exposing credentials', async () => {
  let requests = 0;
  const server = createServer((_req, res) => {
    requests++;
    res.end('{}');
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address() as { port: number };
    const result = await cli({
      UMAMI_BASE_URL: `http://127.0.0.1:${address.port}`,
      RELEASE_ANALYST_TOKEN: 'SECRET_CANARY',
    });
    assert.equal(result.code, 1);
    assert.match(result.output, /"status":"failed"/);
    assert.doesNotMatch(result.output, /SECRET_CANARY/);
    assert.equal(requests, 0);
  } finally {
    server.close();
  }
});

test('runtime failures retain uncertain resources and never follow redirect or schema URLs (protocol-only)', async t => {
  for (const mode of [
    'redirect',
    'missing-heartbeat',
    'auth-allowed',
    'storage-empty',
    'foreign-owner',
    'cleanup-foreign',
    'cleanup-error',
    'create-response-lost',
    'ingest-secret-error',
    'schema-url',
  ])
    await t.test(mode, async () => {
      let requests = 0;
      let outside = 0;
      let website: any;
      let reads = 0;
      let deletes = 0;
      const events: any[] = [];
      const trap = createServer((_req, res) => {
        outside++;
        res.end('{}');
      });
      await new Promise<void>(resolve => trap.listen(0, '127.0.0.1', resolve));
      const trapUrl = `http://127.0.0.1:${(trap.address() as { port: number }).port}/`;
      const server = createServer(async (req, res) => {
        requests++;
        let body = '';
        for await (const part of req) body += part;
        const path = new URL(req.url!, 'http://fixture.invalid').pathname;
        res.setHeader('content-type', 'application/json');
        const send = (value: unknown) => res.end(JSON.stringify(value));
        if (path === '/api/heartbeat') {
          if (mode === 'redirect') {
            res.statusCode = 307;
            res.setHeader('location', trapUrl);
            return res.end();
          }
          return send(mode === 'missing-heartbeat' ? {} : { ok: true, $schema: trapUrl });
        }
        if (!req.headers.authorization && path !== '/api/send') {
          res.statusCode = mode === 'auth-allowed' ? 200 : 401;
          return send({});
        }
        if (path === '/api/auth/verify') return send({ id: input.principalId });
        if (path === '/api/websites') {
          website = {
            ...JSON.parse(body),
            userId: input.principalId,
            createdBy: input.principalId,
          };
          if (mode === 'foreign-owner') website.userId = 'foreign';
          if (mode === 'create-response-lost') return send({ secret: input.token });
          return send(website);
        }
        if (path === '/api/send') {
          if (mode === 'ingest-secret-error') {
            res.statusCode = 500;
            return send({ error: input.token, apiKey: 'SECRET_CANARY' });
          }
          const { payload } = JSON.parse(body);
          events.push({
            id: `e${events.length}`,
            websiteId: payload.website,
            urlPath: payload.url,
            eventType: payload.name ? 2 : 1,
            eventName: payload.name ?? null,
          });
          return send({});
        }
        if (path.endsWith('/events'))
          return send({
            data: mode === 'storage-empty' ? [] : events,
            count: mode === 'storage-empty' ? 0 : 2,
          });
        if (req.method === 'DELETE') {
          deletes++;
          if (mode === 'cleanup-error') res.statusCode = 500;
          return send({});
        }
        reads++;
        if (mode === 'cleanup-foreign' && reads > 1)
          return send({ ...website, domain: 'existing.example' });
        return send(website);
      });
      await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
      const input = testInput(`http://127.0.0.1:${(server.address() as { port: number }).port}/`);
      try {
        const result = await cli(input.env);
        const report = JSON.parse(result.output);
        assert.equal(result.code, mode === 'schema-url' ? 0 : 1, result.output);
        assert.equal(outside, 0);
        assert.ok(requests <= 20);
        assert.doesNotMatch(result.output, /SYNTHETIC_AUTH_CANARY|SECRET_CANARY/);
        if (['foreign-owner', 'cleanup-foreign', 'create-response-lost'].includes(mode)) {
          assert.equal(deletes, 0);
          assert.equal(report.cleanup.status, 'retained');
          assert.equal(report.cleanup.retained.length, 1);
        }
        if (mode === 'storage-empty') {
          assert.deepEqual(report.runtimeObserved.ingestStatuses, [200, 200]);
          assert.equal(report.runtimeObserved.storedEvents, 0);
          assert.equal(report.cleanup.status, 'deleted-owned');
        }
        if (mode === 'cleanup-error') assert.equal(report.cleanup.status, 'retained');
        if (mode === 'redirect') assert.equal(requests, 1);
      } finally {
        input.cleanup();
        server.close();
        trap.close();
      }
    });
});

test('public CLI observes readiness and denials, persists both markers and deletes only its created website (protocol-only disposable server)', async () => {
  let website: any;
  const events: any[] = [];
  const deletes: string[] = [];
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const part of req) body += part;
    const url = new URL(req.url!, 'http://fixture.invalid');
    url.pathname = url.pathname.replace(/^\/approved\//, '/');
    res.setHeader('content-type', 'application/json');
    const send = (value: unknown) => res.end(JSON.stringify(value));
    if (url.pathname === '/api/heartbeat') return send({ ok: true });
    if (!req.headers.authorization && url.pathname !== '/api/send') {
      res.statusCode = 401;
      return send({});
    }
    if (url.pathname === '/api/auth/verify') return send({ id: input.principalId });
    if (url.pathname === '/api/websites' && req.method === 'POST') {
      website = { ...JSON.parse(body), userId: input.principalId, createdBy: input.principalId };
      return send(website);
    }
    if (url.pathname === '/api/send') {
      const { payload } = JSON.parse(body);
      events.push({
        id: `event-${events.length}`,
        websiteId: payload.website,
        urlPath: payload.url,
        eventType: payload.name ? 2 : 1,
        eventName: payload.name ?? null,
      });
      return send({});
    }
    if (url.pathname.endsWith('/events'))
      return send({ data: events, count: events.length, page: 1, pageSize: 10 });
    if (req.method === 'DELETE') {
      deletes.push(url.pathname);
      website = undefined;
      return send({ ok: true });
    }
    if (website && url.pathname === `/api/websites/${website.id}`) return send(website);
    res.statusCode = 404;
    send({});
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const input = testInput(`http://127.0.0.1:${(server.address() as { port: number }).port}/`);
  try {
    const result = await cli(input.env);
    assert.equal(result.code, 0, result.output);
    const report = JSON.parse(result.output);
    assert.equal(report.status, 'passed');
    assert.equal(report.runtimeObserved.storedEvents, 2);
    assert.equal(report.cleanup.status, 'deleted-owned');
    assert.equal(report.vision, 'pending-not-requested');
    assert.equal(deletes.length, 1);
    assert.equal(website, undefined);
    assert.doesNotMatch(result.output, /SYNTHETIC_AUTH_CANARY/);
    events.length = 0;
    const tokenFile = join(input.root, 'auth');
    writeFileSync(tokenFile, input.token, { mode: 0o600 });
    input.approval.target.baseUrl += 'approved/';
    input.readiness.target.baseUrl = input.approval.target.baseUrl;
    input.verifier.target.baseUrl = input.approval.target.baseUrl;
    input.save();
    const { RELEASE_ANALYST_TOKEN: _token, ...fileEnv } = input.env;
    const withFile = await cli({ ...fileEnv, RELEASE_ANALYST_TOKEN_FILE: tokenFile });
    assert.equal(withFile.code, 0, withFile.output);
    assert.equal(deletes.length, 2);
    assert.doesNotMatch(withFile.output, /SYNTHETIC_AUTH_CANARY/);
  } finally {
    input.cleanup();
    server.close();
  }
});

test('approval and evidence negative controls emit no request, even when rebound by the test operator', async t => {
  let requests = 0;
  const server = createServer((_req, res) => {
    requests++;
    res.end('{}');
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/`;
  const cases: [string, (input: ReturnType<typeof testInput>) => void, string[]?][] = [
    [
      'missing-verifier-evidence',
      i => {
        i.env.RELEASE_ANALYST_VERIFIER_EVIDENCE_FILE = join(i.root, 'absent');
      },
    ],
    [
      'missing-readiness',
      i => {
        i.env.RELEASE_ANALYST_READINESS_FILE = join(i.root, 'absent');
      },
    ],
    ['duplicate-switch', () => {}, ['--synthetic-only', '--require-ingest', '--synthetic-only']],
    [
      'expired',
      i => {
        i.approval.expiresAt = Date.now() - 1;
        i.save();
      },
    ],
    [
      'future',
      i => {
        i.approval.issuedAt = Date.now() + 60000;
        i.save();
      },
    ],
    [
      'non-synthetic',
      i => {
        i.approval.syntheticOnly = false;
        i.save();
      },
    ],
    [
      'target-mismatch',
      i => {
        i.readiness.target.baseUrl = `${base}other/`;
        i.save();
      },
    ],
    [
      'cross-origin',
      i => {
        i.approval.target.baseUrl = 'http://external.invalid/';
        i.save();
      },
    ],
    [
      'credentials-in-url',
      i => {
        i.approval.target.baseUrl = 'https://SECRET_CANARY@example.invalid/';
        i.save();
      },
    ],
    [
      'encoded-path',
      i => {
        i.approval.target.baseUrl = `${base}%2fother/`;
        i.save();
      },
    ],
    [
      'schema-url',
      i => {
        (i.approval as any).$schema = 'http://external.invalid/schema';
        i.save();
      },
    ],
    [
      'image-mismatch',
      i => {
        i.readiness.image = `sha256:${'f'.repeat(64)}`;
        i.save();
      },
    ],
    [
      'flag-unknown',
      i => {
        (i.readiness.flags as any).analyst = 'unknown';
        i.save();
      },
    ],
    [
      'source-incomplete',
      i => {
        delete i.manifest.sourceFiles['src/lib/analyst-verifier/worker.mjs'];
        i.save();
      },
    ],
    [
      'verifier-unknown',
      i => {
        (i.readiness.verifier as any).imageTransport = null;
        i.save();
      },
    ],
    [
      'verifier-evidence-mismatch',
      i => {
        i.verifier.workerSha256 = '0'.repeat(64);
        i.save();
      },
    ],
    [
      'duplicate-approval-field',
      i => {
        const bytes = JSON.stringify(i.approval);
        writeFileSync(
          i.env.RELEASE_ANALYST_APPROVAL_FILE,
          bytes.replace('{', '{"syntheticOnly":false,'),
        );
      },
    ],
    [
      'source-file-mismatch',
      i => {
        i.manifest.sourceFiles['src/lib/analyst-verifier/worker.mjs'] = '0'.repeat(64);
        i.save();
      },
    ],
    [
      'hash-mismatch',
      i => {
        i.approval.manifestSha256 = '0'.repeat(64);
        writeFileSync(i.env.RELEASE_ANALYST_APPROVAL_FILE, JSON.stringify(i.approval));
      },
    ],
    [
      'unsafe-file-mode',
      i => {
        chmodSync(i.env.RELEASE_ANALYST_APPROVAL_FILE, 0o644);
      },
    ],
    [
      'symlink',
      i => {
        const path = join(i.root, 'link');
        symlinkSync(i.env.RELEASE_ANALYST_APPROVAL_FILE, path);
        i.env.RELEASE_ANALYST_APPROVAL_FILE = path;
      },
    ],
    [
      'ambiguous-auth',
      i => {
        (i.env as any).RELEASE_ANALYST_TOKEN_FILE = i.env.RELEASE_ANALYST_APPROVAL_FILE;
      },
    ],
    [
      'mismatched-auth',
      i => {
        i.env.RELEASE_ANALYST_TOKEN = 'SECRET_CANARY_wrong_token';
      },
    ],
    ['missing-vision', () => {}, ['--synthetic-only', '--require-ingest', '--require-vision']],
    [
      'policy-needs-vision',
      i => {
        i.manifest.policy.requireVision = true;
        i.save();
      },
    ],
    [
      'synthetic-transport-is-not-vision',
      i => {
        const configuration = {
          provider: 'synthetic',
          model: 'contract-only',
          settingsSha256: 'a'.repeat(64),
        };
        (i.manifest as any).visionConfiguration = configuration;
        i.manifest.policy.requireVision = true;
        i.save();
        const execution = {
          schemaVersion: 1,
          configuration,
          startedAt: i.approval.issuedAt,
          completedAt: Date.now(),
          outcome: 'passed',
          challengeSha256: 'a'.repeat(64),
          responseSha256: 'b'.repeat(64),
          promptSha256: 'c'.repeat(64),
          expectedAnswerSha256: 'd'.repeat(64),
          costUsd: 0,
          usage: { input: 1 },
        };
        const receipt = {
          schema: 'analyst-actual-provider-vision-v1',
          manifestSha256: i.approval.manifestSha256,
          qualifiedBy: 'test-operator',
          configuration,
          execution: { ...execution, evidenceSha256: sha256(JSON.stringify(execution)) },
        };
        const bytes = JSON.stringify(receipt);
        const path = join(i.root, 'vision.json');
        writeFileSync(path, bytes, { mode: 0o600 });
        (i.env as any).RELEASE_ANALYST_VISION_FILE = path;
        (i.approval as any).visionSha256 = sha256(bytes);
        i.save();
      },
    ],
    ['unknown-argument', () => {}, ['--synthetic-only', '--require-ingest', '--approve-target']],
    ['missing-synthetic-flag', () => {}, ['--require-ingest']],
  ];
  try {
    for (const [name, mutate, args] of cases)
      await t.test(name, async () => {
        const input = testInput(base);
        try {
          mutate(input);
          const result = await cli(input.env, args);
          assert.equal(result.code, 1, result.output);
          assert.equal(JSON.parse(result.output).category, 'guard-rejected');
          assert.doesNotMatch(result.output, /SECRET_CANARY|SYNTHETIC_AUTH_CANARY/);
          assert.equal(requests, 0);
        } finally {
          input.cleanup();
        }
      });
  } finally {
    server.close();
  }
});
