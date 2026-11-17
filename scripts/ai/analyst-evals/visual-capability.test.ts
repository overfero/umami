// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { createFakeDb } from '../../../src/lib/ai/assistant/analyst/fake-db';
const database = vi.hoisted(() => ({ current: null as any }));
vi.mock('@/lib/prisma', () => ({
  default: new Proxy({}, { get: (_target, key) => database.current.prisma[key] }),
}));
import { ensureTask, getTask } from '@/lib/ai/assistant/analyst/task';
import { executeAnalystTool, type AnalystDeps } from '@/lib/ai/assistant/analyst/tools';
import { Interaction } from '@/lib/ai/assistant/tools';
import { gatewayConfig } from '../../../src/lib/ai/rpc/confinement.mjs';

const USER = '11111111-1111-4111-8111-111111111111';
const CHAT = '33333333-3333-4333-8333-333333333333';
const BOARD = '55555555-5555-4555-8555-555555555555';

beforeEach(() => {
  database.current = createFakeDb();
  database.current.chats.push({ id: CHAT, userId: USER });
});

it('absent image capability keeps screenshots out of the tool result and inspection unavailable', async () => {
  // This is the real native provider configuration, not a model response. The production
  // gateway declares text-only input and has no synthetic-image preflight receipt.
  const config = gatewayConfig({
    AI_PROVIDER: 'synthetic',
    AI_MODEL: 'text-only',
    AI_BASE_URL: 'https://synthetic.invalid/v1',
    AI_EGRESS_ORIGINS: 'https://synthetic.invalid',
  });
  expect(config.providers.synthetic.models[0].input).toEqual(['text']);
  const task = await ensureTask(USER, CHAT, 'Inspect a board');
  const scope = { userId: USER, chatId: CHAT, taskId: task.id };
  const hash = 'a'.repeat(64);
  const verifier = {
    render: vi.fn(async () => ({
      artifactId: 'synthetic-private-artifact',
      receipt: {
        boardRevision: 1,
        completedAt: '2026-10-01T00:00:00Z',
        views: [
          {
            viewport: { width: 1440, height: 1000 },
            hash,
            offset: 0,
            widgets: [{ id: 'w1', state: 'rendered' }],
          },
        ],
      },
    })),
    fetch: vi.fn(async () => [
      { bytes: Buffer.from('SYNTHETIC_IMAGE_MARKER'), mime: 'image/png', hash },
    ]),
    discard: vi.fn(),
    cleanup: vi.fn(),
  };
  const deps = {
    verifier,
    canViewBoard: async () => true,
    getBoard: async () => ({ id: BOARD, revision: 1, userId: USER, teamId: null, parameters: {} }),
  } as unknown as AnalystDeps;
  const input = {
    auth: { user: { id: USER } } as any,
    scope,
    deps,
    interaction: new Interaction(() => {}, new AbortController().signal),
  };
  const result = await executeAnalystTool('analyst_verify_render', { boardId: BOARD }, input);
  // Synthetic artifact tests only host release/inspection policy, not actual rendering.
  expect(result.images).toBeUndefined();
  expect(verifier.render).not.toHaveBeenCalled();
  expect(verifier.fetch).not.toHaveBeenCalled();
  expect(result.json).toMatchObject({ ok: false, visualStatus: 'visual_pending' });
  expect((await getTask(scope))!.receipts).toEqual([]);
  const inspection = await executeAnalystTool(
    'analyst_record_inspection',
    {
      receiptId: (result.json as any).receipt?.id ?? '00000000-0000-4000-8000-000000000000',
      observations: [{ widgetId: 'w1', hash, issue: 'none', note: 'No image capability' }],
    },
    input,
  );
  expect(inspection.json).toMatchObject({ ok: false, code: 'image_capability_unavailable', visualStatus: 'visual_pending' });
});
