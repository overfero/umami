import assert from 'node:assert/strict';

// Acceptance fixture, scripted independently of assistant/model output. Taxonomy alone
// cannot distinguish success from an attempt; no discoverable identifiers are requested.
export const clarification = {
  question:
    'Does the observed login event mean a successful staff sign-in, or only a sign-in attempt?',
  options: [
    'Successful staff sign-in',
    'Sign-in attempt',
    'Unknown: keep the observed login label',
  ],
} as const;

type Counts = { boards: number; analyses: number; revisions: number; operations: number };
export function assertNeedsInput(observed: {
  part: { type: string; question: string; options?: readonly string[]; state: string };
  taskStatus: string;
  before: Counts;
  after: Counts;
}): 'needs_input' {
  assert.equal(observed.part.type, 'question');
  assert.equal(observed.part.question, clarification.question);
  assert.deepEqual(observed.part.options, [...clarification.options]);
  assert.equal(observed.part.state, 'pending');
  assert.equal(observed.taskStatus, 'awaiting_user');
  assert.deepEqual(observed.after, observed.before);
  // Evaluation outcome (§UX), not a fictional persisted task-status enum.
  return 'needs_input';
}
