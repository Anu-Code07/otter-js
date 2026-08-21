export type AttentionSourceId =
  | 'claude'
  | 'permission'
  | 'build'
  | 'terminal'
  | 'git'
  | 'meeting'
  | 'integration';

export type AttentionStatus =
  | 'idle'
  | 'working'
  | 'needs_user'
  | 'success'
  | 'error'
  | 'unknown';

export type AttentionPriority = 'low' | 'medium' | 'high' | 'critical';

export interface AttentionSignal {
  sourceId: AttentionSourceId;
  status: AttentionStatus;
  priority: AttentionPriority;
  message?: string;
  title?: string;
  timestamp: number;
}

export interface AttentionSnapshot {
  active: AttentionSignal | null;
  sources: Record<AttentionSourceId, AttentionSignal>;
  topPriority: AttentionPriority;
}

export interface AttentionSource {
  readonly id: AttentionSourceId;
  start(): void;
  stop(): void;
  getSignal(): AttentionSignal;
  onSignalChange(callback: (signal: AttentionSignal) => void): () => void;
  setSimulatedSignal?(signal: Partial<AttentionSignal> | null): void;
}

export const ATTENTION_SOURCE_LABELS: Record<AttentionSourceId, string> = {
  claude: 'Claude',
  permission: 'Permission Dialog',
  build: 'Build / CI',
  terminal: 'Terminal',
  git: 'Git',
  meeting: 'Meetings',
  integration: 'Integration',
};

export const DEFAULT_ATTENTION_MESSAGES: Record<AttentionSourceId, string[]> = {
  claude: [
    'Claude needs you 👀',
    'Hey... Claude is waiting',
    'Psst...',
    'Human!',
    'Your AI needs instructions',
  ],
  permission: [
    'Something wants permission 👀',
    'An app is asking for access',
    'Permission needed!',
    'Hey, allow or deny this',
    'Security check waiting',
  ],
  build: [
    'Build finished!',
    'CI needs you',
    'Build failed — check it out',
    'Your build is done',
  ],
  terminal: [
    'Terminal needs input',
    'Your shell is waiting',
    'Command needs confirmation',
    'Check your terminal',
  ],
  git: [
    'Git needs attention',
    'Merge conflict?',
    'Git hook waiting',
    'Check your repo status',
  ],
  meeting: [
    'Meeting time — I\'ll stay quiet',
    'Focus mode',
    'In a call',
  ],
  integration: [
    'Something needs you',
    'Integration alert',
    'Your tool is calling',
    'Hey human!',
  ],
};
