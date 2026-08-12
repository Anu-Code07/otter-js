import type { PetDefinition, PetAnimation } from '../../types/pet';
import { createAnimationFrames } from '../../animations/frames';
import { otterPersonality } from './personality';

const frameData = createAnimationFrames();

const animations = Object.fromEntries(
  (Object.keys(frameData) as PetAnimation[]).map((name) => [
    name,
    {
      name,
      frames: frameData[name].frames,
      fps: frameData[name].fps,
      loop: frameData[name].loop,
    },
  ]),
) as Record<PetAnimation, PetDefinition['animations'][PetAnimation]>;

export const otterDefinition: PetDefinition = {
  id: 'otter',
  name: 'Otter',
  animations,
  personality: otterPersonality,
};
