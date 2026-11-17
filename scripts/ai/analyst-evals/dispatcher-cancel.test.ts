// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { createDispatcher } from '../../../src/lib/analyst-verifier/dispatch.mjs';
import { createArtifactStore } from '../../../src/lib/analyst-verifier/images.mjs';
import { createHash } from 'node:crypto';
import { crc32, deflateSync } from 'node:zlib';

function png() {
  const chunk = (type: string, bytes: Buffer) => { const body = Buffer.concat([Buffer.from(type), bytes]);
    const length = Buffer.alloc(4); length.writeUInt32BE(bytes.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body)); return Buffer.concat([length, body, crc]); };
  const header = Buffer.alloc(13); header.writeUInt32BE(1, 0); header.writeUInt32BE(1, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.from([0,255,255,255,255]))), chunk('IEND', Buffer.alloc(0))]);
}
const scope = { userId: 'cancel-user', taskId: 'cancel-task', boardId: 'cancel-board', boardRevision: 1, analysisRevisions: { synthetic: 1 } };
const widget = { id: 'w', executionId: 'e', definitionHash: 'a'.repeat(64), state: 'rendered' };
function result() { const bytes = png(); const hash = createHash('sha256').update(bytes).digest('hex');
  return { type: 'result', images: [1440,390].map(() => ({ mime: 'image/png', data: bytes.toString('base64') })),
    receipt: { ...scope, status: 'rendered_not_inspected', errors: [], views: [
      { viewport: {width:1440,height:1000}, hash, offset:0, widgets:[widget] },
      { viewport: {width:390,height:844}, hash, offset:0, widgets:[widget] },
    ] } }; }
function setup(overrides: any = {}) {
  const workers: any[] = [];
  const artifacts = createArtifactStore({ authorize: async () => true });
  const launch = vi.fn(() => { const child = Object.assign(new EventEmitter(), { send: vi.fn(), kill: vi.fn() }); workers.push(child); return child; });
  const dispatcher = createDispatcher({ enabled:true, isolated:true, origin:'http://fixture.invalid',
    authorize: async () => true, artifacts, launch, serve: undefined, ...overrides });
  return { dispatcher, artifacts, launch, workers };
}
it('queue cancellation never launches the cancelled job and active-render late results cannot release artifacts', async () => {
  const s = setup(); const firstAbort = new AbortController(); const queuedAbort = new AbortController();
  const first = s.dispatcher.run({ capability:'synthetic', scope, expectedWidgets:[widget], signal:firstAbort.signal });
  await vi.waitFor(() => expect(s.launch).toHaveBeenCalledTimes(1));
  const queued = s.dispatcher.run({ capability:'synthetic', scope, expectedWidgets:[widget], signal:queuedAbort.signal });
  const queuedDenied = expect(queued).rejects.toThrow('queue_cancelled_or_timeout'); queuedAbort.abort(); await queuedDenied;
  const firstDenied = expect(first).rejects.toThrow('cancelled_or_timeout'); firstAbort.abort(); await firstDenied;
  s.workers[0].emit('message', result());
  await new Promise(resolve => setTimeout(resolve, 10));
  expect(s.launch).toHaveBeenCalledTimes(1); expect(s.workers[0].kill).toHaveBeenCalledOnce(); expect(s.artifacts.size()).toBe(0);
});
it('cancellation while artifact storage awaits discards late pixels and never resolves a render receipt', async () => {
  let release!: () => void; let entered!: () => void;
  const started = new Promise<void>(resolve => { entered = resolve; });
  const s = setup();
  const put = s.artifacts.put;
  s.artifacts.put = async (...args: any[]) => { entered(); await new Promise<void>(resolve => { release = resolve; }); return put(...args); };
  const abort = new AbortController();
  const pending = s.dispatcher.run({ capability:'synthetic', scope, expectedWidgets:[widget], signal:abort.signal });
  await vi.waitFor(() => expect(s.workers).toHaveLength(1));
  s.workers[0].emit('message', result()); await started;
  const denied = expect(pending).rejects.toThrow('cancelled_or_timeout'); abort.abort(); await denied;
  release(); await vi.waitFor(() => expect(s.artifacts.size()).toBe(0));
  await new Promise(resolve => setTimeout(resolve, 10)); expect(s.artifacts.size()).toBe(0);
});
