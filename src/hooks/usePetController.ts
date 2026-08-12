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

export function usePetController(): {
  frameSrc: string;
  animation: PetAnimation;
  petState: PetState;
} {
  const store = usePetStore();
  const engineRef = useRef<AnimationEngine | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const prevSignalRef = useRef<AttentionSignal | null>(null);
  const [frameSrc, setFrameSrc] = useState('');

  const petDefinition = getPetDefinition(store.settings?.selectedPetId ?? 'otter');

  const playAnimation = useCallback((animation: PetAnimation, restart = true) => {
    store.setAnimation(animation);
    engineRef.current?.play(animation, restart);
  }, [store]);

  const transitionTo = useCallback((state: PetState) => {
    store.setPetState(state);
    const facing = usePetStore.getState().facing;
    playAnimation(animationForState(state, facing));
  }, [store, playAnimation]);

  const handleAttentionAlert = useCallback((signal: AttentionSignal) => {
    const settings = usePetStore.getState().settings;
    if (!settings || !isSourceAlertsEnabled(signal.sourceId, settings)) return;
    if (isInDoNotDisturb(settings.doNotDisturbEnabled, settings.doNotDisturbStart, settings.doNotDisturbEnd)) {
      return;
    }

    const key = attentionAlertKey(signal);
    store.markAlerted(key);
    transitionTo('alert');
    playAnimation('alert');

    if (settings.alertMessages) {
      store.showSpeech(getAlertMessage(signal), 4000);
    }

    if (settings.desktopNotifications) {
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
  }, [store, transitionTo, playAnimation]);

  const processSnapshot = useCallback((snapshot: AttentionSnapshot) => {
    const prev = prevSignalRef.current ?? usePetStore.getState().attentionSnapshot.active;
    const active = snapshot.active;
    store.setAttentionSnapshot(snapshot);

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
          if (!isNeedsUserStatus(active.status) || mapped === 'claude_waiting' || mapped === 'attention_waiting') {
            transitionTo(mapped);
          }
        }
      }
    }

    prevSignalRef.current = active;
  }, [store, transitionTo, handleAttentionAlert]);

  useEffect(() => {
    const engine = new AnimationEngine(petDefinition.animations);
    engineRef.current = engine;
    engine.setOnFrameChange((src, anim) => {
      setFrameSrc(src);
      store.setFrameSrc(src);
      store.setAnimation(anim);
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
  }, [store, petDefinition]);

  useEffect(() => {
    void ipc().settings.get().then(store.setSettings);
    const unsubSettings = ipc().settings.onChange(store.setSettings);
    const unsubCursor = ipc().cursor.onMove(store.setCursorPosition);
    const unsubAttention = ipc().attention.onSnapshotChange(processSnapshot);

    return () => {
      unsubSettings();
      unsubCursor();
      unsubAttention();
    };
  }, [store, processSnapshot]);

  useEffect(() => {
    const updateDistance = async () => {
      const bounds = await ipc().window.getBounds();
      const petCenter = {
        x: bounds.x + PET_CENTER_OFFSET,
        y: bounds.y + PET_CENTER_OFFSET,
      };
      store.setCursorDistance(distanceBetween(petCenter, store.cursorPosition));
    };
    void updateDistance();
  }, [store.cursorPosition, store]);

  useEffect(() => {
    if (store.isPaused) return;
    const settings = store.settings;
    if (!settings) return;

    const inactive = Date.now() - store.lastInteractionAt > settings.inactivityTimeoutMs;
    if (settings.sleepWhenInactive && inactive && store.petState !== 'sleeping') {
      if (!isBusyPetState(store.petState)) {
        playAnimation('yawn', true);
        setTimeout(() => transitionTo('sleeping'), 1500);
      }
      return;
    }

    if (isBusyPetState(store.petState)) return;

    const level = cursorReactionLevel(store.cursorDistance);
    const personality = petDefinition.personality;

    if (settings.followCursor && level !== 'far') {
      if (Math.random() < personality.ignoreCursorChance) return;
      if (level === 'interact') {
        if (Math.random() < 0.3) {
          store.showSpeech('oh?', 1500);
          playAnimation('curious');
        }
        return;
      }
      if (level === 'approach' && Math.random() < settings.interactionFrequency) {
        store.setFacing(store.cursorPosition.x < (window.screen?.width ?? 1920) / 2 ? 'left' : 'right');
        transitionTo('following_cursor');
        return;
      }
      if (level === 'look') playAnimation('curious', true);
    }
  }, [store.cursorDistance, store.settings, store.isPaused, store.petState, store, transitionTo, playAnimation, petDefinition]);

  useEffect(() => {
    if (store.isPaused || !store.settings?.randomWandering) return;
    if (isBusyPetState(store.petState)) return;

    const scheduleIdle = () => {
      const delay = 3000 + Math.random() * 5000;
      idleTimerRef.current = setTimeout(() => {
        const { petState, stats } = usePetStore.getState();
        if (petState !== 'idle' && petState !== 'following_cursor') {
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
            store.updateStats({ happiness: Math.min(100, stats.happiness + 2) });
            break;
          case 'sit':
            playAnimation('sit', true);
            break;
          case 'look_left':
          case 'look_right':
            store.setFacing(picked.action === 'look_left' ? 'left' : 'right');
            playAnimation('look_around', true);
            break;
          default:
            playAnimation(picked.action as PetAnimation, true);
        }
        scheduleIdle();
      }, delay);
    };
    scheduleIdle();
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [store.isPaused, store.settings, store.petState, store, transitionTo, playAnimation, petDefinition]);

  return {
    frameSrc,
    animation: store.currentAnimation,
    petState: store.petState,
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
