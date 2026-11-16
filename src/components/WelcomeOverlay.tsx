import { useCallback } from 'react';
import { usePetStore } from '../store/petStore';
import { ipc } from '../services/ipc';
import { getAvailablePets } from '../pets/registry';
import { APP_VERSION } from '../constants/app';

interface WelcomeOverlayProps {
  onComplete: () => void;
  onPickPet: () => void;
}

export function WelcomeOverlay({ onComplete, onPickPet }: WelcomeOverlayProps): JSX.Element {
  const pets = getAvailablePets();
  const selectedPetId = usePetStore((s) => s.settings?.selectedPetId ?? 'otter');

  const finish = useCallback(() => {
    void ipc().settings.set({ hasCompletedOnboarding: true });
    onComplete();
  }, [onComplete]);

  const tryDemoAlert = useCallback(async () => {
    await ipc().attention.simulate('claude', {
      status: 'needs_user',
      priority: 'high',
      title: 'Demo',
      message: 'Demo alert — your pet watches Claude for you!',
    });
  }, []);

  const selectPet = useCallback(async (petId: string) => {
    await ipc().settings.set({ selectedPetId: petId });
  }, []);

  return (
    <div className="welcome-overlay" role="dialog" aria-label="Welcome to PixelPaw">
      <div className="welcome-card">
        <h2>Welcome to PixelPaw</h2>
        <p className="welcome-version">v{APP_VERSION}</p>
        <p className="welcome-lead">
          A tiny desktop companion that alerts you when Claude, builds, git, or tools need you.
        </p>
        <ul className="welcome-tips">
          <li><strong>Drag ⠿</strong> to move</li>
          <li><strong>Click</strong> to play · <strong>double-click</strong> celebrate</li>
          <li><strong>Triple-click</strong> to change pet</li>
          <li><strong>Right-click</strong> for menu</li>
        </ul>
        <div className="welcome-pets">
          <p className="welcome-pets-label">Pick a pet (optional)</p>
          <div className="welcome-pet-grid">
            {pets.map((pet) => (
              <button
                key={pet.id}
                type="button"
                className={`welcome-pet-btn${selectedPetId === pet.id ? ' selected' : ''}`}
                onClick={() => void selectPet(pet.id)}
              >
                <span>{pet.emoji}</span>
                <span>{pet.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="welcome-actions">
          <button type="button" className="welcome-primary" onClick={() => void tryDemoAlert()}>
            Try demo alert
          </button>
          <button type="button" className="welcome-secondary" onClick={onPickPet}>
            Change pet
          </button>
          <button type="button" className="welcome-secondary" onClick={() => void finish()}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
