import { createPetDefinition } from '../createPetDefinition';
import { catPersonality } from './personality';

export const catDefinition = createPetDefinition('cat', 'Cat', catPersonality);
