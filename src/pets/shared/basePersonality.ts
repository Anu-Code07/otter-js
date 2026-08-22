import type { PersonalityDefinition } from '../../types/pet';

const basePersonality: Omit<PersonalityDefinition, 'clickMessages' | 'idleMessages' | 'alertMessages'> = {
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
  idleMessages: [
    'meow. that is all.',
    'judging your commits',
    'pet me or pay rent',
    'i saw that typo',
    'working? doubt it',
    'keyboard warmer reporting',
    'mrow? ...never mind',
    'nap o clock soon',
    'you left for 2 minutes',
    'i own this desk now',
  ],
  alertMessages: ['Meow! Attention!', 'Psst human', 'Something needs you'],
  curiosityChance: 0.4,
  ignoreCursorChance: 0.55,
  followCursorBias: 0.5,
};

export const dragonPersonality: PersonalityDefinition = {
  ...basePersonality,
  clickMessages: ['roar!', 'fwah', 'burn?', 'shiny', 'guard mode'],
  idleMessages: [
    'roar yo',
    'i am very scary',
    'do not provoke me',
    'tiny but fierce',
    'where is the shiny',
    'burn the bugs',
    'guard mode engaged',
    'fwah anyway',
    'respect the wings',
    'yo dragon here',
    'fear my pixel fire',
  ],
  alertMessages: ['Dragon senses danger!', 'Something needs you', 'Alert the realm!'],
  clickReactions: ['excited', 'celebrate', 'wave', 'alert', 'happy'],
  celebrateAnimation: 'excited',
  curiosityChance: 0.6,
  ignoreCursorChance: 0.2,
};

export const penguinPersonality: PersonalityDefinition = {
  ...basePersonality,
  clickMessages: ['honk', 'waddle', 'brr', 'slide!', 'peep'],
  idleMessages: [
    'honk if you love ice',
    'why is it warm here',
    'slide into production',
    'brr dev mode',
    'waddle waddle deploy',
    'peep peep merge conflict',
    'this hoodie is my office',
    'ice breakers only',
    'cold code hot takes',
  ],
  alertMessages: ['Honk honk!', 'Cold alert', 'Penguin ping'],
  walkBias: 2.5,
  curiosityChance: 0.55,
  ignoreCursorChance: 0.35,
};

export const raccoonPersonality: PersonalityDefinition = {
  ...basePersonality,
  clickMessages: ['trash?', 'sneak', 'hey', 'bandit', 'shiny'],
  idleMessages: [
    'found shiny in trash',
    'bandit business hours',
    'your secrets are trash',
    'raccoon tax snacks',
    'sneak sneak npm install',
    'nothing sketchy promise',
    'midnight deploy energy',
    'is that recyclable code',
    'trash panda on duty',
    'five finger discount',
  ],
  alertMessages: ['Raccoon radar!', 'Something shiny', 'Night patrol'],
  curiosityChance: 0.9,
  ignoreCursorChance: 0.15,
  followCursorBias: 1.1,
};
