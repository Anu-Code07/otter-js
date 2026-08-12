import type { ClaudeStatus } from '../../src/types/claude';
import { logger } from './Logger';
import { detectClaudeOnPlatform } from '../platform';

const POLL_INTERVAL_MS = 2000;

export class ClaudeDetectorService {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private status: ClaudeStatus = 'unknown';
  private listeners = new Set<(status: ClaudeStatus) => void>();
  private simulatedStatus: ClaudeStatus | null = null;
  private enabled = true;

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => void this.poll(), POLL_INTERVAL_MS);
    void this.poll();
    logger.debug('Claude detector started');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.setStatus('not_detected');
    }
  }

  setSimulatedStatus(status: ClaudeStatus | null): void {
    this.simulatedStatus = status;
    if (status !== null) {
      this.setStatus(status);
    } else {
      void this.poll();
    }
  }

  getStatus(): ClaudeStatus {
    return this.status;
  }

  onStatusChange(callback: (status: ClaudeStatus) => void): () => void {
    this.listeners.add(callback);
    callback(this.status);
    return () => this.listeners.delete(callback);
  }

  private async poll(): Promise<void> {
    if (this.simulatedStatus !== null) {
      this.setStatus(this.simulatedStatus);
      return;
    }
    if (!this.enabled) {
      this.setStatus('not_detected');
      return;
    }
    try {
      const detected = await detectClaudeOnPlatform();
      this.setStatus(detected);
    } catch (error) {
      logger.warn('Claude detection failed, falling back to unknown');
      logger.debug(String(error));
      this.setStatus('unknown');
    }
  }

  private setStatus(next: ClaudeStatus): void {
    if (next === this.status) return;
    this.status = next;
    logger.debug(`Claude status: ${next}`);
    for (const listener of this.listeners) {
      listener(next);
    }
  }
}

export const claudeDetector = new ClaudeDetectorService();
