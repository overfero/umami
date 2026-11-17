import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
export const verifierImageFiles = [
  'src/lib/analyst-verifier/worker.mjs',
  'src/lib/analyst-verifier/images.mjs',
  'scripts/ai/verifier/container-worker.mjs',
];
export const verifierBuildFiles = ['deploy/analyst-verifier/Dockerfile.verifier','scripts/ai/verifier/build-image.sh'];
export function qualifyVerifierImage(reference:string, hash:(file:string)=>string,
  execute:(command:string,args:string[])=>string = (command,args)=>execFileSync(command,args,{encoding:'utf8',timeout:30000,maxBuffer:1024*1024})) {
  const [inspect] = JSON.parse(execute('docker',['image','inspect',reference]));
  assert.match(inspect.Id,/^sha256:[a-f0-9]{64}$/,'immutable verifier image required');
  const script=`const fs=require('node:fs'),crypto=require('node:crypto');console.log(JSON.stringify(Object.fromEntries(${JSON.stringify(verifierImageFiles)}.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync('/verifier/'+f)).digest('hex')]))));`;
  const fileHashes=JSON.parse(execute('docker',['run','--rm','--network','none','--user','10001:10001','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges',inspect.Id,'node','-e',script]));
  for(const file of verifierImageFiles)assert.equal(fileHashes[file],hash(file),`image source mismatch ${file}`);
  return {imageId:inspect.Id,repoDigests:inspect.RepoDigests??[],fileHashes,
    buildDefinitionHashes:Object.fromEntries(verifierBuildFiles.map(file=>[file,hash(file)])),
    buildProvenance:'Existing local image: copied worker/entrypoint bytes verified. Original Dockerfile/base build correspondence is not independently established; current build definitions fingerprinted, not retrospectively attested.'};
}
