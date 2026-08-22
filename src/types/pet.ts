export type PetAnimation =
  | 'idle'
  | 'blink'
  | 'look_around'
  | 'walk_left'
  | 'walk_right'
  | 'run_left'
  | 'run_right'
  | 'sit'
  | 'sleep'
  | 'wake_up'
  | 'thinking'
  | 'curious'
  | 'excited'
  | 'happy'
  | 'alert'
  | 'annoyed'
  | 'wave'
  | 'celebrate'
  | 'stretch'
  | 'yawn';

export type PetState =
  | 'idle'
  | 'walking'
  | 'sleeping'
  | 'following_cursor'
  | 'thinking'
  | 'claude_working'
  | 'claude_waiting'
  | 'attention_working'
  | 'attention_waiting'
  | 'excited'
  | 'alert'
  | 'annoyed'
  | 'in_meeting';

export interface AnimationDefinition {
  name: PetAnimation;
  frames: string[];
  fps: number;
  loop: boolean;
}

export interface IdleBehaviour {
  action: PetAnimation | 'walk' | 'play' | 'scratch' | 'look_left' | 'look_right';
  weight: number;
}

export interface PetStats {
  energy: number;
  happiness: number;
  attention: number;
}

export interface PersonalityDefinition {
  idleBehaviours: IdleBehaviour[];
  clickReactions: PetAnimation[];
  clickMessages: string[];
  alertMessages: string[];
  curiosityChance: number;
  ignoreCursorChance: number;
  /** Multiplier for follow-cursor interaction frequency (default 1) */
  followCursorBias?: number;
  /** Preferred celebrate animation */
  celebrateAnimation?: PetAnimation;
  /** Weight multiplier for walk idle behaviour (penguin waddle) */
  walkBias?: number;
}

export interface PetDefinition {
  id: string;
  name: string;
  animations: Record<PetAnimation, AnimationDefinition>;
  personality: PersonalityDefinition;
}

export interface PetPosition {
  x: number;
  y: number;
}
