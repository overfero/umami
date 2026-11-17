import { resolveImageCapability, syntheticImageCapabilityForTests } from '../image-capability.mjs';

/** Production resolves only provisioned preflight evidence. The separate offline fixture branch
 * is positively guarded by launcher receipt + native provider hash + nonce + build + DB marker.
 * It tests synthetic transport/rendering, never configured-provider vision or a live fallback.
 */
export async function resolveTurnImageCapability() {
  if (process.env.AI_OFFLINE_FIXTURE !== undefined) {
    const { offlineFixtureRuntime, fixtureDatabaseVerified } = await import('./runtime');
    const fixture = offlineFixtureRuntime(process.env, process.cwd());
    if (!fixture || !(await fixtureDatabaseVerified()))
      throw new Error('Offline fixture image context refused');
    return syntheticImageCapabilityForTests();
  }
  return resolveImageCapability();
}
