import { useCallback } from 'react';
import { usePetStore } from '../store/petStore';
import { ipc } from '../services/ipc';
import { APP_VERSION } from '../constants/app';

interface PetContextMenuProps {
  visible: boolean;
  onClose: () => void;
  onChangePet: () => void;
}

export function PetContextMenu({ visible, onClose, onChangePet }: PetContextMenuProps) {
  const settings = usePetStore((s) => s.settings);
  const isPaused = usePetStore((s) => s.isPaused);

  const togglePause = useCallback(async () => {
    const next = !isPaused;
    usePetStore.getState().setPaused(next);
    await ipc().system.setPetEnabled(!next);
    onClose();
  }, [isPaused, onClose]);

  const toggleFollow = useCallback(async () => {
    await ipc().settings.set({ followCursor: !settings?.followCursor });
    onClose();
  }, [settings?.followCursor, onClose]);

  const toggleClaude = useCallback(async () => {
    await ipc().settings.set({ claudeAlerts: !settings?.claudeAlerts });
    onClose();
  }, [settings?.claudeAlerts, onClose]);

  const toggleAlerts = useCallback(async () => {
    await ipc().settings.set({ attentionAlertsEnabled: !settings?.attentionAlertsEnabled });
    onClose();
  }, [settings?.attentionAlertsEnabled, onClose]);

  const openChangePet = useCallback(() => {
    onChangePet();
    onClose();
  }, [onChangePet, onClose]);

  if (!visible) return null;

  return (
    <div
      className="pet-context-menu-popover"
      role="menu"
      aria-label="PixelPaw menu"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="pet-menu-header">
        <span>PixelPaw</span>
        <button type="button" className="pet-menu-dismiss" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <button type="button" role="menuitem" onClick={() => void togglePause()}>
        🐾 {isPaused ? 'Resume Pet' : 'Pause Pet'}
      </button>
      <button type="button" role="menuitem" onClick={() => void toggleFollow()}>
        {settings?.followCursor ? '✓ ' : ''}Follow Cursor
      </button>
      <button type="button" role="menuitem" onClick={() => void toggleAlerts()}>
        {settings?.attentionAlertsEnabled ? '✓ ' : ''}Attention Alerts
      </button>
      <button type="button" role="menuitem" onClick={() => void toggleClaude()}>
        {settings?.claudeAlerts ? '✓ ' : ''}Claude Alerts
      </button>
      <hr />
      <button type="button" role="menuitem" onClick={() => { void ipc().system.openSettings(); onClose(); }}>
        Settings
      </button>
      <button type="button" role="menuitem" onClick={openChangePet}>
        Change Pet
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => alert(`PixelPaw v${APP_VERSION}\nDrag ⠿ to move · triple-click to change pet`)}
      >
        About
      </button>
      <hr />
      <button type="button" role="menuitem" className="danger" onClick={() => void ipc().system.quit()}>
        Quit
      </button>
    </div>
  );
}
