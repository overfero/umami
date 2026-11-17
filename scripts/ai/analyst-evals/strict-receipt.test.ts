// @vitest-environment node
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { qualifyStrictReceipt } from './strict-receipt';
const original = JSON.parse(
  readFileSync('scripts/ai/analyst-evals/evidence/slice05/e1.json', 'utf8'),
);
it('reconstructs all twelve groups from the fourteen expected commands, not declared coverage', () => {
  const receipt = structuredClone(original);
  receipt.evidence = [{ suite: 'forged', passed: true, assertions: ['anything'] }];
  expect(qualifyStrictReceipt(receipt, file => original.sourceHashes[file]).proven).toHaveLength(
    12,
  );
});
it('rejects absent reports, incomplete commands, forged coverage, source and report pairing', () => {
  for (const mutate of [
    (r: typeof original) => delete r.vitestReport,
    (r: typeof original) => delete r.lifecycleProductReport,
    (r: typeof original) => delete r.authorityVitestReport,
    (r: typeof original) => r.commands.splice(11, 3),
    (r: typeof original) => (r.commands[0].command = 'true'),
    (r: typeof original) =>
      (r.commands[1].output =
        'EVIDENCE {"suite":"postgres-supplement","passed":true,"assertions":["arbitrary"]}'),
    (r: typeof original) => (r.commands[11].output = 'JSON report written to /tmp/wrong.json\n'),
    (r: typeof original) => (r.lifecycleProductReport = r.vitestReport),
    (r: typeof original) => (r.vitestReport.testResults[0].name = '/wrong-source.test.ts'),
    (r: typeof original) => (r.sourceHashes['scripts/test-analyst-api.ts'] = 'wrong'),
    (r: typeof original) => delete r.sourceHashes['scripts/test-analyst-api.ts'],
    (r: typeof original) => (r.commands[13].exitCode = 1),
    (r: typeof original) => (r.browserReport.commands[2].stdout = '{}'),
    (r: typeof original) => (r.browserReport.verifierImage.imageId = 'mutable:tag'),
  ]) {
    const receipt = structuredClone(original);
    mutate(receipt);
    expect(() => qualifyStrictReceipt(receipt, file => original.sourceHashes[file])).toThrow();
  }
});
