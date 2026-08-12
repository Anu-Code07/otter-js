import { app } from 'electron';
import Store from 'electron-store';
import type { AppSettings } from '../../src/types/system';
import { DEFAULT_SETTINGS } from '../../src/types/system';

const store = new Store<AppSettings>({
  name: 'pixelpaw-settings',
  defaults: DEFAULT_SETTINGS,
});

type SettingsKey = keyof AppSettings;

export class SettingsService {
  get(): AppSettings {
    const result: AppSettings = { ...DEFAULT_SETTINGS };
    for (const key of Object.keys(DEFAULT_SETTINGS) as SettingsKey[]) {
      const value = store.get(key);
      if (value !== undefined) {
        (result as Record<SettingsKey, AppSettings[SettingsKey]>)[key] = value;
      }
    }
    return result;
  }

  set(partial: Partial<AppSettings>): AppSettings {
    for (const [key, value] of Object.entries(partial) as [SettingsKey, AppSettings[SettingsKey]][]) {
      store.set(key, value);
    }
    return this.get();
  }

  onChange(callback: (settings: AppSettings) => void): () => void {
    const unsubscribe = store.onDidAnyChange(() => callback(this.get()));
    return unsubscribe;
  }

  configureStartup(enabled: boolean): void {
    if (!app.isPackaged && process.platform !== 'darwin') {
      return;
    }
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: false,
    });
  }
}

export const settingsService = new SettingsService();
