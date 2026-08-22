import type { PetAnimation, AnimationDefinition, PetDefinition, PersonalityDefinition } from '../types/pet';
import { createAnimationFrames } from '../animations/frames';

export function createPetDefinition(
  id: string,
  name: string,
  personality: PersonalityDefinition,
): PetDefinition {
  const frameData = createAnimationFrames(id);
  const animations = Object.fromEntries(
    (Object.keys(frameData) as PetAnimation[]).map((animName) => [
      animName,
      {
        name: animName,
        frames: frameData[animName].frames,
        fps: frameData[animName].fps,
        loop: frameData[animName].loop,
      },
    ]),
  ) as Record<PetAnimation, AnimationDefinition>;

  return { id, name, animations, personality };
}
