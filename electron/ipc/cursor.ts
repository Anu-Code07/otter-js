import { ipcMain } from 'electron';
import { cursorTracker } from '../services/CursorTracker';
import { manageIpcSubscription } from './subscriptionManager';
import type { CursorPosition } from '../../src/types/system';

export function registerCursorIpc(): void {
  ipcMain.handle('cursor:getPosition', () => cursorTracker.getPosition());

  ipcMain.on('cursor:subscribe', (event) => {
    manageIpcSubscription<CursorPosition>(
      event,
      'cursor',
      'cursor:move',
      (emit) => cursorTracker.onMove(emit),
    );
  });
}
