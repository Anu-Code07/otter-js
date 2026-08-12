import { ipcMain } from 'electron';
import { attentionManager } from '../services/attention/AttentionManager';
import type { AttentionSourceId, AttentionSnapshot } from '../../src/types/attention';
import type { AttentionSignal } from '../../src/types/attention';
import { manageIpcSubscription } from './subscriptionManager';

export function registerAttentionIpc(): void {
  ipcMain.handle('attention:getSnapshot', () => attentionManager.getSnapshot());

  ipcMain.handle(
    'attention:simulate',
    (_event, sourceId: AttentionSourceId, signal: Partial<AttentionSignal> | null) => {
      attentionManager.simulateSource(sourceId, signal);
    },
  );

  ipcMain.handle('attention:simulateClaude', (_event, status: string | null) => {
    attentionManager.simulateClaudeStatus(status);
  });

  ipcMain.on('attention:subscribe', (event) => {
    manageIpcSubscription<AttentionSnapshot>(
      event,
      'attention',
      'attention:snapshotChange',
      (emit) => attentionManager.onSnapshotChange(emit),
    );
  });
}
