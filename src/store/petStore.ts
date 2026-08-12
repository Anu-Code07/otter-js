import { create } from 'zustand';
import type { AttentionSnapshot, AttentionSignal } from '../types/attention';
import type { CursorPosition } from '../types/system';
import type { AppSettings } from '../types/system';
import type { PetAnimation, PetState, PetStats } from '../types/pet';
import { createIdleSignal } from '../services/attentionLogic';

const emptySnapshot = (): AttentionSnapshot => ({
  active: null,
  topPriority: 'low',
  sources: {
    claude: createIdleSignal('claude'),
    permission: createIdleSignal('permission'),
    build: createIdleSignal('build'),
    terminal: createIdleSignal('terminal'),
    git: createIdleSignal('git'),
    integration: createIdleSignal('integration'),
  },
});

export interface PetStore {
  petState: PetState;
  currentAnimation: PetAnimation;
  currentFrameSrc: string;
  speechMessage: string | null;
  speechVisible: boolean;
  cursorPosition: CursorPosition;
  cursorDistance: number;
  attentionSnapshot: AttentionSnapshot;
  previousActiveSignal: AttentionSignal | null;
  settings: AppSettings | null;
  stats: PetStats;
  petOffsetX: number;
  petOffsetY: number;
  facing: 'left' | 'right';
  isPaused: boolean;
  lastInteractionAt: number;
  lastAlertAt: number;
  lastAlertKey: string | null;

  setPetState: (state: PetState) => void;
  setAnimation: (animation: PetAnimation) => void;
  setFrameSrc: (src: string) => void;
  showSpeech: (message: string, durationMs?: number) => void;
  hideSpeech: () => void;
  setCursorPosition: (position: CursorPosition) => void;
  setCursorDistance: (distance: number) => void;
  setAttentionSnapshot: (snapshot: AttentionSnapshot) => void;
  setSettings: (settings: AppSettings) => void;
  updateStats: (partial: Partial<PetStats>) => void;
  setPetOffset: (x: number, y: number) => void;
  setFacing: (facing: 'left' | 'right') => void;
  setPaused: (paused: boolean) => void;
  touchInteraction: () => void;
  markAlerted: (key: string) => void;
  resetAlertKey: () => void;
}

export const usePetStore = create<PetStore>((set, get) => ({
  petState: 'idle',
  currentAnimation: 'idle',
  currentFrameSrc: '',
  speechMessage: null,
  speechVisible: false,
  cursorPosition: { x: 0, y: 0 },
  cursorDistance: Infinity,
  attentionSnapshot: emptySnapshot(),
  previousActiveSignal: null,
  settings: null,
  stats: { energy: 70, happiness: 75, attention: 50 },
  petOffsetX: 0,
  petOffsetY: 0,
  facing: 'right',
  isPaused: false,
  lastInteractionAt: Date.now(),
  lastAlertAt: 0,
  lastAlertKey: null,

  setPetState: (petState) => set({ petState }),
  setAnimation: (currentAnimation) => set({ currentAnimation }),
  setFrameSrc: (currentFrameSrc) => set({ currentFrameSrc }),
  showSpeech: (message, durationMs = 3000) => {
    set({ speechMessage: message, speechVisible: true });
    setTimeout(() => {
      const current = get();
      if (current.speechMessage === message) {
        set({ speechVisible: false, speechMessage: null });
      }
    }, durationMs);
  },
  hideSpeech: () => set({ speechVisible: false, speechMessage: null }),
  setCursorPosition: (cursorPosition) => set({ cursorPosition }),
  setCursorDistance: (cursorDistance) => set({ cursorDistance }),
  setAttentionSnapshot: (attentionSnapshot) =>
    set((state) => ({
      previousActiveSignal: state.attentionSnapshot.active,
      attentionSnapshot,
    })),
  setSettings: (settings) => set({ settings }),
  updateStats: (partial) =>
    set((state) => ({ stats: { ...state.stats, ...partial } })),
  setPetOffset: (petOffsetX, petOffsetY) => set({ petOffsetX, petOffsetY }),
  setFacing: (facing) => set({ facing }),
  setPaused: (isPaused) => set({ isPaused }),
  touchInteraction: () => set({ lastInteractionAt: Date.now() }),
  markAlerted: (key) => set({ lastAlertAt: Date.now(), lastAlertKey: key }),
  resetAlertKey: () => set({ lastAlertKey: null }),
}));
