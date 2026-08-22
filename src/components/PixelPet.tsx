import { useCallback, useEffect, useRef, useState } from 'react';
import { usePetStore } from '../store/petStore';
import { usePetController } from '../hooks/usePetController';
import { ipc } from '../services/ipc';
import { idleSpritePath } from '../services/assetPaths';
import { getPetDefinition } from '../pets/registry';
import { SpeechBubble } from './SpeechBubble';
import { AlertBannerFromStore } from './AlertBanner';
import { PetContextMenu } from './PetContextMenu';
import { AvatarPickerMenu } from './AvatarPickerMenu';
import type { PetAnimation } from '../types/pet';

const CLICK_WINDOW_MS = 400;

type ClickSession = {
  active: boolean;
  clickCount: number;
  clickTimer: ReturnType<typeof setTimeout> | null;
};

type OverlayMode = 'none' | 'avatar' | 'context';

function createClickSession(): ClickSession {
  return { active: false, clickCount: 0, clickTimer: null };
}

export function PixelPet(): JSX.Element {
  const { frameSrc } = usePetController();
  const settings = usePetStore((s) => s.settings);
  const speechVisible = usePetStore((s) => s.speechVisible);
  const speechMessage = usePetStore((s) => s.speechMessage);
  const speechKind = usePetStore((s) => s.speechKind);
  const selectedPetId = usePetStore((s) => s.settings?.selectedPetId ?? 'otter');
  const petState = usePetStore((s) => s.petState);
  const isDragging = usePetStore((s) => s.isDragging);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const clickRef = useRef<ClickSession>(createClickSession());
  const dragActiveRef = useRef(false);

  const overlayMode: OverlayMode = contextMenuOpen
    ? 'context'
    : avatarPickerOpen
      ? 'avatar'
      : 'none';
  const menuOpen = overlayMode !== 'none';

  const size = settings?.petSize ?? 160;

  const closeMenus = useCallback(() => {
    setAvatarPickerOpen(false);
    setContextMenuOpen(false);
  }, []);

  const openAvatarPicker = useCallback(() => {
    setContextMenuOpen(false);
    setAvatarPickerOpen(true);
  }, []);

  const clearClickTimer = useCallback(() => {
    const session = clickRef.current;
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
    if (!dragActiveRef.current && !menuOpen) {
      void ipc().window.setPetInteractive(false);
    }
  }, [menuOpen]);

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
    const session = clickRef.current;
    const count = session.clickCount;
    session.clickCount = 0;
    session.clickTimer = null;

    if (count === 1) {
      runClickReaction();
    } else if (count === 2) {
      runCelebrateReaction();
    } else if (count >= 3) {
      openAvatarPicker();
    }
  }, [runClickReaction, runCelebrateReaction, openAvatarPicker]);

  const scheduleClickResolution = useCallback(() => {
    const session = clickRef.current;
    if (session.clickTimer) {
      clearTimeout(session.clickTimer);
    }
    session.clickTimer = setTimeout(resolveClicks, CLICK_WINDOW_MS);
  }, [resolveClicks]);

  const endDrag = useCallback(() => {
    if (!dragActiveRef.current) return;
    dragActiveRef.current = false;
    usePetStore.getState().setDragging(false);
    void ipc().window.endDrag();
  }, []);

  const handleDragPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();
    clearClickTimer();
    clickRef.current.active = false;
    closeMenus();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if capture is unavailable.
    }

    const screenX = e.screenX;
    const screenY = e.screenY;

    void (async () => {
      const bounds = await ipc().window.getBounds();
      const offsetX = screenX - bounds.x;
      const offsetY = screenY - bounds.y;

      dragActiveRef.current = true;
      const store = usePetStore.getState();
      store.setDragging(true);
      store.setAnimation('idle');
      store.touchInteraction();
      void ipc().window.setPetInteractive(true);
      void ipc().window.startDrag(offsetX, offsetY);
    })();
  }, [clearClickTimer, closeMenus]);

  const handlePetPointerDown = useCallback((e: React.PointerEvent<HTMLImageElement>) => {
    if (e.button !== 0) return;
    if (dragActiveRef.current) return;

    e.preventDefault();
    clickRef.current.active = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if capture is unavailable.
    }
    void ipc().window.setPetInteractive(true);
  }, []);

  const handlePetPointerUp = useCallback(() => {
    const session = clickRef.current;
    if (!session.active || dragActiveRef.current) {
      session.active = false;
      return;
    }

    session.active = false;
    session.clickCount += 1;
    scheduleClickResolution();
  }, [scheduleClickResolution]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    clearClickTimer();
    clickRef.current.active = false;
    setAvatarPickerOpen(false);
    setContextMenuOpen(true);
    void ipc().window.setPetInteractive(true);
  }, [clearClickTimer]);

  useEffect(() => {
    const onPointerUp = () => {
      if (dragActiveRef.current) {
        endDrag();
      }
    };

    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      const session = clickRef.current;
      if (session.clickTimer) {
        clearTimeout(session.clickTimer);
      }
      if (dragActiveRef.current) {
        void ipc().window.endDrag();
        usePetStore.getState().setDragging(false);
      }
    };
  }, [endDrag]);

  useEffect(() => {
    void ipc().window.setOverlayMode(overlayMode);
  }, [overlayMode]);

  useEffect(() => {
    return ipc().system.onTrayAction((action) => {
      if (action === 'change-pet') {
        openAvatarPicker();
      }
    });
  }, [openAvatarPicker]);

  return (
    <div
      className={`pixel-pet-container${menuOpen ? ' menu-open' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
    >
      <AvatarPickerMenu visible={avatarPickerOpen} onClose={() => setAvatarPickerOpen(false)} />
      <PetContextMenu
        visible={contextMenuOpen}
        onClose={() => setContextMenuOpen(false)}
        onChangePet={openAvatarPicker}
      />
      <div className="pixel-pet-stage">
        <AlertBannerFromStore />
        {speechVisible && speechMessage && speechKind === 'chat' && (
          <SpeechBubble message={speechMessage} />
        )}
        {petState === 'sleeping' && (
          <div className="sleep-zzz" aria-hidden>
            <span>z</span>
            <span>z</span>
            <span>z</span>
          </div>
        )}
        <button
          type="button"
          className={`pet-drag-handle${isDragging ? ' is-dragging' : ''}`}
          aria-label="Drag pet"
          title="Drag to move"
          onPointerDown={handleDragPointerDown}
        >
          <span className="pet-drag-handle-grip" aria-hidden>⠿</span>
        </button>
        <img
          className="pixel-pet"
          src={frameSrc || idleSpritePath(selectedPetId)}
          alt="PixelPaw pet"
          draggable={false}
          style={{
            width: size,
            height: size,
          }}
          onPointerDown={handlePetPointerDown}
          onPointerUp={handlePetPointerUp}
          onPointerCancel={handlePetPointerUp}
          onError={() => {
            console.error('Failed to load pet sprite:', frameSrc || idleSpritePath(selectedPetId));
          }}
        />
      </div>
    </div>
  );
}
