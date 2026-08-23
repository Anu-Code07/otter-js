import { useEffect, useRef, useCallback } from 'react';
import { usePetStore } from '../store/petStore';
import { decayStats } from '../services/moodLogic';
import { ipc } from '../services/ipc';
import { isBusyPetState } from '../services/petLogic';

const DECAY_INTERVAL_MS = 60_000;
const STANDUP_CHECK_MS = 60_000;
const STRETCH_MESSAGES = [
  'stretch time — stand up!',
  'you have been coding forever',
  'break check: shoulders back',
  'hydrate and stretch pls',
  '2 hours? touch grass',
];

const STANDUP_MESSAGES = [
  'standup time — what are you shipping?',
  'daily standup — quick sync?',
  'morning! standup o clock',
];

export function useWellnessController(): void {
  const settings = usePetStore((s) => s.settings);
  const lastInteractionAt = usePetStore((s) => s.lastInteractionAt);
  const pomodoroPhase = usePetStore((s) => s.pomodoroPhase);
  const pomodoroEndsAt = usePetStore((s) => s.pomodoroEndsAt);
  const petState = usePetStore((s) => s.petState);

  const sessionStartRef = useRef(Date.now());
  const stretchSentRef = useRef(false);
  const standupDateRef = useRef<string | null>(null);
  const pomodoroHandledRef = useRef<string | null>(null);

  const touchSession = useCallback(() => {
    sessionStartRef.current = Date.now();
    stretchSentRef.current = false;
    usePetStore.getState().touchInteraction();
  }, []);

  useEffect(() => {
    if (lastInteractionAt > sessionStartRef.current) {
      sessionStartRef.current = lastInteractionAt;
      stretchSentRef.current = false;
    }
  }, [lastInteractionAt]);

  useEffect(() => {
    const decayId = setInterval(() => {
      const store = usePetStore.getState();
      if (isBusyPetState(store.petState)) return;
      store.updateStats(decayStats(store.stats));
    }, DECAY_INTERVAL_MS);
    return () => clearInterval(decayId);
  }, []);

  useEffect(() => {
    if (!settings?.stretchReminderEnabled || settings.focusModeEnabled) return;

    const checkId = setInterval(() => {
      const store = usePetStore.getState();
      if (stretchSentRef.current || isBusyPetState(store.petState)) return;

      const elapsedMin = (Date.now() - sessionStartRef.current) / 60_000;
      if (elapsedMin < settings.stretchReminderMinutes) return;

      stretchSentRef.current = true;
      const message = STRETCH_MESSAGES[Math.floor(Math.random() * STRETCH_MESSAGES.length)];
      store.showSpeech(message, 3500);
      store.setAnimation('stretch');
      store.touchInteraction();
    }, 30_000);

    return () => clearInterval(checkId);
  }, [settings?.stretchReminderEnabled, settings?.stretchReminderMinutes, settings?.focusModeEnabled]);

  useEffect(() => {
    if (!settings?.standupReminderEnabled || settings.focusModeEnabled) return;

    const checkId = setInterval(() => {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      if (standupDateRef.current === today) return;

      const [h, m] = settings.standupReminderTime.split(':').map(Number);
      if (now.getHours() !== h || now.getMinutes() !== m) return;

      standupDateRef.current = today;
      const store = usePetStore.getState();
      const message = STANDUP_MESSAGES[Math.floor(Math.random() * STANDUP_MESSAGES.length)];
      store.showSpeech(message, 4000);
      store.setAnimation('wave');
    }, STANDUP_CHECK_MS);

    return () => clearInterval(checkId);
  }, [settings?.standupReminderEnabled, settings?.standupReminderTime, settings?.focusModeEnabled]);

  useEffect(() => {
    if (pomodoroPhase === 'idle' || !pomodoroEndsAt) return;

    const tickId = setInterval(() => {
      const store = usePetStore.getState();
      const endsAt = store.pomodoroEndsAt;
      if (!endsAt) return;

      const phaseKey = `${store.pomodoroPhase}-${endsAt}`;
      if (Date.now() < endsAt) return;
      if (pomodoroHandledRef.current === phaseKey) return;

      pomodoroHandledRef.current = phaseKey;
      const settingsNow = store.settings;
      if (!settingsNow) return;

      if (store.pomodoroPhase === 'work') {
        store.showSpeech('focus block done — break time!', 3500);
        store.setAnimation('celebrate');
        store.startPomodoro('break', settingsNow.pomodoroBreakMinutes);
        if (settingsNow.desktopNotifications) {
          void ipc().system.showNotification('PixelPaw', 'Pomodoro break — stretch!');
        }
      } else {
        store.showSpeech('break over — back to focus!', 3500);
        store.setAnimation('excited');
        store.clearPomodoro();
        if (settingsNow.desktopNotifications) {
          void ipc().system.showNotification('PixelPaw', 'Break ended — ready to focus?');
        }
      }
    }, 1000);

    return () => clearInterval(tickId);
  }, [pomodoroPhase, pomodoroEndsAt]);

  useEffect(() => {
    return ipc().system.onTrayAction((action) => {
      const store = usePetStore.getState();
      const s = store.settings;
      if (!s) return;

      switch (action) {
        case 'toggle-focus':
          void ipc().settings.set({ focusModeEnabled: !s.focusModeEnabled });
          break;
        case 'pomodoro-start':
          pomodoroHandledRef.current = null;
          store.startPomodoro('work', s.pomodoroWorkMinutes);
          store.showSpeech(`focus mode: ${s.pomodoroWorkMinutes} min`, 2500);
          store.setAnimation('thinking');
          touchSession();
          break;
        case 'pomodoro-stop':
          pomodoroHandledRef.current = null;
          store.clearPomodoro();
          store.showSpeech('pomodoro stopped', 2000);
          break;
        default:
          break;
      }
    });
  }, [touchSession]);

  useEffect(() => {
    if (!settings?.focusModeEnabled) return;
    const store = usePetStore.getState();
    if (!isBusyPetState(petState)) {
      store.setAnimation('sit');
    }
  }, [settings?.focusModeEnabled, petState]);
}
