import { app } from 'electron';
import Store from 'electron-store';
import type { AppSettings } from '../../src/types/system';
import { DEFAULT_SETTINGS } from '../../src/types/system';
import { logger } from './Logger';

const store = new Store<AppSettings>({
  name: 'pixelpaw-settings',
  defaults: DEFAULT_SETTINGS,
});

const SETTINGS_MIGRATION_VERSION = 5;

type SettingsKey = keyof AppSettings;

export function effectivePetSize(size: number): number {
  return Math.max(64, Math.min(200, size));
}

export class SettingsService {
  migrateIfNeeded(): void {
    const version = store.get('settingsMigrationVersion') ?? 0;
    if (version >= SETTINGS_MIGRATION_VERSION) return;

    if (version < 3) {
      store.delete('windowBounds');
      store.set('petSize', 160);
      store.set('petOpacity', 1);
      store.set('petEnabled', true);
      store.set('alwaysOnTop', true);
      logger.info('Settings migrated to v3 — pet reset to centered default');
    }

    if (version < 4) {
      if (store.get('meetingDetectionEnabled') === undefined) {
        store.set('meetingDetectionEnabled', true);
      }
      if (store.get('meetingAlerts') === undefined) {
        store.set('meetingAlerts', false);
      }
      logger.info('Settings migrated to v4 — meeting detection defaults applied');
    }

    if (version < 5) {
      store.set('followCursor', false);
      logger.info('Settings migrated to v5 — follow cursor disabled by default');
    }

    store.set('settingsMigrationVersion', SETTINGS_MIGRATION_VERSION);
  }

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
    return store.onDidAnyChange(() => callback(this.get()));
  }

  configureStartup(enabled: boolean): void {
    if (process.platform === 'darwin' && !app.isPackaged) {
      logger.info('Launch at login skipped in development (macOS requires packaged app)');
      return;
    }

    try {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: false,
      });
    } catch {
      logger.warn(
        'Could not update launch at login. Enable manually in System Settings if needed.',
      );
    }
  }
}

export const settingsService = new SettingsService();
