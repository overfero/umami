import { expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultChart } from '../../../src/app/(main)/assistant/ResultChart';
import { BoardComponentRenderer } from '../../../src/app/(main)/boards/[boardId]/BoardComponentRenderer';
import { getBoardEntityIds } from '@/lib/boards';
import type { AssistantPart } from '@/lib/ai/assistant/protocol';
const chart = vi.hoisted(() => vi.fn((_props: any) => <div data-test="native-chart" />));
vi.mock('@/components/charts/Chart', () => ({ Chart: chart }));
vi.mock('@umami/react-zen', () => ({
  useTheme: () => ({ theme: 'light' }),
  Button: ({ onPress, children }: any) => <button onClick={onPress}>{children}</button>,
}));
// Native renderer component injected, registry selection and persisted config unchanged.
vi.mock('../../../src/app/(main)/boards/boardComponentRegistry', () => ({
  getComponentDefinition: (type: string) =>
    type === 'WebsiteChart' ? { component: chart, requiresWebsite: true } : undefined,
}));
afterEach(() => {
  vi.unstubAllEnvs();
});
it('flags off preserves native board configuration reference source and renderer props', () => {
  vi.stubEnv('AI_ANALYST_ENABLED', 'false');
  vi.stubEnv('AI_ANALYST_VERIFIER_ENABLED', 'false');
  const config = { type: 'WebsiteChart', props: { metric: 'pageviews', unit: 'day' } };
  const board = {
    type: 'website',
    parameters: {
      websiteId: 'native-site',
      rows: [{ id: 'row', columns: [{ id: 'column', component: config }] }],
    },
  };
  const before = structuredClone(board);
  render(<BoardComponentRenderer config={config} websiteId="native-site" entityType="website" />);
  expect(chart.mock.calls.at(-1)![0]).toMatchObject({
    websiteId: 'native-site',
    metric: 'pageviews',
    unit: 'day',
  });
  expect(getBoardEntityIds(board)).toEqual({
    websiteIds: ['native-site'],
    pixelIds: [],
    linkIds: [],
  });
  expect(board).toEqual(before);
});
it('flags off historical snapshot keeps fixed Jakarta buckets filters and numbers without live execution', () => {
  vi.stubEnv('AI_ANALYST_ENABLED', 'false');
  vi.stubEnv('AI_ANALYST_VERIFIER_ENABLED', 'false');
  const fetch = vi
    .spyOn(globalThis, 'fetch')
    .mockRejectedValue(new Error('Snapshots must not execute live queries'));
  const part: Extract<AssistantPart, { type: 'result-chart' }> = {
    type: 'result-chart',
    id: 'historical',
    kind: 'bar',
    series: {
      label: 'Observed login',
      metric: 'events',
      unit: 'day',
      timezone: 'Asia/Jakarta',
      range: { startAt: 1790816400000, endAt: 1790906400000 },
      appliedFilters: { event: 'login', country: 'US' },
      buckets: [
        { t: '2026-10-01T01:00:00.000Z', y: 3 },
        { t: '2026-10-02T02:00:00.000Z', y: 2 },
      ],
      total: 5,
    },
  };
  const before = structuredClone(part);
  render(<ResultChart part={part} />);
  expect(screen.getByText('Total events: 5')).toBeInTheDocument();
  expect(screen.getByText(/event = login · country = US/)).toBeInTheDocument();
  const props = chart.mock.calls.at(-1)![0] as any;
  expect(props.chartData.labels).toEqual(['01 Oct', '02 Oct']);
  expect(props.chartData.datasets[0].data).toEqual([3, 2]);
  fireEvent.click(screen.getByRole('button', { name: 'Show table' }));
  expect(screen.getAllByRole('rowheader').map(node => node.textContent)).toEqual([
    '2026-10-01T01:00:00.000Z',
    '2026-10-02T02:00:00.000Z',
    'Total',
  ]);
  expect(fetch).not.toHaveBeenCalled();
  expect(part).toEqual(before);
});
