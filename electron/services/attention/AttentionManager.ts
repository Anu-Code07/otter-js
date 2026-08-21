import type {
  AttentionSignal,
  AttentionSnapshot,
  AttentionSourceId,
} from '../../../src/types/attention';
import { mergeAttentionSnapshot } from './utils';
import { settingsService } from '../SettingsService';
import { logger } from '../Logger';
import { claudeAttentionSource } from './ClaudeAttentionSource';
import { permissionAttentionSource } from './PermissionAttentionSource';
import { buildAttentionSource } from './BuildAttentionSource';
import { terminalAttentionSource } from './TerminalAttentionSource';
import { gitAttentionSource, resolveGitWorkingDirectory } from './GitAttentionSource';
import { meetingAttentionSource } from './MeetingAttentionSource';
import { integrationWebhookSource } from './IntegrationWebhookSource';
import { BaseAttentionSource } from './BaseAttentionSource';

export class AttentionManager {
  private sources: Record<AttentionSourceId, BaseAttentionSource> = {
    claude: claudeAttentionSource,
    permission: permissionAttentionSource,
    build: buildAttentionSource,
    terminal: terminalAttentionSource,
    git: gitAttentionSource,
    meeting: meetingAttentionSource,
    integration: integrationWebhookSource,
  };

  private signals: Record<AttentionSourceId, AttentionSignal> = {
    claude: claudeAttentionSource.getSignal(),
    permission: permissionAttentionSource.getSignal(),
    build: buildAttentionSource.getSignal(),
    terminal: terminalAttentionSource.getSignal(),
    git: gitAttentionSource.getSignal(),
    meeting: meetingAttentionSource.getSignal(),
    integration: integrationWebhookSource.getSignal(),
  };

  private snapshot: AttentionSnapshot = mergeAttentionSnapshot(this.signals);
  private listeners = new Set<(snapshot: AttentionSnapshot) => void>();
  private unsubs: Array<() => void> = [];

  start(): void {
    this.applySettings();
    for (const source of Object.values(this.sources)) {
      const unsub = source.onSignalChange((signal) => this.handleSourceSignal(signal));
      this.unsubs.push(unsub);
      source.start();
    }
    logger.info('Attention manager started');
  }

  stop(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    for (const source of Object.values(this.sources)) {
      source.stop();
    }
  }

  applySettings(): void {
    const s = settingsService.get();
    this.sources.claude.setEnabled(s.claudeDetectionEnabled);
    this.sources.permission.setEnabled(s.permissionDetectionEnabled);
    this.sources.build.setEnabled(s.buildDetectionEnabled);
    this.sources.terminal.setEnabled(s.terminalDetectionEnabled);
    this.sources.git.setEnabled(s.gitDetectionEnabled);
    this.sources.meeting.setEnabled(s.meetingDetectionEnabled);
    this.sources.integration.setEnabled(s.integrationWebhookEnabled);
    gitAttentionSource.setWorkingDirectory(resolveGitWorkingDirectory(s));
    integrationWebhookSource.restartServer();
  }

  getSnapshot(): AttentionSnapshot {
    return this.snapshot;
  }

  onSnapshotChange(callback: (snapshot: AttentionSnapshot) => void): () => void {
    this.listeners.add(callback);
    callback(this.snapshot);
    return () => this.listeners.delete(callback);
  }

  simulateSource(sourceId: AttentionSourceId, signal: Partial<AttentionSignal> | null): void {
    this.sources[sourceId].setSimulatedSignal(signal);
  }

  simulateClaudeStatus(status: string | null): void {
    if (status === null) {
      claudeAttentionSource.setSimulatedSignal(null);
      return;
    }
    const mapped = status === 'waiting_for_user' ? 'needs_user'
      : status === 'working' ? 'working'
      : status === 'idle' ? 'idle' : 'unknown';
    claudeAttentionSource.setSimulatedSignal({
      status: mapped as AttentionSignal['status'],
      priority: mapped === 'needs_user' ? 'high' : 'medium',
      title: 'Claude',
      message: mapped === 'needs_user' ? 'Claude needs your input' : undefined,
    });
  }

  private handleSourceSignal(signal: AttentionSignal): void {
    this.signals[signal.sourceId] = signal;
    const next = mergeAttentionSnapshot(this.signals);
    if (JSON.stringify(next.active) === JSON.stringify(this.snapshot.active) &&
        next.topPriority === this.snapshot.topPriority) {
      return;
    }
    this.snapshot = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }
}

export const attentionManager = new AttentionManager();
