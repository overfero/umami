import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { testInput } from './analyst-test-input';

// Independent audit of actual tracked root inputs, not derived from sourceFiles().
const rootBuildInputs = [
  'Dockerfile',
  '.dockerignore',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'next.config.ts',
  'postcss.config.js',
  'prisma.config.ts',
  'biome.json',
  'rollup.tracker.config.js',
  'rollup.recorder.config.js',
  'tsup.config.js',
  'package.components.json',
  'tsconfig.json',
  'tsconfig.prisma.json',
  'tsconfig.tracker.json',
  'tsconfig.tracker.types.json',
  'netlify.toml',
  'vercel.json',
  'app.json',
  'docker-compose.yml',
];
const sourceScript =
  "import { currentSource } from './scripts/ai/release-smoke/analyst-contract.ts'; console.log(JSON.stringify(currentSource()));";

test('public CLI rejects stale approval after each tracked root build input changes in a disposable source checkout', {
  timeout: 120000,
}, async t => {
  const checkout = mkdtempSync(join(tmpdir(), 'analyst-smoke-source-'));
  const env = { PATH: process.env.PATH, NODE_ENV: 'test' as const };
  let requests = 0;
  const server = createServer((_req, res) => {
    requests++;
    res.setHeader('content-type', 'application/json');
    res.end('{"ok":false}');
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/`;
  try {
    // Checkout copies only git-tracked bytes: no .env discovery/copy and no shared-source edits.
    execFileSync('git', ['clone', '--shared', '--no-checkout', '--quiet', resolve('.'), checkout], {
      env,
      timeout: 10000,
    });
    execFileSync('git', ['checkout', '--quiet', '--detach', 'HEAD'], {
      cwd: checkout,
      env,
      timeout: 10000,
    });
    // Exercise current implementation, including the inspected pre-existing formatter delta.
    for (const file of ['scripts/ai/release-smoke/analyst-contract.ts'])
      writeFileSync(join(checkout, file), readFileSync(file));
    symlinkSync(resolve('node_modules'), join(checkout, 'node_modules'));
    const source = JSON.parse(
      execFileSync(
        process.execPath,
        ['--import', 'tsx', '--input-type=module', '-e', sourceScript],
        { cwd: checkout, env, encoding: 'utf8', timeout: 10000 },
      ),
    );
    const run = async (input: ReturnType<typeof testInput>) => {
      const child = spawn(
        process.execPath,
        [
          '--import',
          'tsx',
          'scripts/ai/release-analyst-smoke.ts',
          '--synthetic-only',
          '--require-ingest',
        ],
        { cwd: checkout, env: { ...env, ...input.env }, stdio: ['ignore', 'pipe', 'pipe'] },
      );
      let output = '';
      child.stdout!.on('data', part => {
        output += part;
      });
      child.stderr!.on('data', part => {
        output += part;
      });
      const code = await new Promise(resolve => child.once('close', resolve));
      return { code, report: JSON.parse(output) };
    };
    const input = testInput(base);
    try {
      Object.assign(input.manifest, source);
      input.save();
      // Positive control: this exact manifest qualifies before any source mutation.
      assert.equal((await run(input)).report.category, 'runtime-preflight-failed');
      assert.equal(requests, 1);
      requests = 0;
      for (const file of rootBuildInputs)
        await t.test(file, async () => {
          const path = join(checkout, file);
          const original = readFileSync(path);
          try {
            writeFileSync(path, Buffer.concat([original, Buffer.from('\n ')]));
            const result = await run(input);
            assert.equal(result.code, 1);
            assert.equal(result.report.category, 'guard-rejected');
            assert.equal(requests, 0, 'stale approval must confer no target request authority');
          } finally {
            writeFileSync(path, original);
            requests = 0;
          }
        });
      for (const mode of ['directory', 'symlink'])
        await t.test(`source-${mode}`, async () => {
          const file = 'postcss.config.js';
          const path = join(checkout, file);
          const original = readFileSync(path);
          const replacement = join(checkout, 'source-replacement');
          try {
            rmSync(path);
            if (mode === 'directory') mkdirSync(path);
            else {
              writeFileSync(replacement, original);
              symlinkSync(replacement, path);
            }
            const result = await run(input);
            assert.equal(result.report.category, 'guard-rejected');
            assert.equal(requests, 0);
          } finally {
            rmSync(path, { recursive: true, force: true });
            writeFileSync(path, original);
            rmSync(replacement, { force: true });
            requests = 0;
          }
        });
    } finally {
      input.cleanup();
    }
  } finally {
    server.close();
    rmSync(checkout, { recursive: true, force: true });
  }
});
