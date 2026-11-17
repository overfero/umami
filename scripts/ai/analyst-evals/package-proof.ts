// Disposable package-only smoke: Docker's build context contains no checkout or host dependencies.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { provisionFixtureDatabase, cleanupFixtureDatabase } from '../analyst-fixture/database.mjs';
import { fixtureSchema } from '../../../src/lib/ai/fixture-database.mjs';

export function runPackageProof(project: string, output: string) {
  assert.ok(path.isAbsolute(project), 'absolute owned fixture root required');
  const receipt = JSON.parse(
    readFileSync(path.join(project, '.analyst-fixture-receipt.json'), 'utf8'),
  );
  assert.equal(receipt.root, project);
  const context = mkdtempSync(path.join(tmpdir(), 'umami-package-proof-'));
  const nonce = randomBytes(32).toString('hex');
  const image = `umami-analyst-package:${nonce.slice(0, 24)}`;
  const container = `umami-analyst-package-${nonce.slice(0, 24)}`;
  let databaseUrl: string | undefined;
  let succeeded = false;
  try {
    cpSync(path.join(project, '.next/standalone'), path.join(context, 'app'), {
      recursive: true,
      verbatimSymlinks: true,
    });
    cpSync('scripts/ai/analyst-evals/standalone-smoke.mjs', path.join(context, 'smoke.mjs'));
    writeFileSync(
      path.join(context, 'Dockerfile'),
      `FROM node:22.23.4-alpine@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202\nWORKDIR /app\nCOPY app ./\nCOPY smoke.mjs /smoke.mjs\nUSER node\nCMD ["sh", "-c", "node server.js & server=$!; trap 'kill $server' EXIT; node /smoke.mjs"]\n`,
    );
    databaseUrl = provisionFixtureDatabase(project, nonce.slice(0, 24));
    execFileSync('docker', ['build', '-t', image, context], { stdio: 'inherit', timeout: 180_000 });
    const imageId = execFileSync('docker', ['image', 'inspect', image, '--format', '{{.Id}}'], {
      encoding: 'utf8',
    }).trim();
    const result = execFileSync(
      'docker',
      [
        'run',
        '--name',
        container,
        '--rm',
        '--network',
        'host',
        '--cap-drop',
        'ALL',
        '--security-opt',
        'no-new-privileges',
        '-e',
        `DATABASE_URL=${databaseUrl}`,
        '-e',
        'HOSTNAME=127.0.0.1',
        '-e',
        'PORT=3367',
        '-e',
        'APP_SECRET=synthetic-analyst-fixture-only',
        '-e',
        'AI_ANALYST_ENABLED=true',
        imageId,
      ],
      { encoding: 'utf8', timeout: 90_000 },
    );
    assert.match(result, /"analysisValue":42/);
    writeFileSync(
      output,
      JSON.stringify(
        {
          complete: true,
          imageId,
          packageRoot: context,
          stdout: result,
          base: 'node:22.23.4-alpine@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202',
          observedAt: new Date().toISOString(),
          limitations:
            'Unsigned local build evidence, disposable PG only; not provider vision or deployed release.',
        },
        null,
        2,
      ),
    );
    succeeded = true;
  } finally {
    spawnSync('docker', ['rm', '-f', container], { stdio: 'ignore', timeout: 10_000 });
    if (databaseUrl)
      cleanupFixtureDatabase(databaseUrl, {
        databaseUrl,
        schema: fixtureSchema(databaseUrl),
        nonceSha256: createHash('sha256').update(nonce).digest('hex'),
      });
    if (succeeded) rmSync(context, { recursive: true });
  }
}
if (process.argv[1]?.endsWith('package-proof.ts'))
  runPackageProof(path.resolve(process.argv[2]), process.argv[3]);
