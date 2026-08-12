import { ipcMain } from 'electron';
import { settingsService } from '../services/SettingsService';
import type { AppSettings } from '../../src/types/system';
import { manageIpcSubscription } from './subscriptionManager';

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
    manageIpcSubscription<AppSettings>(
      event,
      'settings',
      'settings:change',
      (emit) => settingsService.onChange(emit),
    );
  });
}
