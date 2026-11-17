// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { qualifyVerifierImage, verifierImageFiles } from './verifier-image';
import { dockerArgs, createDockerLauncher } from '../../../src/lib/analyst-verifier/launcher.mjs';
const id = `sha256:${'a'.repeat(64)}`;
it('qualified verifier pins immutable image and checks image-local worker entrypoint equality', () => {
  const hashes = Object.fromEntries(verifierImageFiles.map(file => [file, 'b'.repeat(64)]));
  const execute = vi.fn((_command: string, args: string[]) => args[0] === 'image'
    ? JSON.stringify([{ Id:id, RepoDigests:[], Config:{ WorkingDir:'/verifier' } }])
    : JSON.stringify(hashes));
  const proof = qualifyVerifierImage('umami-analyst-verifier:local', () => 'b'.repeat(64), execute);
  expect(proof.imageId).toBe(id); expect(proof.fileHashes).toEqual(hashes);
  expect(execute.mock.calls[1][1]).toContain(id);
  expect(dockerArgs('test', id)).toContain(id);
  expect(dockerArgs('test', id)).not.toContain('umami-analyst-verifier:local');
  for (const flag of ['--network','--read-only','--cap-drop','--security-opt']) expect(dockerArgs('test',id)).toContain(flag);
  expect(() => createDockerLauncher({ image:'foreign:mutable' })).toThrow('Invalid verifier image identity');
  expect(() => qualifyVerifierImage('local',()=> 'c'.repeat(64),execute)).toThrow('image source mismatch');
});
