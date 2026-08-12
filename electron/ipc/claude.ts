import { ipcMain } from 'electron';
import { attentionManager } from '../services/attention/AttentionManager';
import type { ClaudeStatus } from '../../src/types/claude';

/** @deprecated Use attention IPC — kept for backward compatibility */
export function registerClaudeIpc(): void {
  ipcMain.handle('claude:getStatus', () => {
    const signal = attentionManager.getSnapshot().sources.claude;
    const map: Record<string, ClaudeStatus> = {
      working: 'working',
      needs_user: 'waiting_for_user',
      idle: 'idle',
      success: 'idle',
      error: 'unknown',
      unknown: 'unknown',
    };
    return map[signal.status] ?? 'unknown';
  });

  ipcMain.handle('claude:simulateStatus', (_event, status: ClaudeStatus | null) => {
    attentionManager.simulateClaudeStatus(status);
  });

  ipcMain.on('claude:subscribe', (event) => {
    const unsubscribe = attentionManager.onSnapshotChange((snapshot) => {
      if (!event.sender.isDestroyed()) {
        const signal = snapshot.sources.claude;
        const map: Record<string, ClaudeStatus> = {
          working: 'working',
          needs_user: 'waiting_for_user',
          idle: 'idle',
          success: 'idle',
          error: 'unknown',
          unknown: 'unknown',
        };
        event.sender.send('claude:statusChange', map[signal.status] ?? 'unknown');
      }
    });
    event.sender.once('destroyed', unsubscribe);
  });
}
