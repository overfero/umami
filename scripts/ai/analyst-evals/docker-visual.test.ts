// @vitest-environment node
import { expect, it } from 'vitest';
import {
  createVerifierPort,
  resolvePrivateRender,
} from '../../../src/lib/analyst-verifier/port.mjs';
import { createDockerLauncher } from '../../../src/lib/analyst-verifier/launcher.mjs';

// Real network-less Docker Chromium, SYNTHETIC fixture adapter (not AnalysisWidget/B3).
// No model call or visual understanding is claimed by automated receipt checks.
it('Docker Chromium fixture rejects render errors stale revisions desktop clipping and narrow-only clipping without artifacts', async () => {
  const scope = {
    userId: 'slice03-visual',
    taskId: 'slice03-visual',
    boardId: 'fixture-board',
    boardRevision: 1,
    analysisRevisions: { synthetic: 1 },
  };
  let mode = 'normal';
  const expectedWidgets = [
    { id: 'metric', executionId: 'fixture-execution', definitionHash: 'a'.repeat(64) },
  ];
  const port = createVerifierPort({
    enabled: true,
    launcher: createDockerLauncher(),
    authorize: async () => true,
    prepare: async () => expectedWidgets,
    renderer: async ({ credential, path }: any) => {
      if (path !== '/canvas') throw new Error('fixture_asset_denied');
      const job = await resolvePrivateRender(credential);
      const revision = mode === 'stale' ? 2 : job.scope.boardRevision;
      const state = mode === 'error' ? 'error' : 'rendered';
      const css =
        mode === 'clipped'
          ? 'section{width:1800px}'
          : mode === 'narrow-clipped'
            ? '@media(max-width:500px){section{width:600px}}'
            : '';
      return {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
        body: `<!doctype html><style>*{box-sizing:border-box}body{margin:0}main{width:100%;padding:16px}section{height:200px;border:1px solid} ${css}</style><main data-verifier-canvas><section data-widget-id="metric" data-analysis-state="${state}" data-execution-id="fixture-execution" data-definition-hash="${'a'.repeat(64)}">Synthetic42</section></main><script>window.__verifierReceipt=${JSON.stringify({ boardId: scope.boardId, boardRevision: revision, analysisRevisions: scope.analysisRevisions, complete: true, widgets: [{ ...expectedWidgets[0], state }] })}</script>`,
      };
    },
  });
  try {
    const rendered = await port.render({ scope, expectedWidgets });
    expect(rendered.receipt.status).toBe('rendered_not_inspected');
    expect(rendered.receipt.views.map((view: any) => view.viewport.width)).toEqual([1440, 390]);
    const images = await port.fetch(rendered.artifactId, scope);
    expect(images).toHaveLength(2);
    expect(
      images.every((image: any) => image.mime === 'image/png' && image.bytes.length > 1000),
    ).toBe(true);
    port.discard(rendered.artifactId);
    await expect(port.fetch(rendered.artifactId, scope)).rejects.toThrow();
    for (mode of ['error', 'stale', 'clipped', 'narrow-clipped']) {
      await expect(port.render({ scope, expectedWidgets })).rejects.toThrow();
    }
  } finally {
    port.cleanup({ taskId: scope.taskId });
  }
}, 150_000);
