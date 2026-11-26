'use client';
import { useEffect, useState } from 'react';
import { setTimezone } from '@/store/app';
import { BoardContext } from '@/app/(main)/boards/BoardProvider';
import { BoardViewColumn } from '@/app/(main)/boards/[boardId]/BoardViewColumn';
import { VerifierBoardContext } from '@/app/(main)/boards/VerifierBoardContext';
import { FrozenExecutionProvider } from '@/components/hooks/queries/useAnalysisQuery';
import { FrozenWebsiteStatsProvider } from '@/components/hooks/queries/useWebsiteStatsQuery';

export function VerifierCanvas({ payload }: { payload: any }) {
  const { scope, widgets } = payload;
  const board = widgets[0]?.board;
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setTimezone('UTC');
    const range = widgets.find(w => w.native)?.native.range;
    if (range) {
      // useDateParameters interprets custom Date wall-clock fields in the selected timezone.
      // Encode UTC wall time in the browser's local Date representation before that conversion.
      const wallTime = (epoch: number) => {
        const utc = new Date(epoch);
        return new Date(
          utc.getUTCFullYear(),
          utc.getUTCMonth(),
          utc.getUTCDate(),
          utc.getUTCHours(),
          utc.getUTCMinutes(),
          utc.getUTCSeconds(),
          utc.getUTCMilliseconds(),
        ).getTime();
      };
      window.history.replaceState(
        null,
        '',
        `/canvas?date=range:${wallTime(range.startAt)}:${wallTime(range.endAt)}`,
      );
    }
    setReady(true);
  }, [widgets]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const nodes = [...document.querySelectorAll<HTMLElement>('[data-widget-id]')];
      if (nodes.length !== widgets.length) return;
      const receipts = nodes.map(el => ({
        id: el.dataset.widgetId,
        state: el.dataset.analysisState,
        executionId: el.dataset.executionId,
        definitionHash: el.dataset.definitionHash,
      }));
      if (receipts.some(w => !['rendered', 'empty', 'failed'].includes(w.state ?? ''))) return;
      (window as any).__verifierReceipt = {
        boardId: scope.boardId,
        boardRevision: scope.boardRevision,
        analysisRevisions: scope.analysisRevisions,
        widgets: receipts,
        complete: true,
      };
    }, 25);
    return () => window.clearInterval(timer);
  }, [scope, widgets]);
  const unsupported = () => {
    throw new Error('readonly_verifier');
  };
  if (!ready) return null;
  return (
    <VerifierBoardContext.Provider value={true}>
      <BoardContext.Provider
        value={{
          board,
          editing: false,
          isPending: false,
          updateBoard: unsupported,
          saveBoard: unsupported,
          registerLayoutGetter: unsupported,
        }}
      >
        <main data-verifier-canvas style={{ padding: 12, width: '100%', boxSizing: 'border-box' }}>
          {board.parameters.rows.map(row => (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
                gap: 8,
                marginBottom: 8,
              }}
            >
              {row.columns.map(column => {
                const widget = widgets.find(w => w.id === column.id);
                const content = (
                  <BoardViewColumn
                    component={column.component}
                    widgetId={column.id}
                    showEntityBadge={false}
                  />
                );
                return (
                  <div key={column.id} style={{ minWidth: 0 }}>
                    {widget.native ? (
                      <FrozenWebsiteStatsProvider
                        value={{
                          ...widget.native,
                          widgetId: widget.id,
                          executionId: widget.executionId,
                          definitionHash: widget.definitionHash,
                        }}
                      >
                        {content}
                      </FrozenWebsiteStatsProvider>
                    ) : (
                      // A metric and a table may share an analysis, but each widget's
                      // receipt must match its own frozen execution ID.
                      <FrozenExecutionProvider executions={[widget]}>
                        {content}
                      </FrozenExecutionProvider>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </main>
      </BoardContext.Provider>
    </VerifierBoardContext.Provider>
  );
}
