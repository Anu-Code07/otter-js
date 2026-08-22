import { ipcMain } from 'electron';
import { windowManager, type OverlayMode } from '../services/WindowManager';
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

  ipcMain.handle('window:startDrag', (_event, screenX: number, screenY: number) => {
    windowManager.startDrag(screenX, screenY);
  });

  ipcMain.on('window:updateDrag', (_event, screenX: number, screenY: number) => {
    windowManager.updateDrag(screenX, screenY);
  });

  ipcMain.handle('window:endDrag', () => {
    windowManager.endDrag();
  });

  ipcMain.handle('window:revealPet', () => {
    windowManager.revealPetWindow();
  });

  ipcMain.handle('window:resetPosition', () => {
    windowManager.resetPetPosition();
  });

  ipcMain.handle('window:setMenuExpanded', (_event, expanded: boolean) => {
    windowManager.setMenuExpanded(expanded);
  });

  ipcMain.handle('window:setOverlayMode', (_event, mode: OverlayMode) => {
    windowManager.setOverlayMode(mode);
  });
}
