import type { PersonalityDefinition } from '../../types/pet';

const basePersonality: Omit<PersonalityDefinition, 'clickMessages' | 'alertMessages'> = {
  idleBehaviours: [
    { action: 'blink', weight: 30 },
    { action: 'look_around', weight: 20 },
    { action: 'stretch', weight: 10 },
    { action: 'walk', weight: 15 },
    { action: 'sit', weight: 15 },
    { action: 'sleep', weight: 5 },
    { action: 'play', weight: 5 },
  ],
  clickReactions: ['wave', 'excited', 'blink', 'annoyed', 'happy'],
  curiosityChance: 0.7,
  ignoreCursorChance: 0.25,
};

export const catPersonality: PersonalityDefinition = {
  ...basePersonality,
  clickMessages: ['meow', 'purr', 'mrow?', 'nya', 'pet me'],
  alertMessages: ['Meow! Attention!', 'Psst human', 'Something needs you'],
  curiosityChance: 0.4,
  ignoreCursorChance: 0.55,
  followCursorBias: 0.5,
};

export const dragonPersonality: PersonalityDefinition = {
  ...basePersonality,
  clickMessages: ['roar!', 'fwah', 'burn?', 'shiny', 'guard mode'],
  alertMessages: ['Dragon senses danger!', 'Something needs you', 'Alert the realm!'],
  clickReactions: ['excited', 'celebrate', 'wave', 'alert', 'happy'],
  celebrateAnimation: 'excited',
  curiosityChance: 0.6,
  ignoreCursorChance: 0.2,
};

export const penguinPersonality: PersonalityDefinition = {
  ...basePersonality,
  clickMessages: ['honk', 'waddle', 'brr', 'slide!', 'peep'],
  alertMessages: ['Honk honk!', 'Cold alert', 'Penguin ping'],
  walkBias: 2.5,
  curiosityChance: 0.55,
  ignoreCursorChance: 0.35,
};

export const raccoonPersonality: PersonalityDefinition = {
  ...basePersonality,
  clickMessages: ['trash?', 'sneak', 'hey', 'bandit', 'shiny'],
  alertMessages: ['Raccoon radar!', 'Something shiny', 'Night patrol'],
  curiosityChance: 0.9,
  ignoreCursorChance: 0.15,
  followCursorBias: 1.1,
};
