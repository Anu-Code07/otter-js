import type { AttentionSignal } from '../../../src/types/attention';
import { BaseAttentionSource } from './BaseAttentionSource';
import { createIdleSignal } from './utils';
import { settingsService } from '../SettingsService';
import { logger } from '../Logger';

interface GitHubNotification {
  unread: boolean;
  reason: string;
  subject?: { title?: string; type?: string };
}

const PRIORITY_REASONS = new Set(['review_requested', 'ci_activity', 'assign', 'mention']);

export class GitHubAttentionSource extends BaseAttentionSource {
  readonly id = 'github' as const;

  constructor() {
    super('github');
  }

  protected pollIntervalMs(): number {
    return 120_000;
  }

  protected async detect(): Promise<AttentionSignal> {
    const token = settingsService.get().githubToken.trim();
    if (!token) {
      return createIdleSignal('github');
    }

    try {
      const response = await fetch('https://api.github.com/notifications?per_page=10', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (!response.ok) {
        logger.debug(`GitHub notifications failed: ${response.status}`);
        return createIdleSignal('github');
      }

      const notifications = (await response.json()) as GitHubNotification[];
      const hit = notifications.find(
        (n) => n.unread && PRIORITY_REASONS.has(n.reason),
      );

      if (!hit) {
        return createIdleSignal('github');
      }

      const priority =
        hit.reason === 'review_requested' || hit.reason === 'mention' ? 'high' : 'medium';

      return {
        sourceId: 'github',
        status: 'needs_user',
        priority,
        title: 'GitHub',
        message: hit.subject?.title ?? 'GitHub notification',
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.debug(`GitHub poll error: ${String(error)}`);
      return createIdleSignal('github');
    }
  }
}

export const githubAttentionSource = new GitHubAttentionSource();
