import type { AnimationDefinition, PetAnimation } from '../types/pet';

export class AnimationEngine {
  private currentAnimation: PetAnimation = 'idle';
  private frameIndex = 0;
  private elapsed = 0;
  private definitions: Record<PetAnimation, AnimationDefinition>;
  private onFrameChange: ((src: string, animation: PetAnimation) => void) | null = null;

  constructor(definitions: Record<PetAnimation, AnimationDefinition>) {
    this.definitions = definitions;
  }

  setOnFrameChange(callback: (src: string, animation: PetAnimation) => void): void {
    this.onFrameChange = callback;
    this.emitCurrentFrame();
  }

  play(animation: PetAnimation, restart = true): void {
    if (this.currentAnimation === animation && !restart) return;
    this.currentAnimation = animation;
    if (restart) {
      this.frameIndex = 0;
      this.elapsed = 0;
    }
    this.emitCurrentFrame();
  }

  getCurrentAnimation(): PetAnimation {
    return this.currentAnimation;
  }

  getCurrentFrameSrc(): string {
    const def = this.definitions[this.currentAnimation];
    return def.frames[this.frameIndex] ?? def.frames[0];
  }

  shouldAnimate(): boolean {
    const def = this.definitions[this.currentAnimation];
    if (def.frames.length <= 1) return false;
    if (!def.loop && this.frameIndex >= def.frames.length - 1) return false;
    return true;
  }

  update(deltaMs: number): void {
    const def = this.definitions[this.currentAnimation];
    const frameDuration = 1000 / def.fps;
    this.elapsed += deltaMs;

    while (this.elapsed >= frameDuration) {
      this.elapsed -= frameDuration;
      const nextIndex = this.frameIndex + 1;
      if (nextIndex >= def.frames.length) {
        if (def.loop) {
          this.frameIndex = 0;
        } else {
          this.frameIndex = def.frames.length - 1;
          break;
        }
      } else {
        this.frameIndex = nextIndex;
      }
      this.emitCurrentFrame();
    }
  }

  isFinished(): boolean {
    const def = this.definitions[this.currentAnimation];
    return !def.loop && this.frameIndex >= def.frames.length - 1;
  }

  private emitCurrentFrame(): void {
    if (this.onFrameChange) {
      this.onFrameChange(this.getCurrentFrameSrc(), this.currentAnimation);
    }
  }
}
