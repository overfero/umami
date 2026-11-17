import { expect, it } from 'vitest';
import { browserCommandSpecs, expectedBrowserArgs, pairedBrowserReports } from './browser-commands';
it('browser command/report pairs reject missing B3 arbitrary success duplicates mismatched stdout failure skips and retries', () => {
  const report = { errors: [], suites: [] };
  const receipt = {
    checkoutRoot: '/checkout',
    commands: [
      {
        id: 'browser-prisma',
        executable: '/checkout/node_modules/.bin/prisma',
        args: ['generate'],
        exitCode: 0,
        timedOut: false,
      },
      {
        id: 'browser-build',
        executable: '/checkout/node_modules/.bin/next',
        args: ['build', '--webpack'],
        exitCode: 0,
        timedOut: false,
      },
      ...browserCommandSpecs.map(s => ({
        id: s.id,
        executable: '/checkout/node_modules/.bin/playwright',
        args: expectedBrowserArgs(s),
        exitCode: 0,
        timedOut: false,
        stdout: JSON.stringify(report),
      })),
    ],
    browserReports: browserCommandSpecs.map(s => ({ commandId: s.id, report })),
  };
  expect(pairedBrowserReports(receipt)).toHaveLength(5);
  const localBuild = structuredClone(receipt);
  Object.assign(localBuild, { buildRoot: '/tmp/owned-build' });
  localBuild.commands[0].executable = '/tmp/owned-build/node_modules/.bin/prisma';
  localBuild.commands[1].executable = '/tmp/owned-build/node_modules/.bin/next';
  expect(pairedBrowserReports(localBuild)).toHaveLength(5);
  for (const mutate of [
    (r: any) => (r.commands = r.commands.filter((c: any) => c.id !== 'browser-b3')),
    (r: any) => (r.commands = [{ exitCode: 0 }]),
    (r: any) => r.commands.push(r.commands[2]),
    (r: any) => (r.commands[2].executable = '/arbitrary/true'),
    (r: any) => (r.commands[2].args = ['test']),
    (r: any) => (r.commands[2].exitCode = 1),
    (r: any) => (r.commands[2].stdout = '{}'),
    (r: any) => (r.browserReports[0].commandId = 'browser-b3'),
    (r: any) => (r.browserReports[0].report = { errors: ['forged'] }),
  ]) {
    const copy = structuredClone(receipt);
    mutate(copy);
    expect(() => pairedBrowserReports(copy)).toThrow();
  }
});
