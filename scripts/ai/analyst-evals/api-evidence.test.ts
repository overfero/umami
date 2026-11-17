import { expect, it } from 'vitest';
import { apiEvidence } from './offline';

it('requires API completion marker and matching numbered assertions, not an arbitrary green exit', () => {
  expect(apiEvidence('postgres', '  ok 1 one\n').passed).toBe(false);
  expect(apiEvidence('postgres', 'PASS postgresql: 114 checks\n').passed).toBe(false);
  expect(apiEvidence('postgres', '  ok 1 one\nPASS postgresql: 1 checks\n').passed).toBe(false);
  const output = Array.from({ length: 60 }, (_, i) => `  ok ${i + 1} assertion ${i + 1}`).join(
    '\n',
  );
  expect(apiEvidence('postgres', `${output}\nPASS postgresql: 60 checks\n`).passed).toBe(true);
  expect(apiEvidence('clickhouse', `${output}\nPASS postgresql: 60 checks\n`).passed).toBe(false);
});
