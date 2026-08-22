import type { AttentionSnapshot } from '../types/attention';
import { createIdleSignal } from './attentionLogic';

const idleSnapshot = (): AttentionSnapshot => ({
  active: null,
  topPriority: 'low',
  sources: {
    claude: createIdleSignal('claude'),
    permission: createIdleSignal('permission'),
    build: createIdleSignal('build'),
    terminal: createIdleSignal('terminal'),
    git: createIdleSignal('git'),
    meeting: createIdleSignal('meeting'),
    integration: createIdleSignal('integration'),
  },
});

export function getIpc(): typeof window.pixelPaw | null {
  if (typeof window !== 'undefined' && window.pixelPaw) {
    return window.pixelPaw;
  }
  return null;
}

export const mockIpc: typeof window.pixelPaw = {
  assets: {
    resolve: (relativePath) => `./assets/${relativePath}`,
  },
  cursor: {
    onMove: (callback) => {
      const id = setInterval(() => {
        callback({ x: Math.random() * 1920, y: Math.random() * 1080 });
      }, 100);
      return () => clearInterval(id);
    },
    getPosition: async () => ({ x: 0, y: 0 }),
  },
  attention: {
    onSnapshotChange: (callback) => {
      callback(idleSnapshot());
      return () => undefined;
    },
    getSnapshot: async () => idleSnapshot(),
    simulate: async () => undefined,
  },
  claude: {
    onStatusChange: (callback) => {
      callback('unknown');
      return () => undefined;
    },
    getStatus: async () => 'unknown',
    simulateStatus: async () => undefined,
  },
  window: {
    setIgnoreMouseEvents: async () => undefined,
    getBounds: async () => ({ x: 0, y: 0, width: 200, height: 200 }),
    setBounds: async () => undefined,
    setPetInteractive: async () => undefined,
    startDrag: async () => undefined,
    updateDrag: () => undefined,
    endDrag: async () => undefined,
    revealPet: async () => undefined,
    resetPosition: async () => undefined,
    setMenuExpanded: async () => undefined,
    setOverlayMode: async () => undefined,
  },
  settings: {
    get: async () => (await import('../types/system')).DEFAULT_SETTINGS,
    set: async (partial) => ({ ...(await import('../types/system')).DEFAULT_SETTINGS, ...partial }),
    onChange: () => () => undefined,
  },
  system: {
    openSettings: async () => undefined,
    quit: async () => undefined,
    setAttentionAlerts: async () => undefined,
    showNotification: async () => undefined,
    onPetStateChange: async () => undefined,
    onTrayAction: () => () => undefined,
  },
};

export function ipc(): typeof window.pixelPaw {
  return getIpc() ?? mockIpc;
}
