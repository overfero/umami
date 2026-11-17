import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import {
  approvalSchema,
  canonicalTarget,
  currentSource,
  hash,
  manifestSchema,
  privateFile,
  parseRecord,
  readinessSchema,
  sha256,
} from './analyst-contract';

const configSchema = z.strictObject({
  provider: z.string().min(1).max(160),
  model: z.string().min(1).max(160),
  settingsSha256: hash,
});
const visionSchema = z.strictObject({
  schema: z.literal('analyst-actual-provider-vision-v1'),
  manifestSha256: hash,
  qualifiedBy: z.string().min(1).max(160),
  configuration: configSchema,
  execution: z.strictObject({
    schemaVersion: z.literal(1),
    configuration: configSchema,
    startedAt: z.number().int(),
    completedAt: z.number().int(),
    outcome: z.literal('passed'),
    challengeSha256: hash,
    responseSha256: hash,
    promptSha256: hash,
    expectedAnswerSha256: hash,
    costUsd: z.number().finite().nonnegative(),
    usage: z
      .record(z.string(), z.number().finite().nonnegative())
      .refine(value => Object.keys(value).length > 0),
    evidenceSha256: hash,
  }),
});
const load = (env: Record<string, string | undefined>, name: string) => {
  if (!env[name]) throw new Error('missing-input');
  const bytes = privateFile(env[name]);
  return { hash: sha256(bytes), value: parseRecord(bytes) };
};
export function loadApprovedInput(
  args: string[],
  env: Record<string, string | undefined>,
  now: number,
) {
  if (
    args.length < 2 ||
    args.some(arg => !['--synthetic-only', '--require-ingest', '--require-vision'].includes(arg)) ||
    new Set(args).size !== args.length ||
    !args.includes('--synthetic-only') ||
    !args.includes('--require-ingest')
  )
    throw new Error('arguments');
  const a = load(env, 'RELEASE_ANALYST_APPROVAL_FILE');
  const approval = approvalSchema.parse(a.value);
  canonicalTarget(approval.target);
  const fresh = (issuedAt: number, expiresAt: number) => {
    if (
      issuedAt > now ||
      expiresAt <= now ||
      expiresAt <= issuedAt ||
      now - issuedAt > 3600000 ||
      expiresAt - issuedAt > 3600000
    )
      throw new Error('expired');
  };
  fresh(approval.issuedAt, approval.expiresAt);
  if (now + approval.limits.durationMs > approval.expiresAt) throw new Error('deadline');
  const m = load(env, 'RELEASE_ANALYST_MANIFEST_FILE');
  const r = load(env, 'RELEASE_ANALYST_READINESS_FILE');
  const manifest = manifestSchema.parse(m.value);
  const readiness = readinessSchema.parse(r.value);
  fresh(readiness.issuedAt, readiness.expiresAt);
  if (now + approval.limits.durationMs > readiness.expiresAt) throw new Error('deadline');
  if (
    m.hash !== approval.manifestSha256 ||
    r.hash !== approval.readinessSha256 ||
    readiness.manifestSha256 !== m.hash ||
    !isDeepStrictEqual(readiness.target, approval.target) ||
    readiness.principalId !== approval.principalId
  )
    throw new Error('binding');
  for (const key of ['sourceRevision', 'image', 'buildId', 'verifierImage', 'flags'] as const)
    if (!isDeepStrictEqual(readiness[key], manifest[key])) throw new Error('identity');
  const source = currentSource();
  if (
    source.sourceRevision !== manifest.sourceRevision ||
    !isDeepStrictEqual(source.sourceFiles, manifest.sourceFiles)
  )
    throw new Error('source');
  for (const [key, file] of Object.entries({
    workerSha256: 'src/lib/analyst-verifier/worker.mjs',
    imagesSha256: 'src/lib/analyst-verifier/images.mjs',
    entrypointSha256: 'scripts/ai/verifier/container-worker.mjs',
  }))
    if (readiness.verifier[key] !== source.sourceFiles[file]) throw new Error('verifier-source');
  const verifier = load(env, 'RELEASE_ANALYST_VERIFIER_EVIDENCE_FILE');
  if (verifier.hash !== readiness.verifier.evidenceSha256) throw new Error('verifier-evidence');
  // Retained execution receipt is separately supplied, not a URL fetched from a schema document.
  const { evidenceSha256: _, ...facts } = readiness.verifier;
  if (
    !isDeepStrictEqual(verifier.value, {
      manifestSha256: m.hash,
      target: approval.target,
      issuedAt: readiness.issuedAt,
      verifierImage: manifest.verifierImage,
      ...facts,
    })
  )
    throw new Error('verifier-evidence');
  const visionRequired = args.includes('--require-vision') || manifest.policy.requireVision;
  let vision: 'actual-provider-receipt-qualified' | 'pending-not-requested' =
    'pending-not-requested';
  if (visionRequired) {
    const v = load(env, 'RELEASE_ANALYST_VISION_FILE');
    const receipt = visionSchema.parse(v.value);
    const { evidenceSha256, ...execution } = receipt.execution;
    if (
      !approval.visionSha256 ||
      v.hash !== approval.visionSha256 ||
      receipt.manifestSha256 !== m.hash ||
      sha256(JSON.stringify(execution)) !== evidenceSha256 ||
      !isDeepStrictEqual(receipt.configuration, execution.configuration) ||
      !isDeepStrictEqual(receipt.configuration, manifest.visionConfiguration) ||
      /synthetic|mock|fixture|offline|contract/i.test(receipt.configuration.provider) ||
      execution.startedAt < approval.issuedAt ||
      execution.completedAt < execution.startedAt ||
      execution.completedAt > now ||
      execution.completedAt > approval.expiresAt
    )
      throw new Error('vision');
    vision = 'actual-provider-receipt-qualified';
  } else if (
    approval.visionSha256 !== null ||
    env.RELEASE_ANALYST_VISION_FILE ||
    manifest.visionConfiguration !== null
  )
    throw new Error('ambiguous-vision');
  if (Boolean(env.RELEASE_ANALYST_TOKEN) === Boolean(env.RELEASE_ANALYST_TOKEN_FILE))
    throw new Error('ambiguous-auth');
  const token =
    env.RELEASE_ANALYST_TOKEN ??
    privateFile(env.RELEASE_ANALYST_TOKEN_FILE!).toString('utf8').trim();
  if (!/^[A-Za-z0-9_.~+/=-]{16,8192}$/.test(token) || sha256(token) !== approval.authSha256)
    throw new Error('auth');
  return {
    approval,
    manifest,
    readiness,
    token,
    vision,
    approvalSha256: a.hash,
    manifestSha256: m.hash,
    readinessSha256: r.hash,
  };
}
