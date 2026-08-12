import { createAnimationFrames } from './frames';

export const walkingAnimations = {
  walkLeft: createAnimationFrames().walk_left,
  walkRight: createAnimationFrames().walk_right,
  runLeft: createAnimationFrames().run_left,
  runRight: createAnimationFrames().run_right,
};
