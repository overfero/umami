import assert from 'node:assert/strict';

type StaffExpectation = {
  widgetId: string;
  analysisId: string;
  definitionHash: string;
  revision: number;
  values: number[];
};

/** One acceptance assertion shared by the real supplement and mutation negative controls. */
export function assertStaffDashboard(input: {
  expected: StaffExpectation[];
  parameters: any;
  readback: any;
  executions: { status: number; body: any }[];
}) {
  const { expected, parameters, readback, executions } = input;
  assert.equal(expected.length, 4);
  assert.equal(new Set(expected.map(e => e.analysisId)).size, 4, 'four distinct intended analyses');
  const columns = parameters.rows.flatMap((row: any) => row.columns);
  assert.deepEqual(columns.map((c: any) => ({ widgetId: c.id, analysisId: c.component.props.analysisId })),
    expected.map(e => ({ widgetId: e.widgetId, analysisId: e.analysisId })), 'persisted widget bindings');
  assert.ok(columns.every((c: any) => c.component.type === 'AnalysisWidget'));
  assert.equal(readback.ok, true);
  assert.equal(readback.data.analyses.length, 4);
  assert.equal(executions.length, 4);
  for (const [i, e] of expected.entries()) {
    const entries = readback.data.analyses.filter((r: any) => r.widgetId === e.widgetId);
    assert.equal(entries.length, 1, `one readback per ${e.widgetId}`);
    const r = entries[0];
    assert.equal(r.analysisId, e.analysisId);
    assert.equal(r.definitionHash, e.definitionHash);
    assert.equal(r.revision, e.revision);
    assert.equal(r.matchesIntent, true);
    assert.equal(r.state, undefined, 'no denied entry');
    assert.equal(r.execution.ok, undefined, 'readback execution is not a structured failure');
    assert.equal(typeof r.execution.executionId, 'string');
    assert.ok(r.execution.executionId.length > 0);
    assert.equal(r.execution.completeness, 'complete');
    assert.equal(r.execution.returned, e.values.length);
    const result = executions[i];
    assert.equal(result.status, 200);
    assert.deepEqual(result.body.definition, { id: e.analysisId, revision: e.revision, definitionHash: e.definitionHash });
    assert.equal(result.body.definitionHash, e.definitionHash);
    assert.equal(result.body.completeness, 'complete');
    assert.deepEqual(result.body.rows.map((row: any) => row.y ?? row.value), e.values, e.widgetId);
  }
}
