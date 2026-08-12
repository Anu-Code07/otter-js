import { BrowserWindow, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { cursorTracker } from './CursorTracker';
import { logger } from './Logger';
import { settingsService } from './SettingsService';
import type { WindowBounds } from '../../src/types/system';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function clampWindowToDisplay(bounds: WindowBounds): WindowBounds {
  const displays = screen.getAllDisplays();
  const onScreen = displays.some((display) => {
    const { x, y, width, height } = display.workArea;
    return (
      bounds.x >= x - 50 &&
      bounds.y >= y - 50 &&
      bounds.x < x + width &&
      bounds.y < y + height
    );
  });

  if (onScreen) return bounds;

  const primary = screen.getPrimaryDisplay().workArea;
  return {
    x: primary.x + primary.width - bounds.width - 40,
    y: primary.y + primary.height - bounds.height - 40,
    width: bounds.width,
    height: bounds.height,
  };
}

export class WindowManager {
  private petWindow: BrowserWindow | null = null;
  private settingsWindow: BrowserWindow | null = null;
  private petInteractive = true;
  private isDragging = false;
  private dragOffset: { x: number; y: number } | null = null;
  private dragUnsubscribe: (() => void) | null = null;

  createPetWindow(): BrowserWindow {
    if (this.petWindow && !this.petWindow.isDestroyed()) {
      this.petWindow.show();
      return this.petWindow;
    }

    const settings = settingsService.get();
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const size = settings.petSize + 80;
    const savedBounds = settings.rememberPosition
      ? (settingsService.get() as AppSettingsWithBounds).windowBounds
      : undefined;

    const rawBounds: WindowBounds = {
      x: savedBounds?.x ?? width - size - 40,
      y: savedBounds?.y ?? height - size - 40,
      width: savedBounds?.width ?? size,
      height: savedBounds?.height ?? size,
    };
    const initialBounds = clampWindowToDisplay(rawBounds);

    const isMac = process.platform === 'darwin';

    this.petWindow = new BrowserWindow({
      width: initialBounds.width,
      height: initialBounds.height,
      x: initialBounds.x,
      y: initialBounds.y,
      transparent: true,
      backgroundColor: '#00000000',
      frame: false,
      alwaysOnTop: settings.alwaysOnTop,
      resizable: false,
      skipTaskbar: true,
      hasShadow: false,
      focusable: true,
      show: false,
      ...(isMac ? { type: 'panel' as const } : {}),
      webPreferences: {
        preload: path.join(__dirname, 'preload.mjs'),
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
      },
    });

    this.petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.petWindow.setAlwaysOnTop(settings.alwaysOnTop, 'screen-saver', 1);
    this.petWindow.setOpacity(settings.petOpacity);
    this.applyMouseTransparency();

    this.petWindow.on('moved', () => this.savePetBounds());
    this.petWindow.on('closed', () => {
      this.petWindow = null;
    });

    const devUrl = process.env.VITE_DEV_SERVER_URL;
    const indexPath = path.join(__dirname, '../dist/index.html');

    if (devUrl) {
      void this.petWindow.loadURL(devUrl);
    } else {
      void this.petWindow.loadFile(indexPath);
    }

    this.petWindow.webContents.on('did-fail-load', (_event, code, desc) => {
      logger.error(`Pet window failed to load: ${code} ${desc}`);
    });

    const showPet = (): void => {
      if (!this.petWindow || this.petWindow.isDestroyed() || this.petWindow.isVisible()) return;
      this.petWindow.show();
      this.petWindow.moveTop();
      this.petWindow.setAlwaysOnTop(settings.alwaysOnTop, 'screen-saver', 1);
      logger.info(`Pet window visible at ${JSON.stringify(this.petWindow.getBounds())}`);
    };

    this.petWindow.once('ready-to-show', showPet);
    setTimeout(showPet, 1500);

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
    this.petWindow.setAlwaysOnTop(settings.alwaysOnTop, 'screen-saver', 1);
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

  startDrag(offsetX: number, offsetY: number): void {
    if (!this.petWindow || this.petWindow.isDestroyed()) return;

    this.endDrag();
    this.isDragging = true;
    this.dragOffset = { x: offsetX, y: offsetY };

    this.dragUnsubscribe = cursorTracker.onMove((position) => {
      if (!this.petWindow || this.petWindow.isDestroyed() || !this.dragOffset) return;
      const { width, height } = this.petWindow.getBounds();
      this.petWindow.setBounds({
        x: Math.round(position.x - this.dragOffset.x),
        y: Math.round(position.y - this.dragOffset.y),
        width,
        height,
      });
    });
  }

  endDrag(): void {
    if (this.dragUnsubscribe) {
      this.dragUnsubscribe();
      this.dragUnsubscribe = null;
    }
    this.dragOffset = null;
    if (this.isDragging) {
      this.isDragging = false;
      this.savePetBounds();
    }
  }

  private savePetBounds(): void {
    if (this.isDragging) return;
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
