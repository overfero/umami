import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
export const browserCommandSpecs = [
  {id:'browser-on',file:'tests/e2e/analyst-lifecycle.spec.ts',extra:['--grep-invert','flags off:']},
  {id:'browser-off',file:'tests/e2e/analyst-lifecycle.spec.ts',extra:['--grep','flags off:']},
  {id:'browser-compat',file:'tests/e2e/analyst-compatibility.spec.ts',extra:[]},
  {id:'browser-b3',file:'tests/e2e/analyst-verifier-integration.spec.ts',extra:[]},
  {id:'browser-notice',file:'tests/e2e/analyst-update-notice.spec.ts',extra:[]},
];
export const expectedBrowserArgs = (spec: typeof browserCommandSpecs[number]) => [
  'test','-c','playwright.config.ts',spec.file,...spec.extra,'--workers=1','--reporter=json','--global-timeout=360000',
];
/** Structural operator-evidence binding, not cryptographic authenticity. */
export function pairedBrowserReports(receipt:any) {
  assert.ok(typeof receipt.checkoutRoot==='string'&&path.isAbsolute(receipt.checkoutRoot),'missing command checkout root');
  assert.ok(Array.isArray(receipt.commands)&&Array.isArray(receipt.browserReports),'missing command/report pairs');
  const expectedIds=['browser-prisma','browser-build',...browserCommandSpecs.map(s=>s.id)];
  assert.deepEqual(receipt.commands.map((c:any)=>c.id).sort(),[...expectedIds].sort(),'missing duplicate or unexpected command IDs');
  assert.deepEqual(receipt.browserReports.map((r:any)=>r.commandId).sort(),browserCommandSpecs.map(s=>s.id).sort(),'missing duplicate or unexpected report IDs');
  for(const command of receipt.commands) {
    assert.equal(command.exitCode,0,`command failed ${command.id}`);
    assert.equal(command.timedOut,false,`command timeout ${command.id}`);
  }
  for(const [id,tool,args] of [['browser-prisma','prisma',['generate']],['browser-build','next',['build','--webpack']]] as const) {
    const command=receipt.commands.find((c:any)=>c.id===id);
    assert.equal(command.executable,path.join(receipt.checkoutRoot,'node_modules/.bin',tool));
    assert.deepEqual(command.args,args);
  }
  return browserCommandSpecs.map(spec=>{
    const command=receipt.commands.find((c:any)=>c.id===spec.id);
    const entry=receipt.browserReports.find((r:any)=>r.commandId===spec.id);
    assert.equal(command.executable,path.join(receipt.checkoutRoot,'node_modules/.bin/playwright'),'wrong browser executable');
    assert.deepEqual(command.args,expectedBrowserArgs(spec),'wrong browser arguments');
    assert.equal(typeof command.stdout,'string','missing retained stdout');
    const parsed=JSON.parse(command.stdout);
    assert.ok(isDeepStrictEqual(parsed,entry.report),'report differs from paired stdout');
    return {report:parsed,commandPassed:command.exitCode===0&&!command.timedOut};
  });
}
