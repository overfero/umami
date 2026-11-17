export function validateFixturePorts(ports) {
  const selected=ports.filter(port=>port!==undefined);
  if(selected.some(port=>!/^\d+$/.test(port)||+port<1024||+port>65535||['3000','3317'].includes(port))||new Set(selected).size!==selected.length)
    throw new Error('Refusing shared or invalid port');
}
/** A lease is created only after provisioning succeeds. Cleanup must independently verify its
 * root/nonce/database receipt and namespace owner; no broad cleanup on failed provision.
 */
export async function withOwnedFixtureStartup({ports,provision,run,cleanup}) {
  validateFixturePorts(ports);
  let lease;
  try {lease=await provision();return await run(lease);}
  finally {if(lease)await cleanup(lease);}
}
