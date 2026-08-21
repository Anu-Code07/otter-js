import { useCallback, useEffect, useRef } from 'react';
import { usePetStore } from '../store/petStore';
import { usePetController } from '../hooks/usePetController';
import { ipc } from '../services/ipc';
import { idleSpritePath } from '../services/assetPaths';
import { otterDefinition } from '../pets/otter/definition';
import { SpeechBubble } from './SpeechBubble';
import { PetContextMenu } from './PetContextMenu';
import type { PetAnimation } from '../types/pet';

const DRAG_THRESHOLD_PX = 5;

export function PixelPet(): JSX.Element | null {
  const { frameSrc } = usePetController();
  const settings = usePetStore((s) => s.settings);
  const speechVisible = usePetStore((s) => s.speechVisible);
  const speechMessage = usePetStore((s) => s.speechMessage);
  const isPaused = usePetStore((s) => s.isPaused);
  const petState = usePetStore((s) => s.petState);
  const dragRef = useRef({
    dragging: false,
    didDrag: false,
    startX: 0,
    startY: 0,
  });

  const size = settings?.petSize ?? 180;
  const opacity = settings?.petOpacity ?? 1;

  const handleMouseEnter = useCallback(() => {
    void ipc().window.setPetInteractive(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!dragRef.current.dragging) {
      void ipc().window.setPetInteractive(false);
    }
  }, []);

  const runClickReaction = useCallback(() => {
    const store = usePetStore.getState();
    store.touchInteraction();
    const reactions = otterDefinition.personality.clickReactions;
    const reaction = reactions[Math.floor(Math.random() * reactions.length)] as PetAnimation;
    store.setAnimation(reaction);

    if (Math.random() < 0.35) {
      const messages = otterDefinition.personality.clickMessages;
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

  const finishDrag = useCallback(() => {
    if (!dragRef.current.dragging) return;

    const wasDrag = dragRef.current.didDrag;
    dragRef.current.dragging = false;
    dragRef.current.didDrag = false;
    usePetStore.getState().setDragging(false);
    void ipc().window.endDrag();

    if (!wasDrag) {
      runClickReaction();
    }
  }, [runClickReaction]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current.dragging) return;
    const dx = Math.abs(e.screenX - dragRef.current.startX);
    const dy = Math.abs(e.screenY - dragRef.current.startY);
    if (dx > DRAG_THRESHOLD_PX || dy > DRAG_THRESHOLD_PX) {
      dragRef.current.didDrag = true;
      usePetStore.getState().touchInteraction();
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    finishDrag();
  }, [finishDrag]);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      if (dragRef.current.dragging) {
        void ipc().window.endDrag();
        dragRef.current.dragging = false;
      }
    };
  }, [handlePointerMove, handlePointerUp]);

  const handlePointerDown = useCallback(async (e: React.PointerEvent<HTMLImageElement>) => {
    if (e.button !== 0) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const bounds = await ipc().window.getBounds();
    const offsetX = e.screenX - bounds.x;
    const offsetY = e.screenY - bounds.y;

    dragRef.current = {
      dragging: true,
      didDrag: false,
      startX: e.screenX,
      startY: e.screenY,
    };

    usePetStore.getState().setDragging(true);
    void ipc().window.setPetInteractive(true);
    void ipc().window.startDrag(offsetX, offsetY);
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
      {speechVisible && speechMessage && <SpeechBubble message={speechMessage} />}
      {petState === 'sleeping' && (
        <div className="sleep-zzz" aria-hidden>
          <span>z</span>
          <span>z</span>
          <span>z</span>
        </div>
      )}
      <img
        className="pixel-pet"
        src={frameSrc || idleSpritePath()}
        alt="PixelPaw otter"
        draggable={false}
        style={{ width: size, height: size, opacity }}
        onPointerDown={handlePointerDown}
        onContextMenu={(e) => e.preventDefault()}
        onError={() => {
          console.error('Failed to load pet sprite:', frameSrc || idleSpritePath());
        }}
      />
      <PetContextMenu />
    </div>
  );
}
