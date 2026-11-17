import { createHash } from 'node:crypto';
import { constants, openSync, closeSync, fstatSync, readSync, realpathSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';

const grants = new WeakMap();
const unavailable = Object.freeze({ available: false });
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const exactKeys = (value, keys) =>
  value && isDeepStrictEqual(Object.keys(value).sort(), keys.sort());

/** Effective fixed provider settings; shared by gateway declaration and preflight binding. */
export function imageConfiguration(env) {
  return {
    provider: env.AI_PROVIDER,
    model: env.AI_MODEL,
    endpoint: env.AI_BASE_URL,
    origin: env.AI_EGRESS_ORIGINS,
    reasoning: env.AI_REASONING_LEVEL ?? 'medium',
    settings: {
      api: 'openai-completions',
      authHeader: true,
      reasoning: true,
      thinkingLevelMap: {
        off: 'none',
        minimal: null,
        low: 'low',
        medium: 'medium',
        high: 'high',
        xhigh: 'xhigh',
      },
      compat: {
        supportsStore: false,
        supportsDeveloperRole: false,
        supportsReasoningEffort: true,
        maxTokensField: 'max_tokens',
        thinkingFormat: 'openai',
      },
    },
  };
}

// Reject symlinks including parent traversal. Bound the actual opened inode, not only a stat
// before open. Trusted operators must protect the receipt/manifest directories from writes.
function readRegular(file, limit) {
  if (!isAbsolute(file) || realpathSync(file) !== resolve(file)) throw new Error('invalid_file');
  const fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.size < 1 || stat.size > limit) throw new Error('invalid_file');
    const buffer = Buffer.alloc(limit + 1);
    let length = 0;
    while (length < buffer.length) {
      const count = readSync(fd, buffer, length, buffer.length - length, null);
      if (!count) break;
      length += count;
    }
    if (length > limit || length !== stat.size) throw new Error('invalid_file');
    return buffer.subarray(0, length);
  } finally {
    closeSync(fd);
  }
}

/** Host attestation, not independently authenticated source identity or proof of vision.
 * No receipt is generated here. Release must verify packaged policy/build/source/image equality
 * and review the actual challenge/result evidence before provisioning path + expected digest.
 */
export function resolveImageCapability(env = process.env, root = process.cwd(), now = Date.now()) {
  try {
    if (!sha(env.AI_IMAGE_PREFLIGHT_SHA256) || !isAbsolute(env.AI_IMAGE_PREFLIGHT_PATH ?? ''))
      return unavailable;
    const bytes = readRegular(env.AI_IMAGE_PREFLIGHT_PATH, 65536);
    if (digest(bytes) !== env.AI_IMAGE_PREFLIGHT_SHA256) return unavailable;
    const receipt = JSON.parse(bytes.toString('utf8'));
    const policyBytes = readRegular(join(root, 'generated/analyst-image-policy.json'), 65536);
    const policy = JSON.parse(policyBytes.toString('utf8'));
    const build = readRegular(join(root, '.next/BUILD_ID'), 256).toString('utf8').trim();
    if (
      !exactKeys(policy, ['schemaVersion', 'buildId', 'source', 'files']) ||
      policy.schemaVersion !== 1 ||
      typeof policy.source !== 'string' ||
      !policy.source ||
      !policy.files ||
      !Object.keys(policy.files).length ||
      !Object.values(policy.files).every(sha) ||
      policy.buildId !== build ||
      !build
    )
      return unavailable;
    if (
      !exactKeys(receipt, [
        'schemaVersion',
        'kind',
        'configuration',
        'policySha256',
        'buildId',
        'startedAt',
        'completedAt',
        'expiresAt',
        'outcome',
        'challengeSha256',
        'responseSha256',
        'evidenceSha256',
      ]) ||
      receipt.schemaVersion !== 1 ||
      receipt.kind !== 'operator-attested-vision-preflight' ||
      receipt.outcome !== 'passed' ||
      receipt.policySha256 !== digest(policyBytes) ||
      receipt.buildId !== build ||
      !isDeepStrictEqual(receipt.configuration, imageConfiguration(env)) ||
      ![receipt.challengeSha256, receipt.responseSha256, receipt.evidenceSha256].every(sha) ||
      ![now, receipt.startedAt, receipt.completedAt, receipt.expiresAt].every(
        Number.isSafeInteger,
      ) ||
      receipt.startedAt > receipt.completedAt ||
      receipt.completedAt > now ||
      receipt.expiresAt <= now ||
      receipt.expiresAt - receipt.startedAt > 24 * 60 * 60_000
    )
      return unavailable;
    const configuration = JSON.stringify(imageConfiguration(env));
    const capability = Object.freeze({ available: true });
    grants.set(capability, { configuration, expiresAt: receipt.expiresAt });
    return capability;
  } catch {
    return unavailable;
  }
}

export function canInspectImages(capability, now = Date.now()) {
  const grant = capability && grants.get(capability);
  return !!grant && Number.isFinite(now) && now < grant.expiresAt;
}
export function capabilityMatchesConfiguration(capability, env, now = Date.now()) {
  return (
    canInspectImages(capability, now) &&
    grants.get(capability).configuration === JSON.stringify(imageConfiguration(env))
  );
}

/** Explicit dependency-injection seam for synthetic transport/contract tests only.
 * Never selected by environment, request fields or a fallback in production.
 */
export function syntheticImageCapabilityForTests(expiresAt = Number.MAX_SAFE_INTEGER) {
  const capability = Object.freeze({ available: true });
  grants.set(capability, {
    configuration: 'synthetic-test-only',
    expiresAt,
  });
  return capability;
}
