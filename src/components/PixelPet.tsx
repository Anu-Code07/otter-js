import { useCallback, useEffect, useRef, useState } from 'react';
import { usePetStore } from '../store/petStore';
import { usePetController } from '../hooks/usePetController';
import { ipc } from '../services/ipc';
import { idleSpritePath } from '../services/assetPaths';
import { getPetDefinition } from '../pets/registry';
import { SpeechBubble } from './SpeechBubble';
import { AttentionPop } from './AttentionPop';
import { PetContextMenu } from './PetContextMenu';
import { AvatarPickerMenu } from './AvatarPickerMenu';
import type { PetAnimation } from '../types/pet';

const DRAG_THRESHOLD_PX = 6;
const CLICK_WINDOW_MS = 400;

type PointerSession = {
  active: boolean;
  dragging: boolean;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  pointerId: number;
  clickCount: number;
  clickTimer: ReturnType<typeof setTimeout> | null;
};

function createPointerSession(): PointerSession {
  return {
    active: false,
    dragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    pointerId: -1,
    clickCount: 0,
    clickTimer: null,
  };
}

export function PixelPet(): JSX.Element | null {
  const { frameSrc } = usePetController();
  const settings = usePetStore((s) => s.settings);
  const speechVisible = usePetStore((s) => s.speechVisible);
  const speechMessage = usePetStore((s) => s.speechMessage);
  const attentionPopVisible = usePetStore((s) => s.attentionPopVisible);
  const selectedPetId = usePetStore((s) => s.settings?.selectedPetId ?? 'otter');
  const isPaused = usePetStore((s) => s.isPaused);
  const petState = usePetStore((s) => s.petState);
  const isDragging = usePetStore((s) => s.isDragging);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const pointerRef = useRef<PointerSession>(createPointerSession());

  const size = settings?.petSize ?? 180;
  const opacity = settings?.petOpacity ?? 1;

  const clearClickTimer = useCallback(() => {
    const session = pointerRef.current;
    if (session.clickTimer) {
      clearTimeout(session.clickTimer);
      session.clickTimer = null;
    }
    session.clickCount = 0;
  }, []);

  const handleMouseEnter = useCallback(() => {
    void ipc().window.setPetInteractive(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!pointerRef.current.dragging) {
      void ipc().window.setPetInteractive(false);
    }
  }, []);

  const runClickReaction = useCallback(() => {
    const store = usePetStore.getState();
    const petId = store.settings?.selectedPetId ?? 'otter';
    const definition = getPetDefinition(petId);
    store.touchInteraction();
    const reactions = definition.personality.clickReactions;
    const reaction = reactions[Math.floor(Math.random() * reactions.length)] as PetAnimation;
    store.setAnimation(reaction);

    if (Math.random() < 0.35) {
      const messages = definition.personality.clickMessages;
      store.showSpeech(messages[Math.floor(Math.random() * messages.length)], 2000);
    }

    if (reaction === 'excited' || reaction === 'happy') {
      store.updateStats({ happiness: Math.min(100, store.stats.happiness + 3) });
    }
    if (reaction === 'annoyed') {
      store.setPetState('annoyed');
    } else {
      store.setPetState('idle');
    }
  }, []);

  const runCelebrateReaction = useCallback(() => {
    const store = usePetStore.getState();
    const petId = store.settings?.selectedPetId ?? 'otter';
    const definition = getPetDefinition(petId);
    store.touchInteraction();
    store.setAnimation('celebrate');
    store.setPetState('excited');
    store.updateStats({ happiness: Math.min(100, store.stats.happiness + 5) });
    const messages = definition.personality.clickMessages;
    store.showSpeech(messages[Math.floor(Math.random() * messages.length)], 2500);
  }, []);

  const resolveClicks = useCallback(() => {
    const session = pointerRef.current;
    const count = session.clickCount;
    session.clickCount = 0;
    session.clickTimer = null;

    if (count === 1) {
      runClickReaction();
    } else if (count === 2) {
      runCelebrateReaction();
    } else if (count >= 3) {
      setAvatarPickerOpen(true);
    }
  }, [runClickReaction, runCelebrateReaction]);

  const scheduleClickResolution = useCallback(() => {
    const session = pointerRef.current;
    if (session.clickTimer) {
      clearTimeout(session.clickTimer);
    }
    session.clickTimer = setTimeout(resolveClicks, CLICK_WINDOW_MS);
  }, [resolveClicks]);

  const beginDrag = useCallback(() => {
    const session = pointerRef.current;
    if (session.dragging || !session.active) return;

    clearClickTimer();
    session.dragging = true;
    const store = usePetStore.getState();
    store.setDragging(true);
    store.setAnimation('idle');
    store.touchInteraction();
    void ipc().window.startDrag(session.offsetX, session.offsetY);
  }, [clearClickTimer]);

  const endDrag = useCallback(() => {
    const session = pointerRef.current;
    if (!session.dragging) return;

    session.dragging = false;
    usePetStore.getState().setDragging(false);
    void ipc().window.endDrag();
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const session = pointerRef.current;
    if (!session.active || session.dragging) return;

    const dx = Math.abs(e.screenX - session.startX);
    const dy = Math.abs(e.screenY - session.startY);
    if (dx > DRAG_THRESHOLD_PX || dy > DRAG_THRESHOLD_PX) {
      beginDrag();
    }
  }, [beginDrag]);

  const handlePointerUp = useCallback(() => {
    const session = pointerRef.current;
    if (!session.active) return;

    session.active = false;

    if (session.dragging) {
      endDrag();
      return;
    }

    session.clickCount += 1;
    scheduleClickResolution();
  }, [endDrag, scheduleClickResolution]);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      const session = pointerRef.current;
      if (session.clickTimer) {
        clearTimeout(session.clickTimer);
      }
      if (session.dragging) {
        void ipc().window.endDrag();
        usePetStore.getState().setDragging(false);
      }
    };
  }, [handlePointerMove, handlePointerUp]);

  const handlePointerDown = useCallback(async (e: React.PointerEvent<HTMLImageElement>) => {
    if (e.button !== 0) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const bounds = await ipc().window.getBounds();
    const session = pointerRef.current;
    session.active = true;
    session.dragging = false;
    session.startX = e.screenX;
    session.startY = e.screenY;
    session.offsetX = e.screenX - bounds.x;
    session.offsetY = e.screenY - bounds.y;
    session.pointerId = e.pointerId;

    void ipc().window.setPetInteractive(true);
  }, []);

  if (isPaused || settings?.petEnabled === false) {
    return null;
  }

  return (
    <div
      className="pixel-pet-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {attentionPopVisible && <AttentionPop />}
      {speechVisible && speechMessage && <SpeechBubble message={speechMessage} />}
      {petState === 'sleeping' && (
        <div className="sleep-zzz" aria-hidden>
          <span>z</span>
          <span>z</span>
          <span>z</span>
        </div>
      )}
      <img
        className={`pixel-pet${isDragging ? ' is-dragging' : ''}`}
        src={frameSrc || idleSpritePath(selectedPetId)}
        alt="PixelPaw pet"
        draggable={false}
        style={{ width: size, height: size, opacity }}
        onPointerDown={handlePointerDown}
        onContextMenu={(e) => e.preventDefault()}
        onError={() => {
          console.error('Failed to load pet sprite:', frameSrc || idleSpritePath(selectedPetId));
        }}
      />
      <PetContextMenu onChangePet={() => setAvatarPickerOpen(true)} />
      <AvatarPickerMenu visible={avatarPickerOpen} onClose={() => setAvatarPickerOpen(false)} />
    </div>
  );
}
