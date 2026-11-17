// Test-only operational records. Never qualifies these invented image/render facts as deployment evidence.
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { currentSource, sha256 } from './analyst-contract';
export function testInput(baseUrl: string) {
  const root = mkdtempSync(join(tmpdir(), 'analyst-smoke-input-'));
  const target = { baseUrl, environment: 'local-disposable' };
  const token = 'SYNTHETIC_AUTH_CANARY_123456789';
  const principalId = '88888888-8888-4888-8888-888888888888';
  const now = Date.now();
  const manifest = {
    schema: 'analyst-release-manifest-v1',
    ...currentSource(),
    image: `sha256:${'a'.repeat(64)}`,
    buildId: 'protocol-test-only',
    verifierImage: `sha256:${'b'.repeat(64)}`,
    flags: { analyst: false, verifier: false },
    policy: { requireVision: false },
    visionConfiguration: null,
  };
  const verifierFacts = {
    outcome: 'passed',
    mode: 'executed-synthetic-render',
    workerSha256: manifest.sourceFiles['src/lib/analyst-verifier/worker.mjs'],
    imagesSha256: manifest.sourceFiles['src/lib/analyst-verifier/images.mjs'],
    entrypointSha256: manifest.sourceFiles['scripts/ai/verifier/container-worker.mjs'],
    capabilityDeniedWithoutGrant: true,
    expiredCapabilityDenied: true,
    desktopAndNarrow: true,
    imageTransport: true,
  };
  const verifier = {
    manifestSha256: '',
    target,
    issuedAt: now,
    verifierImage: manifest.verifierImage,
    ...verifierFacts,
  };
  const readiness = {
    schema: 'analyst-release-readiness-v1',
    observedBy: 'test-operator',
    target: structuredClone(target),
    issuedAt: now,
    expiresAt: now + 600000,
    manifestSha256: '',
    principalId,
    sourceRevision: manifest.sourceRevision,
    image: manifest.image,
    buildId: manifest.buildId,
    verifierImage: manifest.verifierImage,
    flags: manifest.flags,
    ready: true,
    verifier: { ...verifierFacts, evidenceSha256: '' },
  };
  const approval = {
    schema: 'analyst-release-approval-v1',
    approvalId: 'protocol-test',
    approvedBy: 'test-operator',
    target: structuredClone(target),
    issuedAt: now,
    expiresAt: now + 600000,
    manifestSha256: '',
    readinessSha256: '',
    visionSha256: null,
    authSha256: sha256(token),
    principalId,
    syntheticOnly: true,
    operations: [
      'read-readiness',
      'auth-denials',
      'create-website',
      'ingest',
      'read-owned-events',
      'delete-owned-website',
    ],
    limits: { websites: 1, events: 2, requests: 20, durationMs: 30000 },
  };
  const write = (name: string, value: unknown) => {
    const bytes = JSON.stringify(value);
    writeFileSync(join(root, name), bytes, { mode: 0o600 });
    return sha256(bytes);
  };
  const save = () => {
    approval.manifestSha256 = write('manifest.json', manifest);
    readiness.manifestSha256 = approval.manifestSha256;
    verifier.manifestSha256 = approval.manifestSha256;
    readiness.verifier.evidenceSha256 = write('verifier.json', verifier);
    approval.readinessSha256 = write('readiness.json', readiness);
    write('approval.json', approval);
  };
  save();
  return {
    root,
    manifest,
    readiness,
    approval,
    verifier,
    save,
    token,
    principalId,
    env: {
      RELEASE_ANALYST_APPROVAL_FILE: join(root, 'approval.json'),
      RELEASE_ANALYST_MANIFEST_FILE: join(root, 'manifest.json'),
      RELEASE_ANALYST_READINESS_FILE: join(root, 'readiness.json'),
      RELEASE_ANALYST_VERIFIER_EVIDENCE_FILE: join(root, 'verifier.json'),
      RELEASE_ANALYST_TOKEN: token,
    },
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}
