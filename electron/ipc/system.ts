import { app, ipcMain, Menu, Tray, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { windowManager } from '../services/WindowManager';
import { notificationService } from '../services/NotificationService';
import { settingsService } from '../services/SettingsService';
import { logger } from '../services/Logger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let tray: Tray | null = null;
let petEnabled = true;
let attentionAlertsEnabled = true;

export function registerSystemIpc(): void {
  ipcMain.handle('system:openSettings', () => {
    windowManager.createSettingsWindow();
  });

  ipcMain.handle('system:quit', () => {
    app.quit();
  });

  ipcMain.handle('system:setPetEnabled', (_event, enabled: boolean) => {
    petEnabled = enabled;
    settingsService.set({ petEnabled: enabled });
    const petWindow = windowManager.getPetWindow();
    if (petWindow && !petWindow.isDestroyed()) {
      if (enabled) {
        windowManager.revealPetWindow();
      } else {
        petWindow.hide();
      }
    }
    updateTrayMenu();
  });

  ipcMain.handle('system:setAttentionAlerts', (_event, enabled: boolean) => {
    attentionAlertsEnabled = enabled;
    settingsService.set({ attentionAlertsEnabled: enabled });
    updateTrayMenu();
  });

  ipcMain.handle('system:setClaudeAlerts', (_event, enabled: boolean) => {
    settingsService.set({ claudeAlerts: enabled });
    updateTrayMenu();
  });

  ipcMain.handle('system:showNotification', (_event, title: string, body: string) => {
    notificationService.show(title, body);
  });

  ipcMain.handle('system:onPetStateChange', () => {
    // Reserved for future tray status indicators
  });

  ipcMain.on('system:trayAction', (_event, action: string) => {
    handleTrayAction(action);
  });
}

export function createTray(): Tray {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'tray-icon.png')
    : path.join(__dirname, '../../public/assets/tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  const trayIcon = icon.isEmpty()
    ? nativeImage.createEmpty()
    : icon.resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);
  tray.setToolTip('PixelPaw');
  updateTrayMenu();

  tray.on('click', () => {
    windowManager.revealPetWindow();
  });

  return tray;
}

function broadcastToPet(action: string): void {
  const petWindow = windowManager.getPetWindow();
  if (petWindow && !petWindow.isDestroyed()) {
    petWindow.webContents.send('system:trayBroadcast', action);
  }
}

function handleTrayAction(action: string): void {
  switch (action) {
    case 'toggle-pet':
      petEnabled = !petEnabled;
      settingsService.set({ petEnabled });
      {
        const petWindow = windowManager.getPetWindow();
        if (petWindow && !petWindow.isDestroyed()) {
          if (petEnabled) windowManager.revealPetWindow();
          else petWindow.hide();
        }
      }
      updateTrayMenu();
      break;
    case 'toggle-alerts':
      attentionAlertsEnabled = !attentionAlertsEnabled;
      settingsService.set({ attentionAlertsEnabled });
      updateTrayMenu();
      break;
    case 'toggle-claude':
      settingsService.set({ claudeAlerts: !settingsService.get().claudeAlerts });
      updateTrayMenu();
      break;
    case 'toggle-follow':
      const follow = !settingsService.get().followCursor;
      settingsService.set({ followCursor: follow });
      updateTrayMenu();
      break;
    case 'change-pet':
      windowManager.revealPetWindow();
      broadcastToPet('change-pet');
      break;
    case 'show-pet':
      windowManager.revealPetWindow();
      break;
    case 'reset-position':
      windowManager.resetPetPosition();
      break;
    case 'settings':
      windowManager.createSettingsWindow();
      break;
    case 'quit':
      app.quit();
      break;
    default:
      logger.debug(`Unknown tray action: ${action}`);
  }
}

function updateTrayMenu(): void {
  if (!tray) return;
  const settings = settingsService.get();
  petEnabled = settings.petEnabled;
  attentionAlertsEnabled = settings.attentionAlertsEnabled;

  const menu = Menu.buildFromTemplate([
    { label: 'PixelPaw', enabled: false },
    {
      label: petEnabled ? '● Pet enabled' : '○ Pet paused',
      click: () => handleTrayAction('toggle-pet'),
    },
    { type: 'separator' },
    {
      label: petEnabled ? 'Pause Pet' : 'Resume Pet',
      click: () => handleTrayAction('toggle-pet'),
    },
    {
      label: settings.followCursor ? '✓ Follow Cursor' : 'Follow Cursor',
      click: () => handleTrayAction('toggle-follow'),
    },
    {
      label: attentionAlertsEnabled ? '✓ Attention Alerts' : 'Attention Alerts',
      click: () => handleTrayAction('toggle-alerts'),
    },
    {
      label: settings.claudeAlerts ? '✓ Claude Alerts' : 'Claude Alerts',
      click: () => handleTrayAction('toggle-claude'),
    },
    {
      label: 'Show Pet',
      click: () => handleTrayAction('show-pet'),
    },
    {
      label: 'Change Pet',
      click: () => handleTrayAction('change-pet'),
    },
    {
      label: 'Reset Position',
      click: () => handleTrayAction('reset-position'),
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => handleTrayAction('settings'),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => handleTrayAction('quit'),
    },
  ]);
  tray.setContextMenu(menu);
}

export function syncTrayFromSettings(): void {
  updateTrayMenu();
}
