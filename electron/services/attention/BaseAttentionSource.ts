import type { AttentionSignal, AttentionSourceId } from '../../../src/types/attention';
import { createIdleSignal } from './utils';

export abstract class BaseAttentionSource {
  abstract readonly id: AttentionSourceId;
  protected signal: AttentionSignal;
  protected listeners = new Set<(signal: AttentionSignal) => void>();
  protected simulated: Partial<AttentionSignal> | null = null;
  protected enabled = true;
  protected intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(id: AttentionSourceId) {
    this.signal = createIdleSignal(id);
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => void this.poll(), this.pollIntervalMs());
    void this.poll();
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
      this.emit(createIdleSignal(this.id));
    } else {
      void this.poll();
    }
  }

  setSimulatedSignal(signal: Partial<AttentionSignal> | null): void {
    this.simulated = signal;
    if (signal) {
      this.emit({
        ...createIdleSignal(this.id),
        ...signal,
        sourceId: this.id,
        timestamp: Date.now(),
      });
    } else {
      void this.poll();
    }
  }

  getSignal(): AttentionSignal {
    return { ...this.signal };
  }

  onSignalChange(callback: (signal: AttentionSignal) => void): () => void {
    this.listeners.add(callback);
    callback(this.getSignal());
    return () => this.listeners.delete(callback);
  }

  protected pollIntervalMs(): number {
    return 2000;
  }

  protected abstract detect(): Promise<AttentionSignal>;

  protected async poll(): Promise<void> {
    if (this.simulated) {
      this.emit({
        ...createIdleSignal(this.id),
        ...this.simulated,
        sourceId: this.id,
        timestamp: Date.now(),
      });
      return;
    }
    if (!this.enabled) {
      this.emit(createIdleSignal(this.id));
      return;
    }
    try {
      const detected = await this.detect();
      this.emit(detected);
    } catch {
      this.emit({ ...createIdleSignal(this.id), status: 'unknown' });
    }
  }

  protected emit(next: AttentionSignal): void {
    if (
      next.status === this.signal.status &&
      next.message === this.signal.message &&
      next.title === this.signal.title &&
      next.priority === this.signal.priority
    ) {
      return;
    }
    this.signal = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }
}
