import type { Evidence } from './offline';
export type QualifiedAssertion = { id: string; suite: string; file: string; assertion: string };
const evalFile = (name: string) => `scripts/ai/analyst-evals/${name}`;
const agentFile = 'src/lib/ai/assistant/analyst/analyst.test.ts';
const handlerFile = 'src/lib/ai/assistant/analyst/handlers.test.ts';
const runtimeFile = 'src/lib/ai/assistant/runtime.test.ts';
const bind = (id: string, suite: string, file: string, assertion: string): QualifiedAssertion => ({
  id,
  suite,
  file,
  assertion,
});
export const lifecycleAssertions: QualifiedAssertion[] = [
  bind(
    '10.image',
    'lifecycle-evaluator',
    evalFile('visual-capability.test.ts'),
    'absent image capability keeps screenshots out of the tool result and inspection unavailable',
  ),
  bind(
    '10.preflight',
    'lifecycle-evaluator',
    evalFile('image-capability.test.ts'),
    'preflight denies missing forged failed stale future model endpoint reasoning settings policy and build mismatches',
  ),
  bind(
    '10.render-clipping',
    'lifecycle-evaluator',
    evalFile('docker-visual.test.ts'),
    'Docker Chromium fixture rejects render errors stale revisions desktop clipping and narrow-only clipping without artifacts',
  ),
  bind(
    '10.verifier',
    'lifecycle-product',
    agentFile,
    'without an isolated verifier, render reports visual_pending and never claims verification',
  ),
  bind(
    '10.failure',
    'lifecycle-product',
    handlerFile,
    'render failure with a configured verifier does not complete',
  ),
  bind(
    '10.stale',
    'lifecycle-product',
    handlerFile,
    'a draft revised after readback (stale revision) does not complete',
  ),
  bind(
    '10.expired-release',
    'lifecycle-product',
    runtimeFile,
    'expiry between image tool completion and bridge send returns visual pending without pixels or a success receipt',
  ),
  ...['partial', 'unknown'].map(completeness =>
    bind(
      `10.${completeness}`,
      'lifecycle-product',
      handlerFile,
      `missing image capability cannot complete ${completeness} saved execution with a configured verifier`,
    ),
  ),
  ...[
    ['throws', 'both'],
    ['returns-success', 'both'],
    ['returns-success', 'task-only'],
    ['returns-success', 'signal-only'],
  ].map(([outcome, cancel]) =>
    bind(
      `11.query-${outcome}-${cancel}`,
      'lifecycle-product',
      agentFile,
      `query cancellation propagates abort and late query ${outcome} under ${cancel} cannot revive or mutate the task`,
    ),
  ),
  bind(
    '11.repair',
    'lifecycle-product',
    agentFile,
    'repair cancellation after validation preserves the committed private draft without late provenance',
  ),
  bind(
    '11.commit',
    'lifecycle-product',
    agentFile,
    'cancellation that wins at the commit boundary leaves no board and no late task record',
  ),
  bind(
    '11.fetch',
    'lifecycle-product',
    agentFile,
    'render cancellation during artifact fetch discards pixels and cannot append a receipt or images',
  ),
  bind(
    '11.terminal',
    'lifecycle-product',
    agentFile,
    'terminal tasks are absorbing: pause/resume/block/late updates never revive them',
  ),
  bind(
    '11.provenance',
    'lifecycle-product',
    agentFile,
    'terminal task data is immutable: late callbacks cannot append provenance or context',
  ),
  bind(
    '11.queue-render',
    'lifecycle-evaluator',
    evalFile('dispatcher-cancel.test.ts'),
    'queue cancellation never launches the cancelled job and active-render late results cannot release artifacts',
  ),
  bind(
    '11.artifact',
    'lifecycle-evaluator',
    evalFile('dispatcher-cancel.test.ts'),
    'cancellation while artifact storage awaits discards late pixels and never resolves a render receipt',
  ),
  bind(
    '11.transport',
    'lifecycle-product',
    runtimeFile,
    'round-trips maximal 6×1 MiB images and keeps them out of session, parts and diagnostics',
  ),
  bind(
    '12.native',
    'lifecycle-evaluator',
    evalFile('compatibility.test.tsx'),
    'flags off preserves native board configuration reference source and renderer props',
  ),
  bind(
    '12.snapshot',
    'lifecycle-evaluator',
    evalFile('compatibility.test.tsx'),
    'flags off historical snapshot keeps fixed Jakarta buckets filters and numbers without live execution',
  ),
  bind(
    '12.host',
    'lifecycle-product',
    handlerFile,
    'flag off: no task is created and analyst tools are not executed by the host',
  ),
];
export const lifecycleBrowserAssertions = [
  bind(
    '10.actual-render',
    'lifecycle-browser',
    'tests/e2e/analyst-verifier-integration.spec.ts',
    'built actual native + AnalysisWidget path: exact receipts; stale/failed/direct HTTP denied',
  ),
  bind(
    '11.browser-cancel',
    'lifecycle-browser',
    'tests/e2e/analyst-lifecycle.spec.ts',
    'cancel: Stop ends the turn and the task never shows complete',
  ),
  bind(
    '12.flags-widget',
    'lifecycle-browser',
    'tests/e2e/analyst-lifecycle.spec.ts',
    'flags off: creation disabled, existing saved widget still executes',
  ),
  bind(
    '12.browser-native-snapshot',
    'lifecycle-browser',
    'tests/e2e/analyst-compatibility.spec.ts',
    'flags off browser preserves native board and persisted historical snapshot without live analysis execution',
  ),
];
export const lifecycleApiAssertions = [
  ['11.cancelled', 'cancelled task: fenced bundle commits no board/analysis/operation'],
  [
    '11.commit-provenance',
    'winning commit records provenance in-transaction; cancelled task rejects late writes',
  ],
  ['11.linearizations', 'both cancel-won and commit-won linearizations observed'],
  ...Array.from({ length: 6 }, (_, round) => [
    `11.race-${round}`,
    `${['cancel-first', 'commit-first', 'concurrent'][round % 3]} cancel/commit round ${round} is all-or-nothing; cancel stays terminal`,
  ]),
  ...Array.from({ length: 6 }, (_, round) => [
    `11.no-revival-${round}`,
    `round ${round}: pause/resume/ensureTask after cancel do not revive the task`,
  ]),
].map(([id, assertion]) => ({ id, assertion }));

function collect(
  bindings: QualifiedAssertion[],
  accept: (binding: QualifiedAssertion) => boolean,
): Evidence[] {
  return [...new Set(bindings.map(b => b.suite))].map(suite => ({
    suite,
    passed: bindings.some(b => b.suite === suite && accept(b)),
    assertions: bindings.filter(b => b.suite === suite && accept(b)).map(b => b.assertion),
  }));
}
export function qualifiedVitestEvidence(
  report: any,
  commandPassed: boolean,
  bindings = lifecycleAssertions,
): Evidence[] {
  return collect(
    bindings,
    binding =>
      commandPassed &&
      report?.success === true &&
      report?.testResults?.some(
        (file: any) =>
          typeof file.name === 'string' &&
          file.name.endsWith(`/${binding.file}`) &&
          file.assertionResults?.some(
            (a: any) => a.fullName === binding.assertion && a.status === 'passed',
          ),
      ) === true,
  );
}
export function qualifiedBrowserEvidence(
  report: any,
  commandPassed: boolean,
  bindings = lifecycleBrowserAssertions,
): Evidence[] {
  const specs: any[] = [];
  const visit = (suite: any) => {
    specs.push(...(suite.specs ?? []));
    for (const child of suite.suites ?? []) visit(child);
  };
  for (const suite of report?.suites ?? []) visit(suite);
  return collect(
    bindings,
    binding =>
      commandPassed &&
      Array.isArray(report?.errors) &&
      report.errors.length === 0 &&
      specs.some(
        spec =>
          (spec.file === binding.file || `tests/e2e/${spec.file}` === binding.file) &&
          spec.title === binding.assertion &&
          spec.tests?.length > 0 &&
          spec.tests.every(
            (test: any) =>
              test.expectedStatus === 'passed' &&
              test.results?.length === 1 &&
              test.results[0].status === 'passed',
          ),
      ),
  );
}
