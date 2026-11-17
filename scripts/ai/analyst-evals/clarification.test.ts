import { expect, it } from 'vitest';
import { assertNeedsInput, clarification } from './clarification';

it('needs_input requires the meaningful bounded question, persisted wait and unchanged semantics', () => {
  const observed = {
    part: {
      type: 'question',
      question: clarification.question,
      options: [...clarification.options],
      state: 'pending',
    },
    taskStatus: 'awaiting_user',
    before: { boards: 1, analyses: 1, revisions: 0, operations: 0 },
    after: { boards: 1, analyses: 1, revisions: 0, operations: 0 },
  };
  expect(assertNeedsInput(observed)).toBe('needs_input');
  for (const mutation of [
    { part: { ...observed.part, question: 'Which website ID?' } },
    { part: { ...observed.part, question: 'login' } },
    { part: { ...observed.part, options: ['success'] } },
    { part: { ...observed.part, state: 'answered' } },
    { taskStatus: 'complete' },
    { after: { ...observed.after, analyses: 2 } },
  ])
    expect(() => assertNeedsInput({ ...observed, ...mutation })).toThrow();
});
