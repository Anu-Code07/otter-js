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
    meeting: createIdleSignal('meeting'),
    integration: createIdleSignal('integration'),
  },
});

export interface PetStore {
  petState: PetState;
  currentAnimation: PetAnimation;
  currentFrameSrc: string;
  speechMessage: string | null;
  speechVisible: boolean;
  attentionPopVisible: boolean;
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
  isDragging: boolean;
  lastInteractionAt: number;
  lastAlertAt: number;
  lastAlertKey: string | null;

  setPetState: (state: PetState) => void;
  setAnimation: (animation: PetAnimation) => void;
  setFrameSrc: (src: string) => void;
  showSpeech: (message: string, durationMs?: number) => void;
  hideSpeech: () => void;
  showAttentionPop: (durationMs?: number) => void;
  hideAttentionPop: () => void;
  setCursorPosition: (position: CursorPosition) => void;
  setCursorDistance: (distance: number) => void;
  setAttentionSnapshot: (snapshot: AttentionSnapshot) => void;
  setSettings: (settings: AppSettings) => void;
  updateStats: (partial: Partial<PetStats>) => void;
  setPetOffset: (x: number, y: number) => void;
  setFacing: (facing: 'left' | 'right') => void;
  setPaused: (paused: boolean) => void;
  setDragging: (dragging: boolean) => void;
  touchInteraction: () => void;
  markAlerted: (key: string) => void;
  resetAlertKey: () => void;
}

let speechTimer: ReturnType<typeof setTimeout> | null = null;
let attentionTimer: ReturnType<typeof setTimeout> | null = null;

function signalsEqual(a: AttentionSignal | null, b: AttentionSignal | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.sourceId === b.sourceId &&
    a.status === b.status &&
    a.priority === b.priority &&
    a.message === b.message &&
    a.title === b.title
  );
}

export const usePetStore = create<PetStore>((set, get) => ({
  petState: 'idle',
  currentAnimation: 'idle',
  currentFrameSrc: '',
  speechMessage: null,
  speechVisible: false,
  attentionPopVisible: false,
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
  isDragging: false,
  lastInteractionAt: Date.now(),
  lastAlertAt: 0,
  lastAlertKey: null,

  setPetState: (petState) => set({ petState }),
  setAnimation: (currentAnimation) => set({ currentAnimation }),
  setFrameSrc: (currentFrameSrc) => set({ currentFrameSrc }),
  showSpeech: (message, durationMs = 3000) => {
    if (speechTimer) {
      clearTimeout(speechTimer);
      speechTimer = null;
    }
    set({ speechMessage: message, speechVisible: true });
    speechTimer = setTimeout(() => {
      speechTimer = null;
      const current = get();
      if (current.speechMessage === message) {
        set({ speechVisible: false, speechMessage: null });
      }
    }, durationMs);
  },
  hideSpeech: () => {
    if (speechTimer) {
      clearTimeout(speechTimer);
      speechTimer = null;
    }
    set({ speechVisible: false, speechMessage: null });
  },
  showAttentionPop: (durationMs = 3500) => {
    if (attentionTimer) {
      clearTimeout(attentionTimer);
      attentionTimer = null;
    }
    set({ attentionPopVisible: true });
    attentionTimer = setTimeout(() => {
      attentionTimer = null;
      if (get().attentionPopVisible) {
        set({ attentionPopVisible: false });
      }
    }, durationMs);
  },
  hideAttentionPop: () => {
    if (attentionTimer) {
      clearTimeout(attentionTimer);
      attentionTimer = null;
    }
    set({ attentionPopVisible: false });
  },
  setCursorPosition: (cursorPosition) =>
    set((state) => {
      if (
        state.cursorPosition.x === cursorPosition.x &&
        state.cursorPosition.y === cursorPosition.y
      ) {
        return state;
      }
      return { cursorPosition };
    }),
  setCursorDistance: (cursorDistance) => set({ cursorDistance }),
  setAttentionSnapshot: (attentionSnapshot) =>
    set((state) => {
      if (
        signalsEqual(state.attentionSnapshot.active, attentionSnapshot.active) &&
        state.attentionSnapshot.topPriority === attentionSnapshot.topPriority
      ) {
        return state;
      }
      return {
        previousActiveSignal: state.attentionSnapshot.active,
        attentionSnapshot,
      };
    }),
  setSettings: (settings) => set({ settings }),
  updateStats: (partial) =>
    set((state) => ({ stats: { ...state.stats, ...partial } })),
  setPetOffset: (petOffsetX, petOffsetY) => set({ petOffsetX, petOffsetY }),
  setFacing: (facing) => set({ facing }),
  setPaused: (isPaused) => set({ isPaused }),
  setDragging: (isDragging) => set({ isDragging }),
  touchInteraction: () => set({ lastInteractionAt: Date.now() }),
  markAlerted: (key) => set({ lastAlertAt: Date.now(), lastAlertKey: key }),
  resetAlertKey: () => set({ lastAlertKey: null }),
}));
