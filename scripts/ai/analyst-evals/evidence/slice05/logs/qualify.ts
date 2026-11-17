import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { qualifyStrictReceipt } from '../../../strict-receipt';
import { qualifyVerifierImage } from '../../../verifier-image';
const dir = 'scripts/ai/analyst-evals/evidence/slice05';
const load = (name: string) => JSON.parse(readFileSync(`${dir}/${name}.json`, 'utf8'));
const hash = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
const receipt = load('e1');
assert.match(receipt.sourceRevision, /^[a-f0-9]{40}$/);
const historicalHash = (file: string) =>
  createHash('sha256')
    .update(execFileSync('git', ['show', `${receipt.sourceRevision}:${file}`]))
    .digest('hex');
const reconstructed = qualifyStrictReceipt(receipt, historicalHash);
const browser = load('browser');
assert.deepEqual(browser, receipt.browserReport);
assert.equal(reconstructed.pass, true);
const image = qualifyVerifierImage(browser.verifierImage.imageId, hash);
assert.equal(image.imageId, browser.verifierImage.imageId);
assert.deepEqual(image.fileHashes, browser.verifierImage.fileHashes);
const packaged = load('standalone');
assert.match(packaged.stdout, /"packageOnly":true/);
assert.match(packaged.stdout, /"analysisValue":42/);
assert.deepEqual(browser.missingTraces, []);
const result = {
  complete: true,
  observedAt: new Date().toISOString(),
  hashesMatched: Object.keys(receipt.sourceHashes).length,
  browserHashesMatched: Object.keys(browser.sourceHashes).length,
  browserCommands: browser.commands.length,
  strictCommands: receipt.commands.length,
  allTwelveDeterministic: true,
  historicalSourceRevision: receipt.sourceRevision,
  qualificationBoundary:
    'Reconstructed historical execution at recorded revision; not a new current-source E1 run.',
  currentSourceDifferences: Object.keys(receipt.sourceHashes).filter(
    file => hash(file) !== receipt.sourceHashes[file],
  ),
  verifierImage: image,
  reports: Object.fromEntries(
    ['e1', 'browser', 'standalone', 'evaluator', 'product'].map(n => [n, hash(`${dir}/${n}.json`)]),
  ),
};
writeFileSync(`${dir}/review-qualification.json`, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
