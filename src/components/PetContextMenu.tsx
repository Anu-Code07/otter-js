import { useCallback, useEffect, useState } from 'react';
import { usePetStore } from '../store/petStore';
import { ipc } from '../services/ipc';

export function PetContextMenu() {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const settings = usePetStore((s) => s.settings);
  const isPaused = usePetStore((s) => s.isPaused);

  useEffect(() => {
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      setPosition({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };
    const onClick = () => setVisible(false);
    document.addEventListener('contextmenu', onContext);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('click', onClick);
    };
  }, []);

  const togglePause = useCallback(async () => {
    const next = !isPaused;
    usePetStore.getState().setPaused(next);
    await ipc().system.setPetEnabled(!next);
    setVisible(false);
  }, [isPaused]);

  const toggleFollow = useCallback(async () => {
    await ipc().settings.set({ followCursor: !settings?.followCursor });
    setVisible(false);
  }, [settings?.followCursor]);

  const toggleClaude = useCallback(async () => {
    await ipc().settings.set({ claudeAlerts: !settings?.claudeAlerts });
    setVisible(false);
  }, [settings?.claudeAlerts]);

  const toggleAlerts = useCallback(async () => {
    await ipc().settings.set({ attentionAlertsEnabled: !settings?.attentionAlertsEnabled });
    setVisible(false);
  }, [settings?.attentionAlertsEnabled]);

  if (!visible) return null;

  return (
    <div className="pet-context-menu" style={{ left: position.x, top: position.y }}>
      <div className="menu-header">PixelPaw</div>
      <button type="button" onClick={togglePause}>
        🐾 {isPaused ? 'Resume Pet' : 'Pause Pet'}
      </button>
      <button type="button" onClick={toggleFollow}>
        {settings?.followCursor ? '✓ ' : ''}Follow Cursor
      </button>
      <button type="button" onClick={toggleAlerts}>
        {settings?.attentionAlertsEnabled ? '✓ ' : ''}Attention Alerts
      </button>
      <button type="button" onClick={toggleClaude}>
        {settings?.claudeAlerts ? '✓ ' : ''}Claude Alerts
      </button>
      <hr />
      <button type="button" onClick={() => { void ipc().system.openSettings(); setVisible(false); }}>
        Settings
      </button>
      <button type="button" disabled title="More pets coming soon">
        Change Pet
      </button>
      <button type="button" onClick={() => alert('PixelPaw v1.0.0\nA tiny otter for your desktop.')}>
        About
      </button>
      <hr />
      <button type="button" className="danger" onClick={() => void ipc().system.quit()}>
        Quit
      </button>
    </div>
  );
}
