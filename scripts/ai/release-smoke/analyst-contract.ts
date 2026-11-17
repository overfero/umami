import { constants, closeSync, fstatSync, openSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { z } from 'zod';

export const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
export const hash = z.string().regex(/^[a-f0-9]{64}$/);
const text = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-zA-Z0-9_.:@ -]+$/);
export const targetSchema = z.strictObject({
  baseUrl: z.string().max(512),
  environment: z.enum(['staging', 'release', 'local-disposable']),
});
const timed = { issuedAt: z.number().int(), expiresAt: z.number().int() };
export const flagsSchema = z.strictObject({ analyst: z.boolean(), verifier: z.boolean() });
export const manifestSchema = z.strictObject({
  schema: z.literal('analyst-release-manifest-v1'),
  sourceRevision: z.string().regex(/^[a-f0-9]{40}$/),
  sourceFiles: z.record(z.string(), hash),
  image: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  buildId: text,
  verifierImage: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  flags: flagsSchema,
  policy: z.strictObject({ requireVision: z.boolean() }),
  visionConfiguration: z
    .strictObject({
      provider: z.string().min(1).max(160),
      model: z.string().min(1).max(160),
      settingsSha256: hash,
    })
    .nullable(),
});
export const approvalSchema = z.strictObject({
  schema: z.literal('analyst-release-approval-v1'),
  approvalId: text,
  approvedBy: text,
  target: targetSchema,
  ...timed,
  manifestSha256: hash,
  readinessSha256: hash,
  visionSha256: hash.nullable(),
  authSha256: hash,
  principalId: z.uuid(),
  syntheticOnly: z.literal(true),
  operations: z.tuple([
    z.literal('read-readiness'),
    z.literal('auth-denials'),
    z.literal('create-website'),
    z.literal('ingest'),
    z.literal('read-owned-events'),
    z.literal('delete-owned-website'),
  ]),
  limits: z.strictObject({
    websites: z.literal(1),
    events: z.literal(2),
    requests: z.literal(20),
    durationMs: z.number().int().min(1000).max(120000),
  }),
});
export const readinessSchema = z.strictObject({
  schema: z.literal('analyst-release-readiness-v1'),
  observedBy: text,
  target: targetSchema,
  ...timed,
  manifestSha256: hash,
  principalId: z.uuid(),
  sourceRevision: z.string(),
  image: z.string(),
  buildId: text,
  verifierImage: z.string(),
  flags: flagsSchema,
  ready: z.literal(true),
  verifier: z.strictObject({
    outcome: z.literal('passed'),
    mode: z.literal('executed-synthetic-render'),
    workerSha256: hash,
    imagesSha256: hash,
    entrypointSha256: hash,
    capabilityDeniedWithoutGrant: z.literal(true),
    expiredCapabilityDenied: z.literal(true),
    desktopAndNarrow: z.literal(true),
    imageTransport: z.literal(true),
    evidenceSha256: hash,
  }),
});

/** Never follows symlinks or reads arbitrary-size/private credential files. Errors stay generic. */
export function privateFile(path: string): Buffer {
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = fstatSync(fd);
    if (
      !stat.isFile() ||
      stat.size > 2 * 1024 * 1024 ||
      stat.nlink !== 1 ||
      stat.mode & 0o077 ||
      stat.uid !== process.getuid?.()
    )
      throw new Error('private-file');
    const bytes = readFileSync(fd);
    if (bytes.length > 2 * 1024 * 1024) throw new Error('private-file');
    return bytes;
  } finally {
    closeSync(fd);
  }
}

/** JSON.parse silently accepts duplicate object keys; approval records must not be ambiguous. */
export function parseRecord(bytes: Buffer): Record<string, z.infer<ReturnType<typeof z.json>>> {
  const text = bytes.toString('utf8');
  JSON.parse(text);
  const stack: (Set<string> | null)[] = [];
  const tokens = /"(?:[^"\\]|\\.)*"|[{}\[\]:,]|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  for (const token of text.matchAll(tokens)) {
    if (token[0] === '{') stack.push(new Set());
    else if (token[0] === '[') stack.push(null);
    else if (token[0] === '}' || token[0] === ']') stack.pop();
    else if (
      token[0].startsWith('"') &&
      text
        .slice(token.index + token[0].length)
        .trimStart()
        .startsWith(':')
    ) {
      const current = stack.at(-1);
      const key = JSON.parse(token[0]);
      if (!current || current.has(key)) throw new Error('ambiguous-json');
      current.add(key);
    }
  }
  return z.record(z.string(), z.json()).parse(JSON.parse(text));
}

export function canonicalTarget(target: z.infer<typeof targetSchema>) {
  const url = new URL(target.baseUrl);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^https?:$/.test(url.protocol) ||
    url.href !== target.baseUrl ||
    url.pathname.endsWith('/') === false ||
    /%|\\|\/\//.test(url.pathname)
  )
    throw new Error('target');
  if (
    url.protocol !== 'https:' &&
    !(target.environment === 'local-disposable' && url.hostname === '127.0.0.1')
  )
    throw new Error('target');
  if (target.environment === 'local-disposable' && url.hostname !== '127.0.0.1')
    throw new Error('target');
  return target;
}

// Exact tracked runtime/build inputs; tests/docs/evidence do not qualify a deployed build.
export function sourceFiles() {
  return execFileSync('git', ['ls-files', '-z'], {
    encoding: 'utf8',
    timeout: 5000,
    maxBuffer: 1024 * 1024,
  })
    .split('\0')
    .filter(
      file =>
        file &&
        ((/^(src|packages|prisma|deploy|docker|public)\//.test(file) &&
          !/\.(test|spec)\.[cm]?[jt]sx?$/.test(file)) ||
          (/^scripts\//.test(file) &&
            !/^scripts\/ai\/(analyst-evals|analyst-report|evals)\//.test(file) &&
            !/\.(test|spec)\./.test(file) &&
            !file.endsWith('/analyst-test-input.ts')) ||
          /^(Dockerfile|package.json|pnpm-lock.yaml|pnpm-workspace.yaml|next.config.ts|tsconfig.*\.json)$/.test(
            file,
          )),
    )
    .sort();
}

export function currentSource() {
  return {
    sourceRevision: execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
      timeout: 5000,
    }).trim(),
    sourceFiles: Object.fromEntries(sourceFiles().map(file => [file, sha256(readFileSync(file))])),
  };
}
