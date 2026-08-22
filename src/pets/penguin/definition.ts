import { createPetDefinition } from '../createPetDefinition';
import { penguinPersonality } from './personality';

export const penguinDefinition = createPetDefinition('penguin', 'Penguin', penguinPersonality);
