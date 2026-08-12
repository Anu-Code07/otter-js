import { BrowserWindow, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './Logger';
import { settingsService } from './SettingsService';
import type { WindowBounds } from '../../src/types/system';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class WindowManager {
  private petWindow: BrowserWindow | null = null;
  private settingsWindow: BrowserWindow | null = null;
  private petInteractive = true;

  createPetWindow(): BrowserWindow {
    if (this.petWindow && !this.petWindow.isDestroyed()) {
      return this.petWindow;
    }

    const settings = settingsService.get();
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const size = settings.petSize + 80;
    const savedBounds = settings.rememberPosition
      ? (settingsService.get() as AppSettingsWithBounds).windowBounds
      : undefined;

    const initialX = savedBounds?.x ?? width - size - 40;
    const initialY = savedBounds?.y ?? height - size - 40;

    this.petWindow = new BrowserWindow({
      width: savedBounds?.width ?? size,
      height: savedBounds?.height ?? size,
      x: initialX,
      y: initialY,
      transparent: true,
      frame: false,
      alwaysOnTop: settings.alwaysOnTop,
      resizable: false,
      skipTaskbar: true,
      hasShadow: false,
      focusable: false,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.mjs'),
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
      },
    });

    this.petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.petWindow.setAlwaysOnTop(settings.alwaysOnTop, 'screen-saver');
    this.applyMouseTransparency();

    this.petWindow.on('moved', () => this.savePetBounds());
    this.petWindow.on('closed', () => {
      this.petWindow = null;
    });

    const devUrl = process.env.VITE_DEV_SERVER_URL;
    if (devUrl) {
      void this.petWindow.loadURL(devUrl);
    } else {
      void this.petWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    this.petWindow.once('ready-to-show', () => {
      this.petWindow?.showInactive();
    });

    logger.info('Pet window created');
    return this.petWindow;
  }

  createSettingsWindow(): BrowserWindow {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.focus();
      return this.settingsWindow;
    }

    this.settingsWindow = new BrowserWindow({
      width: 520,
      height: 680,
      minWidth: 420,
      minHeight: 500,
      title: 'PixelPaw Settings',
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.mjs'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });

    const devUrl = process.env.VITE_DEV_SERVER_URL;
    if (devUrl) {
      void this.settingsWindow.loadURL(`${devUrl}#/settings`);
    } else {
      void this.settingsWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
        hash: 'settings',
      });
    }

    this.settingsWindow.once('ready-to-show', () => {
      this.settingsWindow?.show();
    });

    return this.settingsWindow;
  }

  getPetWindow(): BrowserWindow | null {
    return this.petWindow;
  }

  setPetInteractive(interactive: boolean): void {
    this.petInteractive = interactive;
    this.applyMouseTransparency();
  }

  applyMouseTransparency(): void {
    if (!this.petWindow || this.petWindow.isDestroyed()) return;
    if (this.petInteractive) {
      this.petWindow.setIgnoreMouseEvents(false);
    } else {
      this.petWindow.setIgnoreMouseEvents(true, { forward: true });
    }
  }

  updateFromSettings(): void {
    const settings = settingsService.get();
    if (!this.petWindow || this.petWindow.isDestroyed()) return;
    this.petWindow.setAlwaysOnTop(settings.alwaysOnTop, 'screen-saver');
    this.petWindow.setOpacity(settings.petOpacity);
    const size = settings.petSize + 80;
    const bounds = this.petWindow.getBounds();
    this.petWindow.setBounds({
      ...bounds,
      width: size,
      height: size,
    });
  }

  getBounds(): WindowBounds {
    if (!this.petWindow || this.petWindow.isDestroyed()) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    return this.petWindow.getBounds();
  }

  setBounds(partial: Partial<WindowBounds>): void {
    if (!this.petWindow || this.petWindow.isDestroyed()) return;
    const current = this.petWindow.getBounds();
    this.petWindow.setBounds({ ...current, ...partial });
    this.savePetBounds();
  }

  private savePetBounds(): void {
    const settings = settingsService.get();
    if (!settings.rememberPosition || !this.petWindow) return;
    const bounds = this.petWindow.getBounds();
    settingsService.set({
      windowBounds: bounds,
    } as Partial<AppSettingsWithBounds>);
  }
}

interface AppSettingsWithBounds {
  windowBounds?: WindowBounds;
}

export const windowManager = new WindowManager();
