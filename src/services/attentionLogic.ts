import type {
  AttentionSignal,
  AttentionSnapshot,
  AttentionSourceId,
  AttentionStatus,
} from '../types/attention';

export function createIdleSignal(sourceId: AttentionSourceId): AttentionSignal {
  return {
    sourceId,
    status: 'idle',
    priority: 'low',
    timestamp: Date.now(),
  };
}

export function isNeedsUserStatus(status: AttentionStatus): boolean {
  return status === 'needs_user';
}

export function isWorkingStatus(status: AttentionStatus): boolean {
  return status === 'working';
}

export function isSuccessStatus(status: AttentionStatus): boolean {
  return status === 'success';
}

export function priorityRank(priority: AttentionSignal['priority']): number {
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
  const topPriority = active?.priority ?? 'low';

  return { active, sources, topPriority };
}

export function shouldTriggerAttentionAlert(
  previous: AttentionSignal,
  current: AttentionSignal,
  alertedKey: string | null,
): boolean {
  if (!isNeedsUserStatus(current.status)) return false;
  if (isNeedsUserStatus(previous.status) && previous.sourceId === current.sourceId) return false;
  const key = `${current.sourceId}:${current.message ?? current.status}`;
  if (alertedKey === key) return false;
  return true;
}

export function attentionAlertKey(signal: AttentionSignal): string {
  return `${signal.sourceId}:${signal.message ?? signal.status}`;
}

export function shouldResetAttentionAlert(
  previous: AttentionSignal,
  current: AttentionSignal,
): boolean {
  return (
    isNeedsUserStatus(previous.status) &&
    !isNeedsUserStatus(current.status) &&
    previous.sourceId === current.sourceId
  );
}

export function isSourceAlertsEnabled(
  sourceId: AttentionSourceId,
  settings: {
    attentionAlertsEnabled: boolean;
    claudeAlerts: boolean;
    permissionAlerts: boolean;
    buildAlerts: boolean;
    terminalAlerts: boolean;
    gitAlerts: boolean;
    meetingAlerts: boolean;
    integrationAlerts: boolean;
    githubAlerts: boolean;
    calendarAlerts: boolean;
  },
): boolean {
  if (!settings.attentionAlertsEnabled) return false;
  switch (sourceId) {
    case 'claude': return settings.claudeAlerts;
    case 'permission': return settings.permissionAlerts;
    case 'build': return settings.buildAlerts;
    case 'terminal': return settings.terminalAlerts;
    case 'git': return settings.gitAlerts;
    case 'meeting': return settings.meetingAlerts;
    case 'integration': return settings.integrationAlerts;
    case 'github': return settings.githubAlerts;
    case 'calendar': return settings.calendarAlerts;
    default: return false;
  }
}

export function isInDoNotDisturb(
  enabled: boolean,
  start: string,
  end: string,
  now = new Date(),
): boolean {
  if (!enabled) return false;
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  const current = now.getHours() * 60 + now.getMinutes();
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  if (startMin <= endMin) {
    return current >= startMin && current < endMin;
  }
  return current >= startMin || current < endMin;
}
