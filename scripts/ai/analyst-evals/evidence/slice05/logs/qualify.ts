import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { browserReceiptEvidence } from '../../../browser-receipt';
import { summarizeCoverage, apiEvidence } from '../../../offline';
import { qualifyVerifierImage } from '../../../verifier-image';
const dir = 'scripts/ai/analyst-evals/evidence/slice05';
const load = (name: string) => JSON.parse(readFileSync(`${dir}/${name}.json`, 'utf8'));
const hash = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
const receipt = load('e1');
assert.equal(receipt.complete, true);
for (const [file, expected] of Object.entries(receipt.sourceHashes)) assert.equal(hash(file), expected, file);
const browser = load('browser');
assert.deepEqual(browser, receipt.browserReport);
const evidence = browserReceiptEvidence(browser, hash);
assert.equal(evidence.passed, true);
assert.deepEqual(summarizeCoverage(receipt.evidence), { pass: true, proven: [1,2,3,4,5,6,7,8,9,10,11,12], pending: [] });
for (const engine of ['postgres', 'clickhouse']) {
  const command = receipt.commands.find((c: {command: string}) => c.command === `tsx scripts/test-analyst-api.ts --${engine}`);
  assert.equal(command.exitCode, 0);
  assert.equal(apiEvidence(engine, command.output).passed, true);
}
assert.ok(receipt.commands.every((c: { passed: boolean; exitCode: number }) => c.passed && c.exitCode === 0));
const image = qualifyVerifierImage(browser.verifierImage.imageId, hash);
assert.equal(image.imageId, browser.verifierImage.imageId);
assert.deepEqual(image.fileHashes, browser.verifierImage.fileHashes);
const packaged = load('standalone');
assert.match(packaged.stdout, /"packageOnly":true/);
assert.match(packaged.stdout, /"analysisValue":42/);
assert.deepEqual(browser.missingTraces, []);
const result = { complete: true, observedAt: new Date().toISOString(), hashesMatched: Object.keys(receipt.sourceHashes).length,
  browserHashesMatched: Object.keys(browser.sourceHashes).length, browserCommands: browser.commands.length,
  strictCommands: receipt.commands.length, allTwelveDeterministic: true, verifierImage: image,
  reports: Object.fromEntries(['e1','browser','standalone','evaluator','product'].map(n=>[n,hash(`${dir}/${n}.json`)])) };
writeFileSync(`${dir}/qualification.json`, JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
