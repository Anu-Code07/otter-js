import { screen } from 'electron';
import type { CursorPosition } from '../../src/types/system';
import { logger } from './Logger';

const THROTTLE_MS = 33; // ~30fps

export class CursorTracker {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<(position: CursorPosition) => void>();
  private lastEmit = 0;
  private lastPosition: CursorPosition = { x: 0, y: 0 };

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.poll(), THROTTLE_MS);
    logger.debug('Cursor tracker started');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.debug('Cursor tracker stopped');
  }

  onMove(callback: (position: CursorPosition) => void): () => void {
    this.listeners.add(callback);
    callback(this.lastPosition);
    return () => this.listeners.delete(callback);
  }

  getPosition(): CursorPosition {
    return { ...this.lastPosition };
  }

  private poll(): void {
    const point = screen.getCursorScreenPoint();
    const now = Date.now();
    if (
      point.x === this.lastPosition.x &&
      point.y === this.lastPosition.y &&
      now - this.lastEmit < THROTTLE_MS
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
