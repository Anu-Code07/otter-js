export type ClaudeStatus =
  | 'not_detected'
  | 'idle'
  | 'working'
  | 'waiting_for_user'
  | 'unknown';

export interface ClaudeDetector {
  start(): void;
  stop(): void;
  getStatus(): ClaudeStatus;
  onStatusChange(callback: (status: ClaudeStatus) => void): () => void;
  setSimulatedStatus?(status: ClaudeStatus | null): void;
}
