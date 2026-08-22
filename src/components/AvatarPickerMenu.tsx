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
    <div className="avatar-picker-popover" role="dialog" aria-label="Choose your pet">
      <div className="avatar-picker-header">
        <span>Choose pet</span>
        <button type="button" className="avatar-picker-dismiss" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
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
                alt=""
                width={40}
                height={40}
                draggable={false}
              />
              <span className="avatar-option-label">{pet.emoji}</span>
            </button>
          );
        })}
      </div>
      <p className="avatar-picker-hint">Triple-click pet to open · drag ⠿ to move</p>
    </div>
  );
}
