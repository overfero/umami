import { expect,it } from 'vitest';
import { browserReceiptEvidence,browserSourceFiles,browserFingerprintedFiles } from './browser-receipt';
import { lifecycleBrowserAssertions } from './lifecycle-evidence';
import { browserCommandSpecs,expectedBrowserArgs } from './browser-commands';
import { verifierImageFiles,verifierBuildFiles } from './verifier-image';
it('browser reuse requires completed successful paired source-qualified reports image equality and exact fingerprints',()=>{
 const report={errors:[],suites:[{specs:lifecycleBrowserAssertions.map(b=>({file:b.file,title:b.assertion,tests:[{expectedStatus:'passed',results:[{status:'passed'}]}]}))}]};
 const receipt={complete:true,checkoutRoot:'/checkout',sourceHashes:Object.fromEntries(browserFingerprintedFiles().map(f=>[f,'a'])),
 verifierImage:{imageId:`sha256:${'b'.repeat(64)}`,fileHashes:Object.fromEntries(verifierImageFiles.map(f=>[f,'a'])),buildDefinitionHashes:Object.fromEntries(verifierBuildFiles.map(f=>[f,'a']))},
 commands:[{id:'browser-prisma',executable:'/checkout/node_modules/.bin/prisma',args:['generate'],exitCode:0,timedOut:false},{id:'browser-build',executable:'/checkout/node_modules/.bin/next',args:['build','--webpack'],exitCode:0,timedOut:false},...browserCommandSpecs.map(s=>({id:s.id,executable:'/checkout/node_modules/.bin/playwright',args:expectedBrowserArgs(s),exitCode:0,timedOut:false,stdout:JSON.stringify(report)}))],
 browserReports:browserCommandSpecs.map(s=>({commandId:s.id,report}))};
 for(const command of receipt.commands)Object.assign(command,{verifierImageId:receipt.verifierImage.imageId});
 expect(browserReceiptEvidence(receipt,()=> 'a').assertions).toHaveLength(lifecycleBrowserAssertions.length);
 for(const mutate of [
 (r:any)=>r.complete=false,(r:any)=>r.sourceHashes={},(r:any)=>r.sourceHashes[browserSourceFiles[0]]='changed',
 (r:any)=>r.commands[0].exitCode=1,(r:any)=>r.browserReports=[],
 (r:any)=>r.commands=r.commands.filter((c:any)=>c.id!=='browser-b3'),
 (r:any)=>r.commands=[{exitCode:0}],
 (r:any)=>r.verifierImage.fileHashes[verifierImageFiles[0]]='changed',
 (r:any)=>r.verifierImage.imageId='mutable:tag',
 (r:any)=>r.commands[2].verifierImageId='different',
 (r:any)=>{r.browserReports[0].report.suites[0].specs[0].file='wrong.spec.ts';for(const c of r.commands)if(c.stdout)c.stdout=JSON.stringify(r.browserReports[0].report);},
 (r:any)=>{r.browserReports[0].report.suites[0].specs[0].tests[0].results[0].status='skipped';for(const c of r.commands)if(c.stdout)c.stdout=JSON.stringify(r.browserReports[0].report);},
 (r:any)=>{r.browserReports[0].report.suites[0].specs[0].tests[0].results.unshift({status:'failed'});for(const c of r.commands)if(c.stdout)c.stdout=JSON.stringify(r.browserReports[0].report);},
 ]){const copy=structuredClone(receipt);mutate(copy);expect(()=>browserReceiptEvidence(copy,()=> 'a')).toThrow();}
});
