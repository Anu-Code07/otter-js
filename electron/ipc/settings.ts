import { ipcMain } from 'electron';
import { settingsService } from '../services/SettingsService';
import type { AppSettings } from '../../src/types/system';

export function registerSettingsIpc(): void {
  ipcMain.handle('settings:get', () => settingsService.get());

  ipcMain.handle('settings:set', (_event, partial: Partial<AppSettings>) => {
    const next = settingsService.set(partial);
    if (partial.launchAtStartup !== undefined) {
      settingsService.configureStartup(partial.launchAtStartup);
    }
    return next;
  });

  ipcMain.on('settings:subscribe', (event) => {
    const unsubscribe = settingsService.onChange((settings) => {
      if (!event.sender.isDestroyed()) {
        event.sender.send('settings:change', settings);
      }
    });
    event.sender.once('destroyed', unsubscribe);
  });
}
