import { expect, it } from 'vitest';
import { browserReceiptEvidence, browserSourceFiles, browserFingerprintedFiles } from './browser-receipt';
import { lifecycleBrowserAssertions } from './lifecycle-evidence';
it('browser reuse requires completed successful source-qualified reports and exact fingerprints', () => {
  const receipt = { complete:true,sourceHashes:Object.fromEntries(browserFingerprintedFiles().map(f=>[f,'a'])),commands:[{exitCode:0}],browserReports:[{commandPassed:true,report:{errors:[],suites:[{specs:lifecycleBrowserAssertions.map(b=>({file:b.file,title:b.assertion,tests:[{expectedStatus:'passed',results:[{status:'passed'}]}]}))}]}}] };
  expect(browserReceiptEvidence(receipt,()=> 'a').assertions).toHaveLength(lifecycleBrowserAssertions.length);
  for(const mutate of [
    (r:any)=>r.complete=false,
    (r:any)=>r.sourceHashes={},
    (r:any)=>r.sourceHashes[browserSourceFiles[0]]='changed',
    (r:any)=>r.commands[0].exitCode=1,
    (r:any)=>r.browserReports=[],
    (r:any)=>r.browserReports[0].report.suites[0].specs[0].file='wrong.spec.ts',
    (r:any)=>r.browserReports[0].report.suites[0].specs[0].tests[0].results[0].status='skipped',
  ]) {const copy=structuredClone(receipt);mutate(copy);expect(()=>browserReceiptEvidence(copy,()=> 'a')).toThrow();}
});
