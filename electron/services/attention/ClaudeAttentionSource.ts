import type { AttentionSignal } from '../../../src/types/attention';
import { detectClaudeOnPlatform } from '../../platform';
import type { ClaudeStatus } from '../../../src/types/claude';
import { BaseAttentionSource } from './BaseAttentionSource';

function mapClaudeStatus(status: ClaudeStatus): AttentionSignal['status'] {
  switch (status) {
    case 'working': return 'working';
    case 'waiting_for_user': return 'needs_user';
    case 'idle': return 'idle';
    case 'not_detected': return 'idle';
    default: return 'unknown';
  }
}

function mapClaudePriority(status: ClaudeStatus): AttentionSignal['priority'] {
  if (status === 'waiting_for_user') return 'high';
  if (status === 'working') return 'medium';
  return 'low';
}

export class ClaudeAttentionSource extends BaseAttentionSource {
  readonly id = 'claude' as const;

  constructor() {
    super('claude');
  }

  protected async detect(): Promise<AttentionSignal> {
    const claudeStatus = await detectClaudeOnPlatform();
    const status = mapClaudeStatus(claudeStatus);
    return {
      sourceId: 'claude',
      status,
      priority: mapClaudePriority(claudeStatus),
      title: 'Claude',
      message: status === 'needs_user' ? 'Claude needs your input' : undefined,
      timestamp: Date.now(),
    };
  }

  setSimulatedClaudeStatus(status: ClaudeStatus | null): void {
    if (status === null) {
      this.setSimulatedSignal(null);
      return;
    }
    this.setSimulatedSignal({
      status: mapClaudeStatus(status),
      priority: mapClaudePriority(status),
      title: 'Claude',
      message: status === 'waiting_for_user' ? 'Claude needs your input' : undefined,
    });
  }
}

export const claudeAttentionSource = new ClaudeAttentionSource();
