import type { Evidence } from './offline';

// Exact reusable assertion anchors; executed, not inferred from file names or suite titles.
export const reusableAuthorityAssertions = [
  { id: '7.authority', file: 'src/lib/analyst-verifier/authority.test.ts', assertion: 'allows only an active task at exact board/analysis revisions with current view rights' },
  { id: '7.envelopes', file: 'src/lib/analyst-verifier/authority.test.ts', assertion: 'rejects foreign, stale, failed and mismatched envelopes rather than minting receipts' },
  { id: '7.after-query', file: 'src/lib/analyst-verifier/authority.test.ts', assertion: 'rechecks authority after execution and rejects unsupported or incomplete widget sets' },
  { id: '7.native', file: 'src/lib/analyst-verifier/authority.test.ts', assertion: 'native preparation refuses revoked sources before querying' },
  { id: '7.render', file: 'src/lib/analyst-verifier/port.test.ts', assertion: 'rejects stale revision, foreign/empty execution, foreign hash and revoked authority' },
  { id: '7.canvas', file: 'src/lib/analyst-verifier/port.test.ts', assertion: 'canvas handler: no session, forged session, or reused capability is denied' },
] as const;

export function authorityEvidence(report: any, commandPassed: boolean): Evidence {
  return { suite: 'authority-reusable', passed: commandPassed && report?.success === true && report?.testResults?.length > 0,
    assertions: reusableAuthorityAssertions.filter(expected => report?.testResults?.some((file: any) =>
      typeof file.name === 'string' && file.name.endsWith(`/${expected.file}`) && file.assertionResults?.some((a: any) =>
        a.fullName === expected.assertion && a.status === 'passed'),
    )).map(a => a.assertion),
  };
}

export const authorityPgRequirements = [
  { id: '6.question', assertion: 'discover IDs and schema then ask meaningful ambiguity with needs_input and no guessed mutation' },
  { id: '7.revocation', assertion: 'source revocation denies render authority and existing artifact release' },
  { id: '7.references', assertion: 'foreign stale malformed and team-revoked references deny capability and artifact release' },
  { id: '8.partial', assertion: 'partial failure after metadata writes rolls back board analyses revisions operation and task provenance' },
  { id: '9.approval', assertion: 'declined and stale existing-board approval leave metadata unchanged; accepted exact edit applies' },
] as const;

export const authorityApiRequirements = [
  { id: '7.preview', assertion: 'preview of another principal’s website is denied' },
  { id: '7.save', assertion: 'cannot save an analysis over an inaccessible source' },
  { id: '7.private', assertion: 'stranger cannot read, execute or patch a private draft' },
  { id: '7.execute', assertion: 'revoked source access denies saved execution (no stale grant)' },
  { id: '7.board', assertion: 'cannot reference another principal’s analysis' },
  { id: '7.board-save', assertion: 'revoked source access denies board create and update save' },
  { id: '7.bundle', assertion: 'revoked source denies bundle save' },
  { id: '8.replay', assertion: 'principal/task/key replay and concurrent same-key commits return the same board' },
  { id: '8.key', assertion: 'same key is scoped by principal/task; changed request under a key conflicts' },
  { id: '8.reference', assertion: 'unknown analysisRef is rejected before any write' },
  { id: '8.revision', assertion: 'stale revision conflicts and rolls back analyses, grant claim and idempotency record' },
  { id: '9.binding', assertion: 'existing-board edit without/with wrong-task, wrong-diff, foreign-principal or expired (otherwise matching) grant is denied with no mutation' },
  { id: '9.revoked', assertion: 'authority revoked after grant issuance denies the commit with zero mutation' },
  { id: '9.single-use', assertion: 'matching grant applies once; identical bundle under a fresh key cannot reuse it; same key replays' },
  { id: '9.sharing', assertion: 'sharing a board with analysis widgets is explicitly unsupported' },
  { id: '9.share-unchanged', assertion: 'refused share leaves widget intact and creates no share' },
] as const;
