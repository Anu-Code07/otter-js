import { describe, it, expect } from 'vitest';
import { createAnimationFrames } from '../src/animations/frames';
import { otterDefinition } from '../src/pets/otter/definition';

describe('otterDefinition', () => {
  it('has all required animations', () => {
    const frames = createAnimationFrames();
    const required = Object.keys(frames);
    expect(required.length).toBeGreaterThan(15);
    for (const key of required) {
      expect(otterDefinition.animations[key as keyof typeof otterDefinition.animations].frames.length).toBeGreaterThan(0);
    }
  });

  it('defines personality weights', () => {
    const total = otterDefinition.personality.idleBehaviours.reduce((s, b) => s + b.weight, 0);
    expect(total).toBe(100);
  });
});
