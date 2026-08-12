import { createAnimationFrames } from './frames';

export const sleepingAnimations = {
  sleep: createAnimationFrames().sleep,
  yawn: createAnimationFrames().yawn,
  wake: createAnimationFrames().wake_up,
};
