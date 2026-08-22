import { useEffect, useRef, useCallback, useState } from 'react';
import { usePetStore } from '../store/petStore';
import { AnimationEngine } from '../animations/AnimationEngine';
import { getPetDefinition } from '../pets/registry';
import {
  animationForState,
  attentionSignalToPetState,
  cursorReactionLevel,
  distanceBetween,
  getAlertMessage,
  isBusyPetState,
  pickWeighted,
} from '../services/petLogic';
import {
  attentionAlertKey,
  isInDoNotDisturb,
  isNeedsUserStatus,
  isSourceAlertsEnabled,
  isSuccessStatus,
  shouldResetAttentionAlert,
  shouldTriggerAttentionAlert,
} from '../services/attentionLogic';
import { ipc } from '../services/ipc';
import type { AttentionSignal, AttentionSnapshot } from '../types/attention';
import type { PetAnimation, PetState } from '../types/pet';

const PET_CENTER_OFFSET = 48;
const FOLLOW_STEP_PX = 12;
const CURSOR_ACTIVITY_THRESHOLD = 15;

export function usePetController(): {
  frameSrc: string;
  animation: PetAnimation;
  petState: PetState;
} {
  const currentAnimation = usePetStore((s) => s.currentAnimation);
  const petState = usePetStore((s) => s.petState);
  const cursorPosition = usePetStore((s) => s.cursorPosition);
  const cursorDistance = usePetStore((s) => s.cursorDistance);
  const isPaused = usePetStore((s) => s.isPaused);
  const isDragging = usePetStore((s) => s.isDragging);
  const lastInteractionAt = usePetStore((s) => s.lastInteractionAt);
  const settings = usePetStore((s) => s.settings);
  const selectedPetId = usePetStore((s) => s.settings?.selectedPetId ?? 'otter');

  const engineRef = useRef<AnimationEngine | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const prevSignalRef = useRef<AttentionSignal | null>(null);
  const [frameSrc, setFrameSrc] = useState('');

  const petDefinition = getPetDefinition(selectedPetId);

  const playAnimation = useCallback((animation: PetAnimation, restart = true) => {
    usePetStore.getState().setAnimation(animation);
    engineRef.current?.play(animation, restart);
  }, []);

  const transitionTo = useCallback((state: PetState) => {
    const store = usePetStore.getState();
    const facing = store.facing;
    const animation = animationForState(state, facing);
    if (store.petState !== state) {
      store.setPetState(state);
    }
    if (store.currentAnimation !== animation) {
      playAnimation(animation);
    }
  }, [playAnimation]);

  const handleAttentionAlert = useCallback((signal: AttentionSignal) => {
    const store = usePetStore.getState();
    if (!store.settings || !isSourceAlertsEnabled(signal.sourceId, store.settings)) return;
    if (
      isInDoNotDisturb(
        store.settings.doNotDisturbEnabled,
        store.settings.doNotDisturbStart,
        store.settings.doNotDisturbEnd,
      )
    ) {
      return;
    }

    const key = attentionAlertKey(signal);
    store.markAlerted(key);
    transitionTo('alert');
    playAnimation('alert');

    if (store.settings.alertMessages) {
      store.showSpeech(getAlertMessage(signal), 4000);
    }

    if (store.settings.desktopNotifications) {
      const title = signal.title ?? 'PixelPaw';
      const body = signal.message ?? 'Something needs your attention.';
      void ipc().system.showNotification(title, body);
    }

    setTimeout(() => {
      const current = usePetStore.getState().attentionSnapshot.active;
      if (current && isNeedsUserStatus(current.status)) {
        transitionTo(attentionSignalToPetState(current) ?? 'attention_waiting');
      }
    }, 3000);
  }, [transitionTo, playAnimation]);

  const processSnapshot = useCallback((snapshot: AttentionSnapshot) => {
    const store = usePetStore.getState();
    const prev = prevSignalRef.current ?? store.attentionSnapshot.active;
    const active = snapshot.active;
    store.setAttentionSnapshot(snapshot);

    if (store.petState === 'in_meeting' && (!active || active.sourceId !== 'meeting')) {
      transitionTo('idle');
    }

    if (active && prev && shouldResetAttentionAlert(prev, active)) {
      store.resetAlertKey();
    }

    const settings = usePetStore.getState().settings;
    const prevForAlert = prev ?? createFallbackSignal();
    const currentForAlert = active ?? createFallbackSignal();

    if (
      active &&
      settings &&
      isSourceAlertsEnabled(active.sourceId, settings) &&
      shouldTriggerAttentionAlert(prevForAlert, currentForAlert, usePetStore.getState().lastAlertKey)
    ) {
      handleAttentionAlert(active);
    } else if (active && !usePetStore.getState().isPaused) {
      if (isSuccessStatus(active.status)) {
        store.showSpeech('✨', 1500);
        transitionTo('excited');
        store.updateStats({ happiness: Math.min(100, usePetStore.getState().stats.happiness + 5) });
        setTimeout(() => transitionTo('idle'), 2000);
      } else {
        const mapped = attentionSignalToPetState(active);
        if (mapped && mapped !== 'alert') {
          const wasWaiting = prev && isNeedsUserStatus(prev.status);
          const nowWorking = active.status === 'working';
          if (wasWaiting && nowWorking) {
            store.showSpeech('👍', 1500);
          }
          if (
            !isNeedsUserStatus(active.status) ||
            mapped === 'claude_waiting' ||
            mapped === 'attention_waiting'
          ) {
            transitionTo(mapped);
          }
        }
      }
    }

    prevSignalRef.current = active;
  }, [transitionTo, handleAttentionAlert]);

  useEffect(() => {
    const engine = new AnimationEngine(petDefinition.animations);
    engineRef.current = engine;
    engine.setOnFrameChange((src, anim) => {
      setFrameSrc(src);
      const store = usePetStore.getState();
      store.setFrameSrc(src);
      if (store.currentAnimation !== anim) {
        store.setAnimation(anim);
      }
    });
    engine.play('idle');

    const loop = (time: number) => {
      const delta = lastTimeRef.current ? time - lastTimeRef.current : 0;
      lastTimeRef.current = time;
      engine.update(delta);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [petDefinition]);

  useEffect(() => {
    void ipc().settings.get().then(usePetStore.getState().setSettings);
    const unsubSettings = ipc().settings.onChange(usePetStore.getState().setSettings);
    const unsubCursor = ipc().cursor.onMove((position) => {
      const store = usePetStore.getState();
      const prev = store.cursorPosition;
      if (distanceBetween(prev, position) >= CURSOR_ACTIVITY_THRESHOLD) {
        store.touchInteraction();
      }
      store.setCursorPosition(position);
    });
    const unsubAttention = ipc().attention.onSnapshotChange(processSnapshot);

    return () => {
      unsubSettings();
      unsubCursor();
      unsubAttention();
    };
  }, [processSnapshot]);

  useEffect(() => {
    const updateDistance = async () => {
      const bounds = await ipc().window.getBounds();
      const petCenter = {
        x: bounds.x + PET_CENTER_OFFSET,
        y: bounds.y + PET_CENTER_OFFSET,
      };
      const position = usePetStore.getState().cursorPosition;
      usePetStore.getState().setCursorDistance(distanceBetween(petCenter, position));
    };
    void updateDistance();
  }, [cursorPosition]);

  useEffect(() => {
    if (isPaused || isDragging) return;
    if (!settings?.followCursor) return;

    const intervalId = setInterval(() => {
      const state = usePetStore.getState();
      if (state.isPaused || state.isDragging || !state.settings?.followCursor) return;
      if (isBusyPetState(state.petState)) return;

      const level = cursorReactionLevel(state.cursorDistance);
      if (level === 'far') return;

      void (async () => {
        const bounds = await ipc().window.getBounds();
        const targetX = state.cursorPosition.x - PET_CENTER_OFFSET;
        const targetY = state.cursorPosition.y - PET_CENTER_OFFSET;
        const dx = targetX - bounds.x;
        const dy = targetY - bounds.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 6) return;

        const step = Math.min(dist, FOLLOW_STEP_PX);
        const newX = bounds.x + (dx / dist) * step;
        const newY = bounds.y + (dy / dist) * step;
        void ipc().window.setBounds({ x: Math.round(newX), y: Math.round(newY) });

        const petCenter = {
          x: Math.round(newX) + PET_CENTER_OFFSET,
          y: Math.round(newY) + PET_CENTER_OFFSET,
        };
        state.setCursorDistance(distanceBetween(petCenter, state.cursorPosition));
      })();
    }, 50);

    return () => clearInterval(intervalId);
  }, [isPaused, isDragging, settings?.followCursor]);

  useEffect(() => {
    if (isPaused) return;
    if (!settings) return;

    const inactive = Date.now() - lastInteractionAt > settings.inactivityTimeoutMs;
    if (settings.sleepWhenInactive && inactive && petState !== 'sleeping') {
      if (!isBusyPetState(petState)) {
        playAnimation('yawn', true);
        setTimeout(() => transitionTo('sleeping'), 1500);
      }
      return;
    }

    if (isBusyPetState(petState)) return;

    const level = cursorReactionLevel(cursorDistance);
    const personality = petDefinition.personality;

    if (settings.followCursor && level !== 'far') {
      if (Math.random() < personality.ignoreCursorChance) return;
      if (level === 'interact') {
        if (Math.random() < personality.curiosityChance) {
          usePetStore.getState().showSpeech('oh?', 1500);
          playAnimation('curious');
        }
        return;
      }
      if (level === 'approach' && Math.random() < settings.interactionFrequency) {
        void ipc().window.getBounds().then((bounds) => {
          usePetStore.getState().setFacing(
            cursorPosition.x < bounds.x + PET_CENTER_OFFSET ? 'left' : 'right',
          );
        });
        transitionTo('following_cursor');
        return;
      }
      if (level === 'look') playAnimation('curious', true);
    }
  }, [
    cursorDistance,
    settings,
    isPaused,
    petState,
    isDragging,
    cursorPosition.x,
    lastInteractionAt,
    transitionTo,
    playAnimation,
    petDefinition,
  ]);

  useEffect(() => {
    if (isPaused || !settings?.randomWandering) return;
    if (isBusyPetState(petState)) return;

    const scheduleIdle = () => {
      const delay = 3000 + Math.random() * 5000;
      idleTimerRef.current = setTimeout(() => {
        const { petState: currentState, stats } = usePetStore.getState();
        if (currentState !== 'idle' && currentState !== 'following_cursor') {
          scheduleIdle();
          return;
        }
        const behaviours = petDefinition.personality.idleBehaviours.map((b) => ({
          ...b,
          weight: b.weight * (stats.energy / 100 + 0.5),
        }));
        const picked = pickWeighted(behaviours);
        switch (picked.action) {
          case 'walk':
            transitionTo('walking');
            setTimeout(() => transitionTo('idle'), 2000);
            break;
          case 'sleep':
            if (usePetStore.getState().settings?.sleepWhenInactive) {
              playAnimation('yawn');
              setTimeout(() => transitionTo('sleeping'), 1200);
            }
            break;
          case 'play':
            playAnimation('excited', true);
            usePetStore.getState().updateStats({ happiness: Math.min(100, stats.happiness + 2) });
            break;
          case 'sit':
            playAnimation('sit', true);
            break;
          case 'look_left':
          case 'look_right':
            usePetStore.getState().setFacing(picked.action === 'look_left' ? 'left' : 'right');
            playAnimation('look_around', true);
            break;
          default:
            playAnimation(picked.action as PetAnimation, true);
        }
        scheduleIdle();
      }, delay);
    };
    scheduleIdle();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isPaused, settings?.randomWandering, petState, transitionTo, playAnimation, petDefinition]);

  return {
    frameSrc,
    animation: currentAnimation,
    petState,
  };
}

function createFallbackSignal(): AttentionSignal {
  return {
    sourceId: 'integration',
    status: 'idle',
    priority: 'low',
    timestamp: Date.now(),
  };
}
