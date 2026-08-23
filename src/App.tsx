import { useEffect } from 'react';
import { PixelPet } from './components/PixelPet';
import { SettingsWindow } from './components/SettingsWindow';
import { StatusIndicator } from './components/StatusIndicator';
import { useWellnessController } from './hooks/useWellnessController';
import { ipc } from './services/ipc';

function App() {
  const isSettings = window.location.hash === '#/settings';
  useWellnessController();

  useEffect(() => {
    if (!isSettings) {
      void ipc().window.setPetInteractive(true);
    }
  }, [isSettings]);

  if (isSettings) {
    return <SettingsWindow />;
  }

  return (
    <div className="app-root">
      <PixelPet />
      <StatusIndicator />
    </div>
  );
}

export default App;
