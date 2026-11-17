// @vitest-environment node
import { expect, it } from 'vitest';
import { executeVisionChallenge } from '../vision-preflight.mjs';
it('preflight executes an image challenge via an explicit adapter and retains failed outcomes without issuing grants', async () => {
  const configuration = { provider: 'synthetic', model: 'contract-only' };
  const challenge = {
    mime: 'image/png',
    bytes: Buffer.from('synthetic-only-not-a-real-image'),
    expectedAnswer: 'blue triangle',
    prompt: 'Describe the shape and color.',
  };
  const result = await executeVisionChallenge({
    configuration,
    challenge,
    invoke: async request => {
      expect(request.image.bytes).toEqual(challenge.bytes);
      return { answer: 'red square', costUsd: 0, usage: { input: 1, output: 2 } };
    },
  });
  expect(result.outcome).toBe('failed');
  expect(result).not.toHaveProperty('capability');
  expect(result).not.toHaveProperty('receipt');
  expect(JSON.stringify(result)).not.toContain(challenge.bytes.toString('base64'));
  expect(result.challengeSha256).toMatch(/^[a-f0-9]{64}$/);
});
it('preflight refuses missing cost and unknown answers rather than fabricating a successful receipt', async () => {
  const input = {
    configuration: {},
    challenge: {
      mime: 'image/png',
      bytes: Buffer.from('synthetic'),
      expectedAnswer: 'blue triangle',
      prompt: 'Describe',
    },
  };
  await expect(
    executeVisionChallenge({ ...input, invoke: async () => ({ answer: 'blue triangle' }) }),
  ).rejects.toThrow('Invalid preflight measurement');
  const result = await executeVisionChallenge({
    ...input,
    invoke: async () => ({ answer: 'blue triangle', costUsd: 0, usage: {} }),
  });
  expect(result.outcome).toBe('passed');
  expect(result.configuration).toEqual({});
  expect(result).not.toHaveProperty('receipt');
});
