// @vitest-environment node
import { expect, it, vi, afterEach } from 'vitest';
const fixture = vi.hoisted(() => ({ runtime: vi.fn(), database: vi.fn() }));
vi.mock('../../../src/lib/ai/assistant/runtime', () => ({
  offlineFixtureRuntime: fixture.runtime,
  fixtureDatabaseVerified: fixture.database,
}));
import { resolveTurnImageCapability } from '../../../src/lib/ai/assistant/image-context';
import { canInspectImages } from '../../../src/lib/ai/image-capability.mjs';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});
it('synthetic fixture image DI requires independently guarded launcher and database identity and is never a live fallback', async () => {
  vi.stubEnv('AI_OFFLINE_FIXTURE', 'analyst-synthetic-v1');
  fixture.runtime.mockImplementation(() => {
    throw new Error('guard refused');
  });
  await expect(resolveTurnImageCapability()).rejects.toThrow();
  expect(fixture.database).not.toHaveBeenCalled();
  fixture.runtime.mockReturnValue({ provider: 'synthetic-only' });
  fixture.database.mockResolvedValue(false);
  await expect(resolveTurnImageCapability()).rejects.toThrow(
    'Offline fixture image context refused',
  );
  fixture.database.mockResolvedValue(true);
  expect(canInspectImages(await resolveTurnImageCapability())).toBe(true);
});
it('normal turns without executed preflight remain image unavailable and do not select the fixture', async () => {
  vi.stubEnv('AI_OFFLINE_FIXTURE', undefined);
  vi.stubEnv('AI_IMAGE_PREFLIGHT_PATH', undefined);
  vi.stubEnv('AI_IMAGE_PREFLIGHT_SHA256', undefined);
  expect(canInspectImages(await resolveTurnImageCapability())).toBe(false);
  expect(fixture.runtime).not.toHaveBeenCalled();
  expect(fixture.database).not.toHaveBeenCalled();
});
