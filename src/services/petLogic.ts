import type { AttentionSignal } from '../types/attention';
import { DEFAULT_ATTENTION_MESSAGES } from '../types/attention';
import type { PetAnimation, PetState } from '../types/pet';
import type { ClaudeStatus } from '../types/claude';

export function attentionSignalToPetState(signal: AttentionSignal | null): PetState | null {
  if (!signal) return null;
  switch (signal.status) {
    case 'working':
      if (signal.sourceId === 'meeting') return 'in_meeting';
      return signal.sourceId === 'claude' ? 'claude_working' : 'attention_working';
    case 'needs_user':
      return signal.sourceId === 'claude' ? 'claude_waiting' : 'attention_waiting';
    case 'success':
      return 'excited';
    case 'error':
      return 'annoyed';
    case 'idle':
      return signal.sourceId === 'claude' ? 'thinking' : null;
    default:
      return null;
  }
}

export function animationForState(state: PetState, facing: 'left' | 'right'): PetAnimation {
  switch (state) {
    case 'walking':
    case 'following_cursor':
      return facing === 'left' ? 'walk_left' : 'walk_right';
    case 'sleeping':
      return 'sleep';
    case 'thinking':
    case 'claude_working':
    case 'attention_working':
      return 'thinking';
    case 'claude_waiting':
    case 'attention_waiting':
    case 'alert':
      return 'alert';
    case 'excited':
      return 'celebrate';
    case 'annoyed':
      return 'annoyed';
    case 'in_meeting':
      return 'sit';
    default:
      return 'idle';
  }
}

/** @deprecated Use attention system */
export function claudeStatusToPetState(status: ClaudeStatus): PetState | null {
  switch (status) {
    case 'working': return 'claude_working';
    case 'waiting_for_user': return 'claude_waiting';
    case 'idle': return 'thinking';
  }
  return null;
}

export function shouldTriggerClaudeAlert(
  previous: ClaudeStatus,
  current: ClaudeStatus,
  hasAlerted: boolean,
): boolean {
  if (current !== 'waiting_for_user') return false;
  if (previous === 'waiting_for_user') return false;
  if (hasAlerted) return false;
  return true;
}

export function shouldResetClaudeAlert(
  previous: ClaudeStatus,
  current: ClaudeStatus,
): boolean {
  return previous === 'waiting_for_user' && current !== 'waiting_for_user';
}

export function getAlertMessage(signal: AttentionSignal): string {
  if (signal.message) return signal.message;
  const messages = DEFAULT_ATTENTION_MESSAGES[signal.sourceId];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function distanceBetween(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function cursorReactionLevel(distance: number): 'far' | 'look' | 'approach' | 'interact' {
  if (distance > 500) return 'far';
  if (distance > 200) return 'look';
  if (distance > 100) return 'approach';
  return 'interact';
}

export function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

export function isBusyPetState(state: PetState): boolean {
  return [
    'claude_waiting',
    'attention_waiting',
    'alert',
    'sleeping',
    'claude_working',
    'attention_working',
    'in_meeting',
  ].includes(state);
}
