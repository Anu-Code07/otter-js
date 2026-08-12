import type { AttentionSnapshot, AttentionSourceId, AttentionSignal } from '../types/attention';
import type { ClaudeStatus } from '../types/claude';
import type { CursorPosition } from '../types/system';
import type { AppSettings, WindowBounds } from '../types/system';
import type { PetState } from '../types/pet';

export interface PixelPawAPI {
  cursor: {
    onMove: (callback: (position: CursorPosition) => void) => () => void;
    getPosition: () => Promise<CursorPosition>;
  };
  attention: {
    onSnapshotChange: (callback: (snapshot: AttentionSnapshot) => void) => () => void;
    getSnapshot: () => Promise<AttentionSnapshot>;
    simulate: (sourceId: AttentionSourceId, signal: Partial<AttentionSignal> | null) => Promise<void>;
  };
  claude: {
    onStatusChange: (callback: (status: ClaudeStatus) => void) => () => void;
    getStatus: () => Promise<ClaudeStatus>;
    simulateStatus: (status: ClaudeStatus | null) => Promise<void>;
  };
  window: {
    setIgnoreMouseEvents: (ignore: boolean, forward?: boolean) => Promise<void>;
    getBounds: () => Promise<WindowBounds>;
    setBounds: (bounds: Partial<WindowBounds>) => Promise<void>;
    setPetInteractive: (interactive: boolean) => Promise<void>;
  };
  settings: {
    get: () => Promise<AppSettings>;
    set: (partial: Partial<AppSettings>) => Promise<AppSettings>;
    onChange: (callback: (settings: AppSettings) => void) => () => void;
  };
  system: {
    openSettings: () => Promise<void>;
    quit: () => Promise<void>;
    setPetEnabled: (enabled: boolean) => Promise<void>;
    setAttentionAlerts: (enabled: boolean) => Promise<void>;
    showNotification: (title: string, body: string) => Promise<void>;
    onPetStateChange: (state: PetState) => Promise<void>;
    onTrayAction: (callback: (action: string) => void) => () => void;
  };
}

declare global {
  interface Window {
    pixelPaw: PixelPawAPI;
  }
}

export {};
