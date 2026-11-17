import { expect, test, vi } from 'vitest';
import { render, screen } from '@/test/render';
import { EventsTable } from './EventsTable';

vi.mock('@/components/hooks', async () => {
  const actual = await vi.importActual<typeof import('@/components/hooks')>('@/components/hooks');
  return {
    ...actual,
    useMessages: () => ({
      t: (value: string) => value,
      labels: { event: 'Event', triggeredEvent: 'Triggered event', viewedPage: 'Viewed page' },
    }),
    useNavigation: () => ({ updateParams: () => '/session' }),
    useFormat: () => ({ formatValue: (value: string) => value }),
  };
});

test('event labels and page links retain nonwrapping rows with shrinkable content', () => {
  render(
    <EventsTable
      data={[
        {
          id: 'event-1',
          eventName: 'Observed login',
          hasData: 0,
          createdAt: '2026-10-01T00:00:00Z',
          sessionId: 'session-1',
        },
        {
          id: 'event-2',
          urlPath: '/observed',
          hostname: 'example.test',
          hasData: 0,
          createdAt: '2026-10-01T00:00:00Z',
          sessionId: 'session-2',
        },
      ]}
    />,
  );
  const label = screen.getByText('Observed login');
  expect(label.parentElement).toHaveStyle({ flexWrap: 'nowrap', minWidth: '0' });
  expect(label.parentElement?.parentElement).toHaveStyle({ flexWrap: 'nowrap', minWidth: '0' });
  expect(screen.getByRole('link', { name: '/observed' })).toHaveAttribute(
    'href',
    '//example.test/observed',
  );
});
