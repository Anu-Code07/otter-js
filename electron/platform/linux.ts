import { exec } from 'child_process';
import { promisify } from 'util';
import type { ClaudeStatus } from '../../src/types/claude';
import { logger } from '../services/Logger';
import type { PermissionDialogInfo } from './permission';
import { matchesPermissionDialog } from './permission';

const execAsync = promisify(exec);

export interface PlatformAdapter {
  detectClaude(): Promise<ClaudeStatus>;
  detectPermissionDialog(): Promise<PermissionDialogInfo>;
}

async function isProcessRunning(namePattern: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`pgrep -f "${namePattern}" || true`);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

async function getFocusedWindowTitle(): Promise<string | null> {
  try {
    const { stdout } = await execAsync(
      'xdotool getwindowfocus getwindowname 2>/dev/null || true',
    );
    const title = stdout.trim();
    return title || null;
  } catch {
    return null;
  }
}

function inferStatusFromTitle(title: string): ClaudeStatus {
  const lower = title.toLowerCase();
  if (!lower.includes('claude')) return 'idle';
  if (
    lower.includes('waiting') ||
    lower.includes('input') ||
    lower.includes('respond') ||
    lower.includes('reply')
  ) {
    return 'waiting_for_user';
  }
  if (
    lower.includes('generating') ||
    lower.includes('thinking') ||
    lower.includes('working') ||
    lower.includes('...')
  ) {
    return 'working';
  }
  return 'idle';
}

export const linuxAdapter: PlatformAdapter = {
  async detectClaude(): Promise<ClaudeStatus> {
    const running =
      (await isProcessRunning('claude')) ||
      (await isProcessRunning('Claude')) ||
      (await isProcessRunning('anthropic'));

    if (!running) return 'not_detected';

    const title = await getFocusedWindowTitle();
    if (title && title.toLowerCase().includes('claude')) {
      return inferStatusFromTitle(title);
    }

    logger.debug('Claude process detected but window state unknown');
    return 'unknown';
  },

  async detectPermissionDialog(): Promise<PermissionDialogInfo> {
    const title = await getFocusedWindowTitle();
    if (!title || title.toLowerCase().includes('pixelpaw')) {
      return { detected: false };
    }
    if (matchesPermissionDialog(title)) {
      return {
        detected: true,
        appName: title.split(' - ')[0] ?? 'Application',
        message: title,
      };
    }
    return { detected: false };
  },
};
