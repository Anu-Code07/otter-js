import { screen } from 'electron';
import type { CursorPosition } from '../../src/types/system';
import { logger } from './Logger';

const POLL_MS = 50;

export class CursorTracker {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<(position: CursorPosition) => void>();
  private lastEmit = 0;
  private lastPosition: CursorPosition = { x: 0, y: 0 };

  start(): void {
    this.ensurePolling();
  }

  stop(): void {
    this.stopPolling();
    logger.debug('Cursor tracker stopped');
  }

  onMove(callback: (position: CursorPosition) => void): () => void {
    this.listeners.add(callback);
    callback(this.lastPosition);
    this.ensurePolling();
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.stopPolling();
      }
    };
  }

  getPosition(): CursorPosition {
    return { ...this.lastPosition };
  }

  private ensurePolling(): void {
    if (this.intervalId || this.listeners.size === 0) return;
    this.intervalId = setInterval(() => this.poll(), POLL_MS);
    logger.debug('Cursor tracker polling started');
  }

  private stopPolling(): void {
    if (!this.intervalId) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
    logger.debug('Cursor tracker polling stopped');
  }

  private poll(): void {
    if (this.listeners.size === 0) {
      this.stopPolling();
      return;
    }

    const point = screen.getCursorScreenPoint();
    const now = Date.now();
    if (
      point.x === this.lastPosition.x &&
      point.y === this.lastPosition.y &&
      now - this.lastEmit < POLL_MS
    ) {
      return;
    }
    this.lastPosition = { x: point.x, y: point.y };
    this.lastEmit = now;
    this.emit(this.lastPosition);
  }

  private emit(position: CursorPosition): void {
    for (const listener of this.listeners) {
      listener(position);
    }
  }
}

export const cursorTracker = new CursorTracker();
