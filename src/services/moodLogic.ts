import type { PetStats, PetState } from '../types/pet';

export type PetMood = 'ecstatic' | 'happy' | 'content' | 'tired' | 'sleepy' | 'grumpy';

export const MOOD_LABELS: Record<PetMood, string> = {
  ecstatic: 'Ecstatic',
  happy: 'Happy',
  content: 'Content',
  tired: 'Tired',
  sleepy: 'Sleepy',
  grumpy: 'Grumpy',
};

export const MOOD_EMOJI: Record<PetMood, string> = {
  ecstatic: '🤩',
  happy: '😊',
  content: '🙂',
  tired: '😴',
  sleepy: '💤',
  grumpy: '😾',
};

export function computeMood(stats: PetStats, petState: PetState): PetMood {
  if (petState === 'sleeping') return 'sleepy';
  if (stats.energy < 18) return 'sleepy';
  if (stats.energy < 38) return 'tired';
  if (stats.happiness < 32) return 'grumpy';
  if (stats.happiness > 82 && stats.energy > 45) return 'ecstatic';
  if (stats.happiness > 62) return 'happy';
  return 'content';
}

export function decayStats(stats: PetStats): PetStats {
  return {
    energy: Math.max(0, stats.energy - 0.35),
    happiness: Math.max(0, stats.happiness - 0.2),
    attention: Math.max(0, stats.attention - 0.15),
  };
}

export function feedStatsOnClick(stats: PetStats): PetStats {
  return {
    energy: Math.min(100, stats.energy + 1),
    happiness: Math.min(100, stats.happiness + 4),
    attention: Math.min(100, stats.attention + 2),
  };
}

export function feedStatsOnSuccess(stats: PetStats): PetStats {
  return {
    energy: Math.min(100, stats.energy + 5),
    happiness: Math.min(100, stats.happiness + 8),
    attention: Math.min(100, stats.attention + 3),
  };
}

export function feedStatsOnCelebrate(stats: PetStats): PetStats {
  return {
    energy: Math.min(100, stats.energy + 2),
    happiness: Math.min(100, stats.happiness + 6),
    attention: Math.min(100, stats.attention + 2),
  };
}

export function personalizeMessage(message: string, petName: string | undefined): string {
  const name = petName?.trim();
  if (!name) return message;
  if (Math.random() < 0.35) {
    return `${name}, ${message}`;
  }
  return message;
}

export function welcomeBackMessage(petName: string | undefined): string {
  const options = petName?.trim()
    ? [`Hey ${petName}, you're back!`, `Welcome back, ${petName}!`, `${petName}! Missed you.`]
    : ["You're back!", "Hey, welcome back!", "Oh, you're here again!"];
  return options[Math.floor(Math.random() * options.length)];
}
