import { useCallback } from 'react';
import { usePetStore } from '../store/petStore';
import { ipc } from '../services/ipc';
import { getAvailablePets, isPetAvailable } from '../pets/registry';
import { idleSpritePath } from '../services/assetPaths';

interface AvatarPickerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function AvatarPickerMenu({ visible, onClose }: AvatarPickerMenuProps) {
  const selectedPetId = usePetStore((s) => s.settings?.selectedPetId ?? 'otter');

  const selectPet = useCallback(async (petId: string) => {
    if (!isPetAvailable(petId)) return;
    await ipc().settings.set({ selectedPetId: petId });
    const store = usePetStore.getState();
    store.setPetState('idle');
    store.setAnimation('idle');
    store.showSpeech('New friend!', 1500);
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className="avatar-picker-overlay" onClick={onClose}>
      <div className="avatar-picker" onClick={(e) => e.stopPropagation()}>
        <div className="avatar-picker-header">Choose your pet</div>
        <p className="avatar-picker-hint">Triple-click the pet anytime to switch</p>
        <div className="avatar-picker-grid">
          {getAvailablePets().map((pet) => {
            const available = isPetAvailable(pet.id);
            const selected = selectedPetId === pet.id;
            return (
              <button
                key={pet.id}
                type="button"
                className={`avatar-option ${selected ? 'selected' : ''}`}
                disabled={!available}
                onClick={() => void selectPet(pet.id)}
                title={available ? pet.name : 'Coming soon'}
              >
                <img
                  src={idleSpritePath(pet.id)}
                  alt={pet.name}
                  width={64}
                  height={64}
                  draggable={false}
                />
                <span>{pet.emoji} {pet.name}</span>
              </button>
            );
          })}
        </div>
        <button type="button" className="avatar-picker-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
