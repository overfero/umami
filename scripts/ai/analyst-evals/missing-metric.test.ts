import { expect, it, vi } from 'vitest';
import { normalizeDefinition } from '@/lib/analyst/definition';
import { executeAnalysis } from '@/lib/analyst/execute';

vi.mock('@/lib/ai/query', () => ({
  getAiQueryScope: () => undefined,
  withAiRead: (fn: any) => fn(),
}));
vi.mock('@/permissions/website', () => ({ canViewWebsite: async () => true }));
vi.mock('@/lib/request', () => ({ setWebsiteDate: async (_: string, filters: any) => filters }));
vi.mock('@/queries/sql', () => ({ getWebsiteStats: async () => ({ visits: 0 }) }));
vi.mock('@/queries/sql/people/getPeople', () => ({ getPeople: vi.fn() }));

it('omitted native stats key rejects as missing_metric rather than zero', async () => {
  // Fault injection: real native stats normally return a key, even for an empty website.
  const definition = normalizeDefinition({
    schemaVersion: 1,
    source: { websiteId: '00000000-0000-4000-8000-000000000001' },
    operation: 'totals',
    metric: 'pageviews',
    timezone: 'UTC',
    datePolicy: { type: 'fixed', startAt: 1, endAt: 1000 },
    semanticBinding: {
      label: 'Pageviews',
      unit: 'count',
      population: 'all',
      meaningSource: 'observed_only',
    },
  });
  await expect(
    executeAnalysis({ user: { id: 'owner' } } as any, definition, { now: 1000 }),
  ).rejects.toMatchObject({ code: 'missing_metric', field: 'metric' });
});
