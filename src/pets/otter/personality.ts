import type { PersonalityDefinition } from '../types/pet';

export const otterPersonality: PersonalityDefinition = {
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
  clickMessages: ['hey', 'boop', 'what?', 'hi', 'stop poking me'],
  alertMessages: [
    'Claude needs you 👀',
    'Hey... Claude is waiting',
    'Psst...',
    'Human!',
    'Your AI needs instructions',
    'Claude finished!',
  ],
  curiosityChance: 0.85,
  ignoreCursorChance: 0.1,
  followCursorBias: 1.3,
  celebrateAnimation: 'celebrate',
};
