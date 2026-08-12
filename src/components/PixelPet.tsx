import { useCallback, useRef } from 'react';
import { usePetStore } from '../store/petStore';
import { usePetController } from '../hooks/usePetController';
import { ipc } from '../services/ipc';
import { otterDefinition } from '../pets/otter/definition';
import { SpeechBubble } from './SpeechBubble';
import { PetContextMenu } from './PetContextMenu';
import type { PetAnimation } from '../types/pet';

export function PixelPet(): JSX.Element | null {
  const { frameSrc } = usePetController();
  const settings = usePetStore((s) => s.settings);
  const speechVisible = usePetStore((s) => s.speechVisible);
  const speechMessage = usePetStore((s) => s.speechMessage);
  const isPaused = usePetStore((s) => s.isPaused);
  const petState = usePetStore((s) => s.petState);
  const dragRef = useRef<{ x: number; y: number; dragging: boolean }>({
    x: 0,
    y: 0,
    dragging: false,
  });

  const size = settings?.petSize ?? 96;
  const opacity = settings?.petOpacity ?? 1;

  const handleMouseEnter = useCallback(() => {
    void ipc().window.setPetInteractive(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!dragRef.current.dragging) {
      void ipc().window.setPetInteractive(false);
    }
  }, []);

  const handleClick = useCallback(() => {
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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragRef.current = { x: e.screenX, y: e.screenY, dragging: true };
    void ipc().window.setPetInteractive(true);
  }, []);

  const handleMouseMove = useCallback(async (e: React.MouseEvent) => {
    if (!dragRef.current.dragging) return;
    const dx = e.screenX - dragRef.current.x;
    const dy = e.screenY - dragRef.current.y;
    if (dx === 0 && dy === 0) return;
    const bounds = await ipc().window.getBounds();
    await ipc().window.setBounds({
      x: bounds.x + dx,
      y: bounds.y + dy,
    });
    dragRef.current.x = e.screenX;
    dragRef.current.y = e.screenY;
    usePetStore.getState().touchInteraction();
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current.dragging = false;
  }, []);

  if (isPaused || settings?.petEnabled === false) {
    return null;
  }

  return (
    <div
      className="pixel-pet-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeaveCapture={handleMouseUp}
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
        src={frameSrc}
        alt="PixelPaw otter"
        draggable={false}
        style={{ width: size, height: size, opacity }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
      />
      <PetContextMenu />
    </div>
  );
}
