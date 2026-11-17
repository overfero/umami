import { expect, it } from 'vitest';
import { assertStaffDashboard } from './staff-dashboard';

function fixture() {
  const expected = ['product-series', 'ops-series', 'product-users', 'ops-users'].map((id, i) => ({
    widgetId: `staff-${i}`, analysisId: id, definitionHash: `hash-${i}`, revision: 1,
    values: i === 0 ? [3, 2, 0] : i === 1 ? [1, 0, 0] : i === 2 ? [2] : [1],
  }));
  return {
    expected,
    parameters: { rows: [{ columns: expected.map(e => ({ id: e.widgetId, component: { type: 'AnalysisWidget', props: { analysisId: e.analysisId } } })) }] },
    readback: { ok: true, data: { analyses: expected.map(e => ({ ...e, matchesIntent: true, execution: { executionId: `read-${e.analysisId}`, completeness: 'complete', returned: e.values.length } })) } },
    executions: expected.map(e => ({ status: 200, body: { definition: { id: e.analysisId, revision: e.revision, definitionHash: e.definitionHash }, definitionHash: e.definitionHash, completeness: 'complete', rows: e.values.map(value => ({ value })) } })),
  };
}

it('accepts only the exact four persisted staff bindings with successful matching readback and results', () => {
  expect(() => assertStaffDashboard(fixture())).not.toThrow();
});

it('rejects duplicated/wrong persisted widget binding and non-distinct intended analysis IDs', () => {
  const duplicate = fixture();
  duplicate.parameters.rows[0].columns[1].component.props.analysisId = duplicate.expected[0].analysisId;
  expect(() => assertStaffDashboard(duplicate)).toThrow();
  const wrong = fixture();
  [wrong.parameters.rows[0].columns[0].component.props.analysisId, wrong.parameters.rows[0].columns[1].component.props.analysisId] = [wrong.expected[1].analysisId, wrong.expected[0].analysisId];
  expect(() => assertStaffDashboard(wrong)).toThrow();
  const intended = fixture();
  intended.expected[1].analysisId = intended.expected[0].analysisId;
  expect(() => assertStaffDashboard(intended)).toThrow();
});

it('rejects per-widget failed/denied execution, mismatched intent/hash, and incorrect actual results', () => {
  for (const mutate of [
    (f: any) => { f.readback.data.analyses[1].execution = { ok: false, code: 'denied' }; },
    (f: any) => { f.readback.data.analyses[1].state = 'denied'; },
    (f: any) => { f.readback.data.analyses[1].matchesIntent = false; },
    (f: any) => { f.readback.data.analyses[1].definitionHash = 'wrong'; },
    (f: any) => { f.readback.data.analyses[1].analysisId = f.expected[0].analysisId; },
    (f: any) => { f.executions[1].status = 403; },
    (f: any) => { f.executions[1].body.rows[0].value = 99; },
  ]) {
    const data = fixture(); mutate(data);
    expect(() => assertStaffDashboard(data)).toThrow();
  }
});
