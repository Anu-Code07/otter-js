import type { PetAnimation } from '../types/pet';

type PrimaryPose = 'idle' | 'wave' | 'sleep' | 'alert';

const PRIMARY_POSES: Record<PrimaryPose, { folder: string; frameCount: number }> = {
  idle: { folder: 'idle', frameCount: 2 },
  wave: { folder: 'wave', frameCount: 1 },
  sleep: { folder: 'sleep', frameCount: 1 },
  alert: { folder: 'alert', frameCount: 1 },
};

/** Watercolor sprites exist for these poses; other animations reuse them. */
const ANIMATION_POSE: Record<PetAnimation, PrimaryPose> = {
  idle: 'idle',
  blink: 'idle',
  look_around: 'idle',
  walk_left: 'idle',
  walk_right: 'idle',
  run_left: 'idle',
  run_right: 'idle',
  sit: 'idle',
  sleep: 'sleep',
  wake_up: 'idle',
  thinking: 'alert',
  curious: 'idle',
  excited: 'wave',
  happy: 'wave',
  alert: 'alert',
  annoyed: 'idle',
  wave: 'wave',
  celebrate: 'wave',
  stretch: 'idle',
  yawn: 'sleep',
};

const FPS: Partial<Record<PetAnimation, number>> = {
  idle: 4,
  blink: 8,
  walk_left: 8,
  walk_right: 8,
  run_left: 12,
  run_right: 12,
  sleep: 2,
  alert: 6,
  celebrate: 10,
};

function buildFramePath(folder: string, index: number): string {
  const base = import.meta.env.BASE_URL ?? './';
  return `${base}assets/pets/otter/${folder}/frame-${String(index).padStart(2, '0')}.png`;
}

function buildFrames(animation: PetAnimation): string[] {
  const pose = ANIMATION_POSE[animation];
  const { folder, frameCount } = PRIMARY_POSES[pose];
  return Array.from({ length: frameCount }, (_, i) => buildFramePath(folder, i));
}

export function createAnimationFrames(): Record<PetAnimation, { frames: string[]; fps: number; loop: boolean }> {
  const animations = Object.keys(ANIMATION_POSE) as PetAnimation[];
  const result = {} as Record<PetAnimation, { frames: string[]; fps: number; loop: boolean }>;

  for (const name of animations) {
    const oneShot = ['blink', 'wake_up', 'yawn', 'wave', 'celebrate', 'happy'].includes(name);
    result[name] = {
      frames: buildFrames(name),
      fps: FPS[name] ?? 6,
      loop: !oneShot,
    };
  }

  return result;
}
