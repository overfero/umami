// Deliberately no CLI, network implementation, credential loading or receipt writer.
// The separately approved live lane supplies a metered adapter and an independently expected
// synthetic challenge. Its output is evidence for operator review, never an automatic grant.
import { createHash } from 'node:crypto';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export async function executeVisionChallenge({ configuration, challenge, invoke }) {
  if (
    typeof invoke !== 'function' ||
    !Buffer.isBuffer(challenge?.bytes) ||
    !challenge.bytes.length ||
    challenge.bytes.length > 1024 * 1024 ||
    !['image/png', 'image/jpeg'].includes(challenge.mime) ||
    typeof challenge.prompt !== 'string' ||
    !challenge.prompt.trim() ||
    typeof challenge.expectedAnswer !== 'string' ||
    !challenge.expectedAnswer.trim()
  )
    throw new Error('Invalid preflight challenge');
  const startedAt = Date.now();
  const response = await invoke({
    configuration: structuredClone(configuration),
    prompt: challenge.prompt,
    image: { mime: challenge.mime, bytes: Buffer.from(challenge.bytes) },
  });
  if (
    typeof response?.answer !== 'string' ||
    response.answer.length > 32768 ||
    !Number.isFinite(response.costUsd) ||
    response.costUsd < 0 ||
    !response.usage ||
    typeof response.usage !== 'object'
  )
    throw new Error('Invalid preflight measurement');
  const evidence = {
    schemaVersion: 1,
    configuration: structuredClone(configuration),
    startedAt,
    completedAt: Date.now(),
    outcome: response.answer.trim() === challenge.expectedAnswer.trim() ? 'passed' : 'failed',
    challengeSha256: sha(challenge.bytes),
    responseSha256: sha(response.answer),
    promptSha256: sha(challenge.prompt),
    expectedAnswerSha256: sha(challenge.expectedAnswer),
    costUsd: response.costUsd,
    usage: response.usage,
  };
  return { ...evidence, evidenceSha256: sha(JSON.stringify(evidence)) };
}
