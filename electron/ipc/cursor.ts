import { ipcMain } from 'electron';
import { cursorTracker } from '../services/CursorTracker';

export function registerCursorIpc(): void {
  ipcMain.handle('cursor:getPosition', () => cursorTracker.getPosition());

  ipcMain.on('cursor:subscribe', (event) => {
    const unsubscribe = cursorTracker.onMove((position) => {
      if (!event.sender.isDestroyed()) {
        event.sender.send('cursor:move', position);
      }
    });
    event.sender.once('destroyed', unsubscribe);
  });
}
