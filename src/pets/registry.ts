import { otterDefinition } from './otter/definition';
import { catDefinition } from './cat/definition';
import { penguinDefinition } from './penguin/definition';
import { raccoonDefinition } from './raccoon/definition';
import { dragonDefinition } from './dragon/definition';
import type { PetDefinition } from '../types/pet';

const PET_REGISTRY: Record<string, PetDefinition> = {
  otter: otterDefinition,
  cat: catDefinition,
  penguin: penguinDefinition,
  raccoon: raccoonDefinition,
  dragon: dragonDefinition,
};

export const AVAILABLE_PET_IDS = Object.keys(PET_REGISTRY);

export function getPetDefinition(id: string): PetDefinition {
  if (id === 'frog') return otterDefinition;
  return PET_REGISTRY[id] ?? otterDefinition;
}

export function getAvailablePets(): Array<{ id: string; name: string; emoji: string }> {
  return [
    { id: 'otter', name: 'Otter', emoji: '🦦' },
    { id: 'cat', name: 'Cat', emoji: '🐱' },
    { id: 'penguin', name: 'Penguin', emoji: '🐧' },
    { id: 'raccoon', name: 'Raccoon', emoji: '🦝' },
    { id: 'dragon', name: 'Dragon', emoji: '🐉' },
  ];
}

export function isPetAvailable(id: string): boolean {
  return id in PET_REGISTRY;
}
