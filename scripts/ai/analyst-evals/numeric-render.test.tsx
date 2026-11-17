import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { AnalysisWidget } from '@/app/(main)/boards/AnalysisWidget';

const query = vi.hoisted(() => ({ data: null as any }));
vi.mock('@/components/hooks/queries/useAnalysisQuery', () => ({
  useAnalysisExecutionQuery: () => ({ data: query.data, refetch: vi.fn() }),
}));
vi.mock('@/components/charts/Chart', () => ({ Chart: () => <div data-test="chart" /> }));
vi.mock('@umami/react-zen', () => ({
  useTheme: () => ({ theme: 'light' }),
  Button: ({ children, onPress }: any) => <button onClick={onPress}>{children}</button>,
  Column: ({ children, role, ...props }: any) => (
    <div role={role} aria-label={props['aria-label']}>
      {children}
    </div>
  ),
  Row: ({ children }: any) => <div>{children}</div>,
  Text: ({ children, role }: any) => <span role={role}>{children}</span>,
}));

it('numeric aggregate metric/table renders exact value, zero and unavailable without a series', () => {
  // Component-only seam: injected execution envelopes, not DB/browser/image evidence.
  query.data = {
    executionId: 'numeric-render',
    definitionHash: 'h',
    executedAt: Date.UTC(2026, 0, 5),
    operation: 'numeric_property',
    metric: 'sum',
    unit: 'units',
    range: {
      startAt: Date.UTC(2026, 0, 1),
      endAt: Date.UTC(2026, 0, 4),
      timezone: 'UTC',
      policy: { type: 'fixed' },
    },
    semanticBinding: {
      label: 'Observed amount',
      unit: 'units',
      population: 'purchase occurrences',
      meaningSource: 'observed_only',
    },
    columns: [
      { key: 'metric', label: 'Metric', type: 'string' },
      { key: 'value', label: 'Amount', type: 'number' },
      { key: 'count', label: 'Numeric values', type: 'number' },
    ],
    rows: [{ metric: 'sum', value: 40, count: 3 }],
    completeness: 'complete',
    reasons: [],
    warnings: [],
  };
  const view = render(<AnalysisWidget analysisId="numeric" visualization="metric" />);
  expect(screen.getByText('40')).toBeTruthy();
  view.rerender(<AnalysisWidget analysisId="numeric" visualization="table" />);
  expect(screen.getByRole('table')).toBeTruthy();
  expect(screen.getByRole('cell', { name: '40' })).toBeTruthy();
  expect(screen.getByRole('cell', { name: '3' })).toBeTruthy();
  query.data = { ...query.data, rows: [{ metric: 'sum', value: 0, count: 1 }] };
  view.rerender(<AnalysisWidget analysisId="numeric" visualization="metric" />);
  expect(screen.getByText('0')).toBeTruthy();
  query.data = { ...query.data, rows: [{ metric: 'sum', value: null, count: 0 }] };
  view.rerender(<AnalysisWidget analysisId="numeric" visualization="metric" />);
  expect(screen.getByText('Unavailable')).toBeTruthy();
  expect(screen.queryByText('0')).toBeNull();
  view.rerender(<AnalysisWidget analysisId="numeric" visualization="line" />);
  expect(screen.getByRole('note').textContent).toContain(
    'line cannot represent a numeric_property result',
  );
  expect(screen.getByRole('table')).toBeTruthy();
  expect(screen.queryByTestId('chart')).toBeNull();
});
