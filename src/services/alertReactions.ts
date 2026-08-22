import type { AttentionSourceId, AttentionStatus } from '../types/attention';
import type { PetAnimation } from '../types/pet';

export function alertAnimationForSource(
  sourceId: AttentionSourceId,
  status: AttentionStatus,
): PetAnimation {
  if (status === 'success') return 'celebrate';
  if (status === 'error') return 'annoyed';

  switch (sourceId) {
    case 'git':
      return 'curious';
    case 'build':
      return status === 'needs_user' ? 'annoyed' : 'thinking';
    case 'terminal':
      return 'alert';
    case 'permission':
      return 'alert';
    case 'claude':
      return status === 'needs_user' ? 'alert' : 'thinking';
    case 'meeting':
      return 'sit';
    case 'integration':
      return 'wave';
    default:
      return 'alert';
  }
}

export type TrayPetState = 'idle' | 'sleeping' | 'alert' | 'meeting' | 'happy';

export function deriveTrayState(
  petState: string,
  hasActiveAlert: boolean,
): TrayPetState {
  if (hasActiveAlert || petState === 'alert' || petState.includes('waiting')) return 'alert';
  if (petState === 'sleeping') return 'sleeping';
  if (petState === 'in_meeting') return 'meeting';
  if (petState === 'excited') return 'happy';
  return 'idle';
}
