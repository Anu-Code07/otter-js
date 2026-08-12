import { otterDefinition } from './otter/definition';
import type { PetDefinition } from '../types/pet';

const PET_REGISTRY: Record<string, PetDefinition> = {
  otter: otterDefinition,
};

export function getPetDefinition(id: string): PetDefinition {
  return PET_REGISTRY[id] ?? otterDefinition;
}

export function getAvailablePets(): Array<{ id: string; name: string; emoji: string }> {
  return [
    { id: 'otter', name: 'Otter', emoji: '🦦' },
    { id: 'cat', name: 'Cat', emoji: '🐱' },
    { id: 'frog', name: 'Frog', emoji: '🐸' },
    { id: 'raccoon', name: 'Raccoon', emoji: '🦝' },
    { id: 'penguin', name: 'Penguin', emoji: '🐧' },
    { id: 'capybara', name: 'Capybara', emoji: '🦫' },
  ];
}

export function isPetAvailable(id: string): boolean {
  return id in PET_REGISTRY;
}
