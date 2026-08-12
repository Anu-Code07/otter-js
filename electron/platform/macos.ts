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

async function isProcessRunning(name: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `pgrep -x "${name}" || pgrep -f "${name}" || true`,
    );
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

async function getFrontmostAppName(): Promise<string | null> {
  try {
    const { stdout } = await execAsync(
      `osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`,
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

async function getFrontWindowTitle(): Promise<string | null> {
  try {
    const { stdout } = await execAsync(
      `osascript -e 'tell application "System Events" to get title of front window of (first application process whose frontmost is true)'`,
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

function inferStatusFromSignals(appName: string, title: string | null): ClaudeStatus {
  const combined = `${appName} ${title ?? ''}`.toLowerCase();
  if (!combined.includes('claude')) return 'idle';
  if (
    combined.includes('waiting') ||
    combined.includes('input') ||
    combined.includes('respond')
  ) {
    return 'waiting_for_user';
  }
  if (
    combined.includes('generating') ||
    combined.includes('thinking') ||
    combined.includes('working')
  ) {
    return 'working';
  }
  return 'idle';
}

export const macosAdapter: PlatformAdapter = {
  async detectClaude(): Promise<ClaudeStatus> {
    const running =
      (await isProcessRunning('Claude')) ||
      (await isProcessRunning('claude'));

    if (!running) return 'not_detected';

    const appName = await getFrontmostAppName();
    if (appName?.toLowerCase().includes('claude')) {
      const title = await getFrontWindowTitle();
      return inferStatusFromSignals(appName, title);
    }

    logger.debug('Claude process detected on macOS but not frontmost');
    return 'unknown';
  },

  async detectPermissionDialog(): Promise<PermissionDialogInfo> {
    const appName = await getFrontmostAppName();
    const title = await getFrontWindowTitle();
    const combined = `${appName ?? ''} ${title ?? ''}`.trim();
    if (!combined || combined.toLowerCase().includes('pixelpaw')) {
      return { detected: false };
    }
    if (matchesPermissionDialog(combined)) {
      return {
        detected: true,
        appName: appName ?? 'System',
        message: title ?? 'Permission dialog detected',
      };
    }
    return { detected: false };
  },
};
