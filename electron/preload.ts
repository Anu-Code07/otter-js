import { contextBridge, ipcRenderer } from 'electron';
import type { AttentionSnapshot, AttentionSourceId, AttentionSignal } from '../src/types/attention';
import type { ClaudeStatus } from '../src/types/claude';
import type { CursorPosition } from '../src/types/system';
import type { AppSettings, WindowBounds } from '../src/types/system';
import type { PetState } from '../src/types/pet';

const pixelPaw = {
  cursor: {
    onMove: (callback: (position: CursorPosition) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, position: CursorPosition) =>
        callback(position);
      ipcRenderer.on('cursor:move', handler);
      ipcRenderer.send('cursor:subscribe');
      return () => ipcRenderer.removeListener('cursor:move', handler);
    },
    getPosition: (): Promise<CursorPosition> => ipcRenderer.invoke('cursor:getPosition'),
  },
  attention: {
    onSnapshotChange: (callback: (snapshot: AttentionSnapshot) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, snapshot: AttentionSnapshot) =>
        callback(snapshot);
      ipcRenderer.on('attention:snapshotChange', handler);
      ipcRenderer.send('attention:subscribe');
      return () => ipcRenderer.removeListener('attention:snapshotChange', handler);
    },
    getSnapshot: (): Promise<AttentionSnapshot> => ipcRenderer.invoke('attention:getSnapshot'),
    simulate: (sourceId: AttentionSourceId, signal: Partial<AttentionSignal> | null): Promise<void> =>
      ipcRenderer.invoke('attention:simulate', sourceId, signal),
  },
  claude: {
    onStatusChange: (callback: (status: ClaudeStatus) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, status: ClaudeStatus) =>
        callback(status);
      ipcRenderer.on('claude:statusChange', handler);
      ipcRenderer.send('claude:subscribe');
      return () => ipcRenderer.removeListener('claude:statusChange', handler);
    },
    getStatus: (): Promise<ClaudeStatus> => ipcRenderer.invoke('claude:getStatus'),
    simulateStatus: (status: ClaudeStatus | null): Promise<void> =>
      ipcRenderer.invoke('claude:simulateStatus', status),
  },
  window: {
    setIgnoreMouseEvents: (ignore: boolean, forward = true): Promise<void> =>
      ipcRenderer.invoke('window:setIgnoreMouseEvents', ignore, forward),
    getBounds: (): Promise<WindowBounds> => ipcRenderer.invoke('window:getBounds'),
    setBounds: (bounds: Partial<WindowBounds>): Promise<void> =>
      ipcRenderer.invoke('window:setBounds', bounds),
    setPetInteractive: (interactive: boolean): Promise<void> =>
      ipcRenderer.invoke('window:setPetInteractive', interactive),
  },
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
    set: (partial: Partial<AppSettings>): Promise<AppSettings> =>
      ipcRenderer.invoke('settings:set', partial),
    onChange: (callback: (settings: AppSettings) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, settings: AppSettings) =>
        callback(settings);
      ipcRenderer.on('settings:change', handler);
      ipcRenderer.send('settings:subscribe');
      return () => ipcRenderer.removeListener('settings:change', handler);
    },
  },
  system: {
    openSettings: (): Promise<void> => ipcRenderer.invoke('system:openSettings'),
    quit: (): Promise<void> => ipcRenderer.invoke('system:quit'),
    setPetEnabled: (enabled: boolean): Promise<void> =>
      ipcRenderer.invoke('system:setPetEnabled', enabled),
    setAttentionAlerts: (enabled: boolean): Promise<void> =>
      ipcRenderer.invoke('system:setAttentionAlerts', enabled),
    showNotification: (title: string, body: string): Promise<void> =>
      ipcRenderer.invoke('system:showNotification', title, body),
    onPetStateChange: (state: PetState): Promise<void> =>
      ipcRenderer.invoke('system:onPetStateChange', state),
    onTrayAction: (callback: (action: string) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, action: string) => callback(action);
      ipcRenderer.on('system:trayBroadcast', handler);
      return () => ipcRenderer.removeListener('system:trayBroadcast', handler);
    },
  },
};

contextBridge.exposeInMainWorld('pixelPaw', pixelPaw);
