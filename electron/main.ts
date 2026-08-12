import { app, BrowserWindow } from 'electron';
import { registerCursorIpc } from './ipc/cursor';
import { registerClaudeIpc } from './ipc/claude';
import { registerAttentionIpc } from './ipc/attention';
import { registerWindowIpc } from './ipc/window';
import { registerSettingsIpc } from './ipc/settings';
import { registerSystemIpc, createTray, syncTrayFromSettings } from './ipc/system';
import { cursorTracker } from './services/CursorTracker';
import { attentionManager } from './services/attention/AttentionManager';
import { windowManager } from './services/WindowManager';
import { settingsService } from './services/SettingsService';
import { logger } from './services/Logger';

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

if (process.platform === 'darwin') {
  app.commandLine.appendSwitch('enable-transparent-visuals');
  app.commandLine.appendSwitch('disable-features', 'MacWebContentsOcclusion');
}

function registerIpcHandlers(): void {
  registerCursorIpc();
  registerAttentionIpc();
  registerClaudeIpc();
  registerWindowIpc();
  registerSettingsIpc();
  registerSystemIpc();
}

function startServices(): void {
  cursorTracker.start();
  attentionManager.start();

  settingsService.onChange(() => {
    attentionManager.applySettings();
    windowManager.updateFromSettings();
    syncTrayFromSettings();
  });
}

app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.dock) {
    app.dock.hide();
  }
  registerIpcHandlers();
  settingsService.migrateIfNeeded();
  startServices();
  windowManager.createPetWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createPetWindow();
    }
  });

  logger.info('PixelPaw started');
});

app.on('second-instance', () => {
  windowManager.revealPetWindow();
});

app.on('window-all-closed', () => {
  // Keep PixelPaw running in the system tray.
});

app.on('before-quit', () => {
  cursorTracker.stop();
  attentionManager.stop();
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
});
