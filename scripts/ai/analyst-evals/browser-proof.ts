/* eslint-disable no-console */
// Fresh sanitized production build + real browser/Docker evidence; no model/provider calls.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, createWriteStream, cpSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { sanitizedProject, fixtureEnv, writeReceipt } from '../analyst-fixture/app.mjs';
import { provisionFixtureDatabase, cleanupFixtureDatabase } from '../analyst-fixture/database.mjs';
import { browserFingerprintedFiles } from './browser-receipt';
import { qualifiedBrowserEvidence, lifecycleBrowserAssertions } from './lifecycle-evidence';

export async function runBrowserProof(outputPath: string) {
  const root = process.cwd();
  const directory = path.dirname(path.resolve(outputPath));
  mkdirSync(directory, { recursive: true });
  const digest = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex');
  const commands: any[] = [];
  const browserReports: any[] = [];
  const checkpoint = (extra: any = {}) => writeFileSync(outputPath, JSON.stringify({ complete:false, commands, browserReports, ...extra },null,2)+'\n');
  async function command(executable: string, args: string[], cwd: string, env: any, name: string, timeout: number) {
    const stdoutPath=path.join(directory,`${name}.stdout`), stderrPath=path.join(directory,`${name}.stderr`);
    const stdout=createWriteStream(stdoutPath),stderr=createWriteStream(stderrPath);
    const child=spawn(executable,args,{cwd,env,stdio:['ignore','pipe','pipe']});
    child.stdout.pipe(stdout);child.stderr.pipe(stderr);
    let timedOut=false;
    const timer=setTimeout(()=>{timedOut=true;child.kill('SIGTERM');setTimeout(()=>child.kill('SIGKILL'),3000).unref();},timeout);
    const code=await new Promise<number|null>((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});
    clearTimeout(timer);await Promise.all([new Promise(r=>stdout.end(r)),new Promise(r=>stderr.end(r))]);
    commands.push({ executable, args, name, exitCode:code, timedOut, stdout:readFileSync(stdoutPath,'utf8'), stderr:readFileSync(stderrPath,'utf8') });checkpoint();
    assert.equal(timedOut,false,`${name} timed out`);assert.equal(code,0,`${name} failed; see incremental logs`);
    return stdoutPath;
  }
  const nonce=randomBytes(32).toString('hex');
  const dir=sanitizedProject(root,nonce);
  let databaseUrl: string|undefined;
  let active: ReturnType<typeof spawn>|undefined;
  let cleanupCompleted=false;
  const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const source=`https://github.com/giovannirandykusuma/umami/tree/${head}`;
  const piRoot='/home/overfero/Project/ocbc/umami/.scratch/analyst-ci-debug/pi-global/lib/node_modules/@earendil-works/pi-coding-agent';
  const sourceHashes=Object.fromEntries(browserFingerprintedFiles().map(f=>[f,digest(f)]));
  const stop=async()=>{if(active){const process=active;active=undefined;process.kill('SIGTERM');await new Promise<void>(resolve=>{if(process.exitCode!==null)return resolve();const t=setTimeout(()=>{process.kill('SIGKILL');resolve();},5000);process.once('exit',()=>{clearTimeout(t);resolve();});});}};
  try {
    databaseUrl=provisionFixtureDatabase(dir,nonce.slice(0,24));
    writeReceipt(dir,nonce,undefined,databaseUrl);
    const env: NodeJS.ProcessEnv={...fixtureEnv({dir,port:'3363',nonce,piRoot,verifier:true,built:true,databaseUrl}),NODE_ENV:'production'};
    env.NEXT_PUBLIC_SOURCE_URL=source;
    await command(path.join(root,'node_modules/.bin/prisma'),['generate'],dir,env,'browser-prisma',60000);
    await command(path.join(root,'node_modules/.bin/next'),['build','--webpack'],dir,{...env,NODE_OPTIONS:'--max-old-space-size=4096',BUILD_WORKERS:'1'},'browser-build',600000);
    const buildId=readFileSync(path.join(dir,'.next/BUILD_ID'),'utf8').trim();
    writeReceipt(dir,nonce,buildId,databaseUrl);
    const standalone=path.join(dir,'.next/standalone');
    assert.equal(readFileSync(path.join(standalone,'generated/analyst-image-policy.json'),'utf8'),readFileSync(path.join(dir,'generated/analyst-image-policy.json'),'utf8'));
    assert.equal(JSON.parse(readFileSync(path.join(standalone,'generated/analyst-image-policy.json'),'utf8')).buildId,buildId);
    // Docker's production image copies scripts/public/static separately. Reproduce ONLY those
    // declared copies in this worktree-owned artifact. Shared node_modules stays explicit.
    cpSync(path.join(dir,'scripts'),path.join(standalone,'scripts'),{recursive:true});
    cpSync(path.join(dir,'public'),path.join(standalone,'public'),{recursive:true});
    cpSync(path.join(dir,'.next/static'),path.join(standalone,'.next/static'),{recursive:true});
    mkdirSync(path.join(standalone,'.home'),{recursive:true});
    // Keep the independently guarded fixture in its launcher-owned root; standalone is used
    // below for default-capability-off authenticated route validation, never as a live grant.
    async function start(off: boolean, standaloneMode=false) {
      await stop();
      const serverEnv: NodeJS.ProcessEnv={...fixtureEnv({dir,port:'3363',nonce,piRoot,verifier:true,built:true,databaseUrl:databaseUrl!,flagsOff:off}),NODE_ENV:'production'};
      serverEnv.NEXT_PUBLIC_SOURCE_URL=source;
      const log=createWriteStream(path.join(directory,`browser-server-${off?'off':standaloneMode?'standalone':'on'}.log`));
      active=spawn(standaloneMode?process.execPath:path.join(root,'node_modules/.bin/next'),standaloneMode?['server.js']:['start','--hostname','127.0.0.1','--port','3363'],{
        cwd:standaloneMode?standalone:dir,env:{...serverEnv,HOSTNAME:'127.0.0.1'},stdio:['ignore','pipe','pipe'],
      });active.stdout!.pipe(log);active.stderr!.pipe(log);
      await new Promise(r=>setTimeout(r,3500));
      assert.equal(active.exitCode,null,'browser server exited before test');
    }
    const testEnv={PATH:process.env.PATH,HOME:process.env.HOME,PG_BIN:process.env.PG_BIN,PLAYWRIGHT_BROWSERS_PATH:'/home/overfero/.cache/ms-playwright',PLAYWRIGHT_SKIP_WEB_SERVER:'1',PLAYWRIGHT_BASE_URL:'http://127.0.0.1:3363',ANALYST_PHASE_FILE:path.join(directory,'browser-phase.json')};
    async function browser(file: string,name: string,extra: string[]=[],extraEnv:any={}) {
      const output=await command(path.join(root,'node_modules/.bin/playwright'),['test','-c','playwright.config.ts',file,...extra,'--workers=1','--reporter=json','--global-timeout=360000'],root,{...testEnv,...extraEnv},name,390000);
      browserReports.push({report:JSON.parse(readFileSync(output,'utf8')),commandPassed:true,name});checkpoint();
    }
    await start(false);
    await browser('tests/e2e/analyst-lifecycle.spec.ts','browser-on',['--grep-invert','flags off:']);
    await stop();await start(true);
    await browser('tests/e2e/analyst-lifecycle.spec.ts','browser-off',['--grep','flags off:'],{ANALYST_FLAGS_OFF_PHASE:'1',ANALYST_FLAGS_OFF_ORIGIN:'http://127.0.0.1:3363'});
    await browser('tests/e2e/analyst-compatibility.spec.ts','browser-compat',[],{DATABASE_URL:databaseUrl,ANALYST_FLAGS_OFF_PHASE:'1'});
    await stop();
    await browser('tests/e2e/analyst-verifier-integration.spec.ts','browser-b3',[],{...env,ANALYST_VERIFIER_BUILD:dir});
    await start(false);
    await browser('tests/e2e/analyst-update-notice.spec.ts','browser-notice');
    await stop();
    // Default unavailable context in standalone (no fixture opt-in and no live provider).
    const standaloneEnv={...env};
    for(const key of ['AI_OFFLINE_FIXTURE','AI_OFFLINE_FIXTURE_NONCE','AI_PI_ROOT'])delete standaloneEnv[key];
    const serverLog=createWriteStream(path.join(directory,'standalone-capability.log'));
    active=spawn(process.execPath,['server.js'],{cwd:standalone,env:{...standaloneEnv,HOSTNAME:'127.0.0.1'},stdio:['ignore','pipe','pipe']});active.stdout!.pipe(serverLog);active.stderr!.pipe(serverLog);
    await new Promise(r=>setTimeout(r,3500));
    const login=await fetch('http://127.0.0.1:3363/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'admin',password:'umami'})});assert.equal(login.status,200);
    const auth=await login.json();const headers={authorization:`Bearer ${auth.token}`,'content-type':'application/json'};
    const created=await fetch('http://127.0.0.1:3363/api/ai/assistant/chats',{method:'POST',headers,body:JSON.stringify({title:'Standalone capability default-off'})});assert.equal(created.status,200);const chat=await created.json();
    const turn=await fetch(`http://127.0.0.1:3363/api/ai/assistant/chats/${chat.id}/turn`,{method:'POST',headers,body:JSON.stringify({message:'No preflight, no model calls'})});assert.equal(turn.status,200);const text=await turn.text();
    assert.ok(!text.includes('"type":"image"')&&!text.includes('umamiImageEnvelope'));
    assert.ok(!text.includes('rendered_not_inspected')&&!text.includes('"status":"complete"'));
    await stop();
    const missingTraces=commands.find(c=>c.name==='browser-build')?.stderr.split('\n').filter((line:string)=>line.startsWith('  - '))??[];
    const evidence=browserReports.flatMap(({report,commandPassed})=>qualifiedBrowserEvidence(report,commandPassed));
    const assertions=lifecycleBrowserAssertions.filter(b=>evidence.some(e=>e.suite===b.suite&&e.assertions.includes(b.assertion))).map(b=>b.assertion);
    assert.equal(assertions.length,lifecycleBrowserAssertions.length,'missing browser requirement');
    const receipt=JSON.parse(readFileSync(path.join(dir,'.analyst-fixture-receipt.json'),'utf8'));
    cleanupFixtureDatabase(databaseUrl,receipt);cleanupCompleted=true;
    const report={complete:true,sourceRevision:head,sourceHashes,buildId,policySha256:digest(path.join(dir,'generated/analyst-image-policy.json')),commands,browserReports,
      evidence:[{suite:'lifecycle-browser',passed:true,assertions}],standalone:{manifestEqual:true,buildIdEqual:true,authenticatedChatAndTurn:true,missingPreflightNoImages:true},
      missingTraces,cleanupCompleted,limitations:['Shared dependency links and excluded external traces: not hermetic deployment proof.','Standalone default-off turn has AI disabled; proves authenticated route/no release, not configured-provider capability or successful data execution.','Synthetic native Pi/provider and real Docker/browser; no live reasoning or image understanding.']};
    writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n');return report;
  } finally {
    await stop();
    if(databaseUrl&&!cleanupCompleted){const receipt=JSON.parse(readFileSync(path.join(dir,'.analyst-fixture-receipt.json'),'utf8'));cleanupFixtureDatabase(databaseUrl,receipt);}
  }
}
if(process.argv[1]?.endsWith('browser-proof.ts'))runBrowserProof(process.argv[2]??'/tmp/analyst-browser-proof.json').catch(error=>{console.error(error);process.exitCode=1;});
