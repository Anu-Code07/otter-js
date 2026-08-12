import type {
  AttentionSignal,
  AttentionSnapshot,
  AttentionSourceId,
} from '../../../src/types/attention';

export function createIdleSignal(sourceId: AttentionSourceId): AttentionSignal {
  return {
    sourceId,
    status: 'idle',
    priority: 'low',
    timestamp: Date.now(),
  };
}

function priorityRank(priority: AttentionSignal['priority']): number {
  switch (priority) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    default: return 1;
  }
}

export function mergeAttentionSnapshot(
  sources: Record<AttentionSourceId, AttentionSignal>,
): AttentionSnapshot {
  const values = Object.values(sources);
  const activeCandidates = values
    .filter((s) => s.status !== 'idle' && s.status !== 'unknown')
    .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority));

  const active = activeCandidates[0] ?? null;
  return { active, sources, topPriority: active?.priority ?? 'low' };
}
