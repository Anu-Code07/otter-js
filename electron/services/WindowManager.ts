import { BrowserWindow, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { cursorTracker } from './CursorTracker';
import { logger } from './Logger';
import { settingsService, effectivePetSize } from './SettingsService';
import type { WindowBounds } from '../../src/types/system';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WINDOW_CHROME = 8;

export type OverlayMode = 'none' | 'avatar' | 'context' | 'alert';

const OVERLAY_HEIGHTS: Record<OverlayMode, number> = {
  none: 0,
  alert: 96,
  avatar: 108,
  context: 228,
};

export function petWindowSize(petSize: number): number {
  return effectivePetSize(petSize) + WINDOW_CHROME;
}

function getCenteredPetBounds(petSize: number): WindowBounds {
  const size = petWindowSize(petSize);
  const { workArea } = screen.getPrimaryDisplay();
  return {
    x: workArea.x + Math.round((workArea.width - size) / 2),
    y: workArea.y + Math.round((workArea.height - size) / 2),
    width: size,
    height: size,
  };
}

function clampBoundsToWorkArea(bounds: WindowBounds): WindowBounds {
  const displays = screen.getAllDisplays();
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  const display =
    displays.find((d) => {
      const { x, y, width, height } = d.workArea;
      return (
        centerX >= x &&
        centerY >= y &&
        centerX < x + width &&
        centerY < y + height
      );
    }) ?? screen.getPrimaryDisplay();

  const { x, y, width, height } = display.workArea;
  const maxX = x + width - bounds.width;
  const maxY = y + height - bounds.height;

  return {
    ...bounds,
    x: Math.max(x, Math.min(bounds.x, maxX)),
    y: Math.max(y, Math.min(bounds.y, maxY)),
  };
}

export class WindowManager {
  private petWindow: BrowserWindow | null = null;
  private settingsWindow: BrowserWindow | null = null;
  private petInteractive = true;
  private isDragging = false;
  private dragOffset: { x: number; y: number } | null = null;
  private dragUnsubscribe: (() => void) | null = null;
  private hasShownPet = false;
  private saveBoundsTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSavedBounds: WindowBounds | null = null;
  private overlayMode: OverlayMode = 'none';

  createPetWindow(): BrowserWindow {
    if (this.petWindow && !this.petWindow.isDestroyed()) {
      this.revealPetWindow();
      return this.petWindow;
    }

    const settings = settingsService.get();
    const size = petWindowSize(settings.petSize);
    const savedBounds = settings.rememberPosition
      ? (settingsService.get() as AppSettingsWithBounds).windowBounds
      : undefined;

    const rawBounds: WindowBounds = savedBounds
      ? { ...savedBounds, width: size, height: size }
      : getCenteredPetBounds(settings.petSize);
    const initialBounds = clampBoundsToWorkArea(rawBounds);

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
      fullscreenable: false,
      ...(isMac ? { acceptFirstMouse: true, roundedCorners: false } : {}),
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: true,
      },
    });

    this.petWindow.setBackgroundColor('#00000000');
    this.petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.petWindow.setAlwaysOnTop(settings.alwaysOnTop, 'screen-saver', 1);
    this.petWindow.setOpacity(settings.petOpacity);
    this.applyMouseTransparency();

    this.petWindow.on('moved', () => this.scheduleSavePetBounds());
    this.petWindow.on('closed', () => {
      if (this.saveBoundsTimer) {
        clearTimeout(this.saveBoundsTimer);
        this.saveBoundsTimer = null;
      }
      this.petWindow = null;
      this.hasShownPet = false;
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

    this.petWindow.webContents.on('console-message', (_event, _level, message) => {
      logger.info(`[pet-ui] ${message}`);
    });

    this.petWindow.webContents.once('did-finish-load', () => {
      this.showPetOnce();
      void this.verifyPetSprite();
    });

    logger.info('Pet window created');
    return this.petWindow;
  }

  private showPetOnce(): void {
    if (this.hasShownPet || !this.petWindow || this.petWindow.isDestroyed()) return;
    this.hasShownPet = true;
    this.revealPetWindow();
    logger.info(`Pet window visible at ${JSON.stringify(this.petWindow.getBounds())}`);
  }

  private async verifyPetSprite(): Promise<void> {
    if (!this.petWindow || this.petWindow.isDestroyed()) return;
    try {
      const status = await this.petWindow.webContents.executeJavaScript(`(() => {
        const img = document.querySelector('.pixel-pet');
        if (!img) return { ok: false, reason: 'no-image-element' };
        return {
          ok: img.naturalWidth > 0,
          src: img.currentSrc || img.src,
          width: img.naturalWidth,
          height: img.naturalHeight,
        };
      })()`);
      logger.info(`Pet sprite check: ${JSON.stringify(status)}`);
      if (!status?.ok) {
        logger.warn('Pet sprite failed to load — try Reset position from tray menu');
      }
    } catch (error) {
      logger.warn(`Pet sprite check failed: ${String(error)}`);
    }
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
        preload: path.join(__dirname, 'preload.cjs'),
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

  revealPetWindow(): void {
    if (!this.petWindow || this.petWindow.isDestroyed()) return;
    const settings = settingsService.get();
    this.petWindow.show();
    this.petWindow.focus();
    this.petWindow.moveTop();
    this.petWindow.setAlwaysOnTop(settings.alwaysOnTop, 'screen-saver', 1);
    this.petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.petWindow.setOpacity(settings.petOpacity);
    this.petWindow.setBackgroundColor('#00000000');
  }

  resetPetPosition(): void {
    const settings = settingsService.get();
    const bounds = getCenteredPetBounds(settings.petSize);
    this.setBounds(bounds);
    this.revealPetWindow();
    logger.info(`Pet window reset to ${JSON.stringify(bounds)}`);
  }

  setPetInteractive(interactive: boolean): void {
    this.petInteractive = interactive;
    this.applyMouseTransparency();
  }

  applyMouseTransparency(): void {
    if (!this.petWindow || this.petWindow.isDestroyed()) return;
    if (process.platform === 'darwin') {
      this.petWindow.setIgnoreMouseEvents(false);
      return;
    }
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
    const size = petWindowSize(settings.petSize);
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

  setOverlayMode(mode: OverlayMode): void {
    if (!this.petWindow || this.petWindow.isDestroyed()) return;
    if (this.overlayMode === mode) return;

    const bounds = this.petWindow.getBounds();
    const currentExtra = OVERLAY_HEIGHTS[this.overlayMode];
    const targetExtra = OVERLAY_HEIGHTS[mode];
    const deltaExtra = targetExtra - currentExtra;

    if (deltaExtra === 0) {
      this.overlayMode = mode;
      return;
    }

    const next = clampBoundsToWorkArea({
      x: bounds.x,
      y: bounds.y - deltaExtra,
      width: bounds.width,
      height: bounds.height + deltaExtra,
    });

    this.overlayMode = mode;
    this.petWindow.setBounds(next);
  }

  /** @deprecated Use setOverlayMode */
  setMenuExpanded(expanded: boolean): void {
    this.setOverlayMode(expanded ? 'avatar' : 'none');
  }

  setBounds(partial: Partial<WindowBounds>): void {
    if (!this.petWindow || this.petWindow.isDestroyed()) return;
    const current = this.petWindow.getBounds();
    const next = clampBoundsToWorkArea({ ...current, ...partial });
    this.petWindow.setBounds(next);
    this.scheduleSavePetBounds();
  }

  startDrag(offsetX: number, offsetY: number): void {
    if (!this.petWindow || this.petWindow.isDestroyed()) return;

    this.endDrag();
    this.isDragging = true;
    this.dragOffset = { x: offsetX, y: offsetY };

    this.dragUnsubscribe = cursorTracker.onMove((position) => {
      if (!this.petWindow || this.petWindow.isDestroyed() || !this.dragOffset) return;
      const { width, height } = this.petWindow.getBounds();
      const next = clampBoundsToWorkArea({
        x: Math.round(position.x - this.dragOffset.x),
        y: Math.round(position.y - this.dragOffset.y),
        width,
        height,
      });
      this.petWindow.setBounds(next);
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

  private scheduleSavePetBounds(): void {
    if (this.saveBoundsTimer) return;
    this.saveBoundsTimer = setTimeout(() => {
      this.saveBoundsTimer = null;
      this.savePetBounds();
    }, 800);
  }

  private savePetBounds(): void {
    if (this.isDragging || this.overlayMode !== 'none') return;
    const settings = settingsService.get();
    if (!settings.rememberPosition || !this.petWindow) return;
    const bounds = this.petWindow.getBounds();
    if (
      this.lastSavedBounds &&
      this.lastSavedBounds.x === bounds.x &&
      this.lastSavedBounds.y === bounds.y &&
      this.lastSavedBounds.width === bounds.width &&
      this.lastSavedBounds.height === bounds.height
    ) {
      return;
    }
    this.lastSavedBounds = { ...bounds };
    settingsService.set({
      windowBounds: bounds,
    } as Partial<AppSettingsWithBounds>);
  }
}

interface AppSettingsWithBounds {
  windowBounds?: WindowBounds;
}

export const windowManager = new WindowManager();
