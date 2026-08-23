import { useEffect, useState } from 'react';
import { PixelPet } from './components/PixelPet';
import { SettingsWindow } from './components/SettingsWindow';
import { StatusIndicator } from './components/StatusIndicator';
import { useWellnessController } from './hooks/useWellnessController';
import { ipc } from './services/ipc';
import { isSettingsRoute } from './utils/routes';

function useSettingsRoute(): boolean {
  const [isSettings, setIsSettings] = useState(isSettingsRoute());

  useEffect(() => {
    const sync = () => setIsSettings(isSettingsRoute());
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  return isSettings;
}

function App() {
  const isSettings = useSettingsRoute();

  useEffect(() => {
    if (isSettings) {
      document.documentElement.style.background = '#f5f0e8';
      document.body.style.background = '#f5f0e8';
    } else {
      document.documentElement.style.background = 'transparent';
      document.body.style.background = 'transparent';
    }
  }, [isSettings]);

  if (!isSettings) {
    return <PetApp />;
  }

  return <SettingsWindow />;
}

function PetApp() {
  useWellnessController();

  useEffect(() => {
    void ipc().window.setPetInteractive(true);
  }, []);

  return (
    <div className="app-root">
      <PixelPet />
      <StatusIndicator />
    </div>
  );
}

export default App;
