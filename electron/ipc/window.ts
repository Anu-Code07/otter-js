import { ipcMain } from 'electron';
import { windowManager } from '../services/WindowManager';
import type { WindowBounds } from '../../src/types/system';

export function registerWindowIpc(): void {
  ipcMain.handle('window:setIgnoreMouseEvents', (_event, ignore: boolean, forward = true) => {
    const win = windowManager.getPetWindow();
    if (!win || win.isDestroyed()) return;
    if (ignore) {
      win.setIgnoreMouseEvents(true, { forward });
    } else {
      win.setIgnoreMouseEvents(false);
    }
  });

  ipcMain.handle('window:setPetInteractive', (_event, interactive: boolean) => {
    windowManager.setPetInteractive(interactive);
  });

  ipcMain.handle('window:getBounds', () => windowManager.getBounds());

  ipcMain.handle('window:setBounds', (_event, bounds: Partial<WindowBounds>) => {
    windowManager.setBounds(bounds);
  });

  ipcMain.handle('window:startDrag', (_event, offsetX: number, offsetY: number) => {
    windowManager.startDrag(offsetX, offsetY);
  });

  ipcMain.handle('window:endDrag', () => {
    windowManager.endDrag();
  });
}
