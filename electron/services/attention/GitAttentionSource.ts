import { exec } from 'child_process';
import { promisify } from 'util';
import type { AttentionSignal } from '../../../src/types/attention';
import { BaseAttentionSource } from './BaseAttentionSource';
import { createIdleSignal } from './utils';

const execAsync = promisify(exec);

export class GitAttentionSource extends BaseAttentionSource {
  readonly id = 'git' as const;
  private cwd = process.cwd();

  constructor() {
    super('git');
  }

  protected pollIntervalMs(): number {
    return 5000;
  }

  setWorkingDirectory(cwd: string): void {
    this.cwd = cwd;
  }

  protected async detect(): Promise<AttentionSignal> {
    try {
      const { stdout: status } = await execAsync('git status --porcelain', { cwd: this.cwd });
      const { stdout: merge } = await execAsync(
        'git diff --name-only --diff-filter=U 2>/dev/null || true',
        { cwd: this.cwd },
      );

      if (merge.trim().length > 0) {
        return {
          sourceId: 'git',
          status: 'needs_user',
          priority: 'high',
          title: 'Git',
          message: 'Merge conflicts need resolution',
          timestamp: Date.now(),
        };
      }

      if (status.includes('UU') || status.includes('AA') || status.includes('DD')) {
        return {
          sourceId: 'git',
          status: 'needs_user',
          priority: 'high',
          title: 'Git',
          message: 'Git conflict detected',
          timestamp: Date.now(),
        };
      }

      const hookWaiting = await this.checkHookWaiting();
      if (hookWaiting) {
        return {
          sourceId: 'git',
          status: 'needs_user',
          priority: 'medium',
          title: 'Git',
          message: 'Git hook may be waiting',
          timestamp: Date.now(),
        };
      }

      return createIdleSignal('git');
    } catch {
      return createIdleSignal('git');
    }
  }

  private async checkHookWaiting(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('pgrep -f "git.*hook" || true');
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }
}

export const gitAttentionSource = new GitAttentionSource();
