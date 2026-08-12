import { ipcMain } from 'electron';
import { attentionManager } from '../services/attention/AttentionManager';
import type { ClaudeStatus } from '../../src/types/claude';
import { manageIpcSubscription } from './subscriptionManager';

function mapClaudeStatus(status: string): ClaudeStatus {
  const map: Record<string, ClaudeStatus> = {
    working: 'working',
    needs_user: 'waiting_for_user',
    idle: 'idle',
    success: 'idle',
    error: 'unknown',
    unknown: 'unknown',
  };
  return map[status] ?? 'unknown';
}

/** @deprecated Use attention IPC — kept for backward compatibility */
export function registerClaudeIpc(): void {
  ipcMain.handle('claude:getStatus', () => {
    const signal = attentionManager.getSnapshot().sources.claude;
    return mapClaudeStatus(signal.status);
  });

  ipcMain.handle('claude:simulateStatus', (_event, status: ClaudeStatus | null) => {
    attentionManager.simulateClaudeStatus(status);
  });

  ipcMain.on('claude:subscribe', (event) => {
    manageIpcSubscription<ClaudeStatus>(
      event,
      'claude',
      'claude:statusChange',
      (emit) =>
        attentionManager.onSnapshotChange((snapshot) => {
          emit(mapClaudeStatus(snapshot.sources.claude.status));
        }),
    );
  });
}
