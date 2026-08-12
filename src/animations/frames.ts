import type { PetAnimation } from '../types/pet';

const ANIMATION_FOLDERS: Record<PetAnimation, string> = {
  idle: 'idle',
  blink: 'blink',
  look_around: 'look-around',
  walk_left: 'walk-left',
  walk_right: 'walk-right',
  run_left: 'run-left',
  run_right: 'run-right',
  sit: 'sit',
  sleep: 'sleep',
  wake_up: 'wake',
  thinking: 'thinking',
  curious: 'curious',
  excited: 'excited',
  happy: 'happy',
  alert: 'alert',
  annoyed: 'annoyed',
  wave: 'wave',
  celebrate: 'celebrate',
  stretch: 'stretch',
  yawn: 'yawn',
};

const FRAME_COUNTS: Record<PetAnimation, number> = {
  idle: 4,
  blink: 3,
  look_around: 4,
  walk_left: 4,
  walk_right: 4,
  run_left: 4,
  run_right: 4,
  sit: 2,
  sleep: 2,
  wake_up: 3,
  thinking: 4,
  curious: 3,
  excited: 3,
  happy: 2,
  alert: 3,
  annoyed: 3,
  wave: 3,
  celebrate: 3,
  stretch: 3,
  yawn: 3,
};

const FPS: Partial<Record<PetAnimation, number>> = {
  blink: 8,
  walk_left: 8,
  walk_right: 8,
  run_left: 12,
  run_right: 12,
  sleep: 2,
  alert: 6,
  celebrate: 10,
};

function buildFrames(animation: PetAnimation): string[] {
  const folder = ANIMATION_FOLDERS[animation];
  const count = FRAME_COUNTS[animation];
  return Array.from({ length: count }, (_, i) =>
  `/assets/pets/otter/${folder}/frame-${String(i).padStart(2, '0')}.png`);
}

export function createAnimationFrames(): Record<PetAnimation, { frames: string[]; fps: number; loop: boolean }> {
  const animations = Object.keys(ANIMATION_FOLDERS) as PetAnimation[];
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
