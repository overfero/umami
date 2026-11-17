// @vitest-environment node
import { expect,it,vi } from 'vitest';
import { withOwnedFixtureStartup } from '../analyst-fixture/startup.mjs';
it('fixture ports validate before provisioning and all post-provision build/start failures clean exactly once',async()=>{
 for(const ports of [['3000'],['3363','3363'],['3363','invalid'],['70000']]){
  const provision=vi.fn();const cleanup=vi.fn();
  await expect(withOwnedFixtureStartup({ports,provision,cleanup,run:vi.fn()})).rejects.toThrow('Refusing shared or invalid port');
  expect(provision).not.toHaveBeenCalled();expect(cleanup).not.toHaveBeenCalled();
 }
 for(const failure of ['failed build','missing child','start failed']){
  const lease={databaseUrl:'unique-owned',receipt:{schema:'owned'}};const cleanup=vi.fn();
  await expect(withOwnedFixtureStartup({ports:['3363'],provision:()=>lease,cleanup,run:async()=>{throw Error(failure);}})).rejects.toThrow(failure);
  expect(cleanup).toHaveBeenCalledExactlyOnceWith(lease);
 }
 const cleanup=vi.fn();await expect(withOwnedFixtureStartup({ports:['3363'],provision:()=>{throw Error('collision');},cleanup,run:vi.fn()})).rejects.toThrow('collision');expect(cleanup).not.toHaveBeenCalled();
});
