import type { PetAnimation } from '../types/pet';
import { resolvePetAsset } from '../services/assetPaths';

const ANIMATION_FOLDERS: Record<PetAnimation, { folder: string; frameCount: number }> = {
  idle: { folder: 'idle', frameCount: 2 },
  blink: { folder: 'blink', frameCount: 3 },
  look_around: { folder: 'look-around', frameCount: 4 },
  walk_left: { folder: 'walk-left', frameCount: 4 },
  walk_right: { folder: 'walk-right', frameCount: 4 },
  run_left: { folder: 'run-left', frameCount: 4 },
  run_right: { folder: 'run-right', frameCount: 4 },
  sit: { folder: 'sit', frameCount: 2 },
  sleep: { folder: 'sleep', frameCount: 1 },
  wake_up: { folder: 'wake', frameCount: 3 },
  thinking: { folder: 'thinking', frameCount: 4 },
  curious: { folder: 'curious', frameCount: 3 },
  excited: { folder: 'excited', frameCount: 3 },
  happy: { folder: 'happy', frameCount: 2 },
  alert: { folder: 'alert', frameCount: 1 },
  annoyed: { folder: 'annoyed', frameCount: 3 },
  wave: { folder: 'wave', frameCount: 1 },
  celebrate: { folder: 'celebrate', frameCount: 3 },
  stretch: { folder: 'stretch', frameCount: 3 },
  yawn: { folder: 'yawn', frameCount: 3 },
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
  thinking: 5,
  curious: 6,
};

function buildFramePath(petId: string, folder: string, index: number): string {
  return resolvePetAsset(`pets/${petId}/${folder}/frame-${String(index).padStart(2, '0')}.png`);
}

function buildFrames(petId: string, animation: PetAnimation): string[] {
  const { folder, frameCount } = ANIMATION_FOLDERS[animation];
  return Array.from({ length: frameCount }, (_, i) => buildFramePath(petId, folder, i));
}

export function createAnimationFrames(
  petId: string,
): Record<PetAnimation, { frames: string[]; fps: number; loop: boolean }> {
  const animations = Object.keys(ANIMATION_FOLDERS) as PetAnimation[];
  const result = {} as Record<PetAnimation, { frames: string[]; fps: number; loop: boolean }>;

  for (const name of animations) {
    const oneShot = ['blink', 'wake_up', 'yawn', 'wave', 'celebrate', 'happy'].includes(name);
    result[name] = {
      frames: buildFrames(petId, name),
      fps: FPS[name] ?? 6,
      loop: !oneShot,
    };
  }

  return result;
}
