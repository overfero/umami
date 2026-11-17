// @vitest-environment node
import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import {
  resolveImageCapability,
  canInspectImages,
  imageConfiguration,
} from '../../../src/lib/ai/image-capability.mjs';
import { gatewayConfig } from '../../../src/lib/ai/rpc/confinement.mjs';
const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'synthetic-image-policy-'));
  roots.push(root);
  mkdirSync(join(root, '.next'));
  mkdirSync(join(root, 'generated'));
  writeFileSync(join(root, '.next/BUILD_ID'), 'synthetic-build');
  const policy = {
    schemaVersion: 1,
    buildId: 'synthetic-build',
    source: 'synthetic-test-only',
    files: { 'synthetic-policy': 'a'.repeat(64) },
  };
  const bytes = JSON.stringify(policy);
  writeFileSync(join(root, 'generated/analyst-image-policy.json'), bytes);
  const env: NodeJS.ProcessEnv & { AI_IMAGE_PREFLIGHT_PATH: string; AI_IMAGE_PREFLIGHT_SHA256: string } = {
    NODE_ENV: 'test',
    AI_PROVIDER: 'synthetic',
    AI_MODEL: 'synthetic-model',
    AI_BASE_URL: 'https://synthetic.invalid/v1',
    AI_EGRESS_ORIGINS: 'https://synthetic.invalid',
    AI_REASONING_LEVEL: 'medium',
    AI_IMAGE_PREFLIGHT_PATH: join(root, 'receipt.json'),
    AI_IMAGE_PREFLIGHT_SHA256: '',
  };
  const now = 1_800_000_000_000;
  // Synthetic successful attestation is ONLY a resolver fixture, never real provider evidence.
  const receipt = {
    schemaVersion: 1,
    kind: 'operator-attested-vision-preflight',
    configuration: imageConfiguration(env),
    policySha256: hash(bytes),
    buildId: policy.buildId,
    startedAt: now - 2000,
    completedAt: now - 1000,
    expiresAt: now + 60_000,
    outcome: 'passed',
    challengeSha256: 'b'.repeat(64),
    responseSha256: 'c'.repeat(64),
    evidenceSha256: 'd'.repeat(64),
  };
  const save = () => {
    const text = JSON.stringify(receipt);
    writeFileSync(env.AI_IMAGE_PREFLIGHT_PATH, text);
    env.AI_IMAGE_PREFLIGHT_SHA256 = hash(text);
  };
  save();
  return { root, env, now, receipt, save };
}
it('capability defaults unavailable and only exact host-attested preflight enables gateway images', () => {
  const f = fixture();
  expect(canInspectImages(undefined)).toBe(false);
  expect(canInspectImages({ available: true })).toBe(false);
  const capability = resolveImageCapability(f.env, f.root, f.now);
  expect(canInspectImages(capability, f.now)).toBe(true);
  expect(gatewayConfig(f.env, capability, f.now).providers.synthetic.models[0].input).toEqual([
    'text',
    'image',
  ]);
  expect(gatewayConfig(f.env).providers.synthetic.models[0].input).toEqual(['text']);
  expect(canInspectImages(capability, f.receipt.expiresAt)).toBe(false);
});
it('preflight denies missing forged failed stale future model endpoint reasoning settings policy and build mismatches', () => {
  for (const mutate of [
    (f: any) => delete f.env.AI_IMAGE_PREFLIGHT_PATH,
    (f: any) => (f.env.AI_IMAGE_PREFLIGHT_SHA256 = 'e'.repeat(64)),
    (f: any) => {
      f.receipt.outcome = 'failed';
      f.save();
    },
    (f: any) => {
      f.receipt.expiresAt = f.now;
      f.save();
    },
    (f: any) => {
      f.receipt.completedAt = f.now + 1;
      f.save();
    },
    (f: any) => (f.env.AI_MODEL = 'changed'),
    (f: any) => (f.env.AI_BASE_URL = 'https://other.invalid/v1'),
    (f: any) => (f.env.AI_REASONING_LEVEL = 'high'),
    (f: any) => {
      f.receipt.configuration.settings.api = 'other';
      f.save();
    },
    (f: any) => {
      f.receipt.policySha256 = 'e'.repeat(64);
      f.save();
    },
    (f: any) => writeFileSync(join(f.root, '.next/BUILD_ID'), 'other-build'),
    (f: any) => {
      f.receipt.buildId = 'other-build';
      f.save();
    },
  ]) {
    const f = fixture();
    mutate(f);
    expect(canInspectImages(resolveImageCapability(f.env, f.root, f.now), f.now)).toBe(false);
  }
});
it('preflight rejects symlink oversized and nonregular receipt or policy files without details', () => {
  for (const target of ['receipt', 'policy', 'oversized', 'directory']) {
    const f = fixture();
    const file =
      target === 'policy'
        ? join(f.root, 'generated/analyst-image-policy.json')
        : f.env.AI_IMAGE_PREFLIGHT_PATH;
    if (target === 'oversized') writeFileSync(file, 'x'.repeat(65537));
    else {
      rmSync(file);
      if (target === 'directory') mkdirSync(file);
      else {
        writeFileSync(file + '.other', '{}');
        symlinkSync(file + '.other', file);
      }
    }
    const capability = resolveImageCapability(f.env, f.root, f.now);
    expect(canInspectImages(capability, f.now)).toBe(false);
    expect(JSON.stringify(capability)).not.toContain(f.root);
  }
});
