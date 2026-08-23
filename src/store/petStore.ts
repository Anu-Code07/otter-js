import { create } from 'zustand';
import type { AttentionSnapshot, AttentionSignal } from '../types/attention';
import type { CursorPosition } from '../types/system';
import type { AppSettings } from '../types/system';
import type { PetAnimation, PetState, PetStats } from '../types/pet';
import { createIdleSignal } from '../services/attentionLogic';
import { personalizeMessage } from '../services/moodLogic';

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
    github: createIdleSignal('github'),
    calendar: createIdleSignal('calendar'),
  },
});

export type SpeechKind = 'chat' | 'alert';

export interface PetStore {
  petState: PetState;
  currentAnimation: PetAnimation;
  currentFrameSrc: string;
  speechMessage: string | null;
  speechVisible: boolean;
  speechKind: SpeechKind;
  attentionPopVisible: boolean;
  activeAlert: AttentionSignal | null;
  cursorPosition: CursorPosition;
  cursorDistance: number;
  attentionSnapshot: AttentionSnapshot;
  previousActiveSignal: AttentionSignal | null;
  settings: AppSettings | null;
  stats: PetStats;
  petOffsetX: number;
  petOffsetY: number;
  facing: 'left' | 'right';
  isDragging: boolean;
  lastInteractionAt: number;
  lastAlertAt: number;
  lastAlertKey: string | null;
  snoozeUntil: number | null;
  pomodoroPhase: 'idle' | 'work' | 'break';
  pomodoroEndsAt: number | null;

  setPetState: (state: PetState) => void;
  setAnimation: (animation: PetAnimation) => void;
  setFrameSrc: (src: string) => void;
  showSpeech: (message: string, durationMs?: number, kind?: SpeechKind) => void;
  hideSpeech: () => void;
  showAlert: (signal: AttentionSignal, durationMs?: number) => void;
  hideAlert: () => void;
  showAttentionPop: (durationMs?: number) => void;
  hideAttentionPop: () => void;
  setCursorPosition: (position: CursorPosition) => void;
  setCursorDistance: (distance: number) => void;
  setAttentionSnapshot: (snapshot: AttentionSnapshot) => void;
  setSettings: (settings: AppSettings) => void;
  updateStats: (partial: Partial<PetStats>) => void;
  setPetOffset: (x: number, y: number) => void;
  setFacing: (facing: 'left' | 'right') => void;
  setDragging: (dragging: boolean) => void;
  touchInteraction: () => void;
  markAlerted: (key: string) => void;
  resetAlertKey: () => void;
  snoozeAlerts: (durationMs: number) => void;
  isSnoozed: () => boolean;
  startPomodoro: (phase: 'work' | 'break', durationMinutes: number) => void;
  clearPomodoro: () => void;
}

let speechTimer: ReturnType<typeof setTimeout> | null = null;
let attentionTimer: ReturnType<typeof setTimeout> | null = null;
let alertTimer: ReturnType<typeof setTimeout> | null = null;

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
  speechKind: 'chat',
  attentionPopVisible: false,
  activeAlert: null,
  cursorPosition: { x: 0, y: 0 },
  cursorDistance: Infinity,
  attentionSnapshot: emptySnapshot(),
  previousActiveSignal: null,
  settings: null,
  stats: { energy: 70, happiness: 75, attention: 50 },
  petOffsetX: 0,
  petOffsetY: 0,
  facing: 'right',
  isDragging: false,
  lastInteractionAt: Date.now(),
  lastAlertAt: 0,
  lastAlertKey: null,
  snoozeUntil: null,
  pomodoroPhase: 'idle',
  pomodoroEndsAt: null,

  setPetState: (petState) => set({ petState }),
  setAnimation: (currentAnimation) => set({ currentAnimation }),
  setFrameSrc: (currentFrameSrc) => set({ currentFrameSrc }),
  showSpeech: (message, durationMs = 3000, kind = 'chat') => {
    if (speechTimer) {
      clearTimeout(speechTimer);
      speechTimer = null;
    }
    const personalized = personalizeMessage(message, get().settings?.petName);
    set({ speechMessage: personalized, speechVisible: true, speechKind: kind });
    speechTimer = setTimeout(() => {
      speechTimer = null;
      const current = get();
      if (current.speechMessage === personalized) {
        set({ speechVisible: false, speechMessage: null, speechKind: 'chat' });
      }
    }, durationMs);
  },
  hideSpeech: () => {
    if (speechTimer) {
      clearTimeout(speechTimer);
      speechTimer = null;
    }
    set({ speechVisible: false, speechMessage: null, speechKind: 'chat' });
  },
  showAlert: (signal, durationMs = 5000) => {
    if (alertTimer) {
      clearTimeout(alertTimer);
      alertTimer = null;
    }
    set({ activeAlert: signal, attentionPopVisible: true });
    alertTimer = setTimeout(() => {
      alertTimer = null;
      get().hideAlert();
    }, durationMs);
  },
  hideAlert: () => {
    if (alertTimer) {
      clearTimeout(alertTimer);
      alertTimer = null;
    }
    set({ activeAlert: null, attentionPopVisible: false });
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
  setDragging: (isDragging) => set({ isDragging }),
  touchInteraction: () => set({ lastInteractionAt: Date.now() }),
  markAlerted: (key) => set({ lastAlertAt: Date.now(), lastAlertKey: key }),
  resetAlertKey: () => set({ lastAlertKey: null }),
  snoozeAlerts: (durationMs) => set({ snoozeUntil: Date.now() + durationMs }),
  isSnoozed: () => {
    const until = get().snoozeUntil;
    return until !== null && Date.now() < until;
  },
  startPomodoro: (phase, durationMinutes) =>
    set({
      pomodoroPhase: phase,
      pomodoroEndsAt: Date.now() + durationMinutes * 60_000,
    }),
  clearPomodoro: () => set({ pomodoroPhase: 'idle', pomodoroEndsAt: null }),
}));
