import { exec } from 'child_process';
import { promisify } from 'util';
import type { ClaudeStatus } from '../../src/types/claude';
import { inferClaudeStatusFromText } from './claudeSignals';
import type { PermissionDialogInfo } from './permission';
import { matchesPermissionDialog } from './permission';
import type { MeetingInfo } from './meeting';
import { matchesMeetingSignals } from './meeting';

const execAsync = promisify(exec);

export interface PlatformAdapter {
  detectClaude(): Promise<ClaudeStatus>;
  detectPermissionDialog(): Promise<PermissionDialogInfo>;
  detectMeeting(): Promise<MeetingInfo>;
}

async function isProcessRunning(name: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `tasklist /FI "IMAGENAME eq ${name}" 2>nul | find /I "${name}"`,
      { shell: 'cmd.exe' },
    );
    return stdout.includes(name);
  } catch {
    return false;
  }
}

async function getForegroundWindowTitle(): Promise<string | null> {
  try {
    const { stdout } = await execAsync(
      `powershell -NoProfile -Command "(Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | Sort-Object -Property @{Expression={$_.MainWindowHandle -ne 0}; Descending=$true} | Select-Object -First 1).MainWindowTitle"`,
      { shell: 'powershell.exe' },
    );
    const title = stdout.trim();
    return title || null;
  } catch {
    return null;
  }
}

function inferStatusFromTitle(title: string): ClaudeStatus {
  return inferClaudeStatusFromText(title, { requireClaudeName: true });
}

export const windowsAdapter: PlatformAdapter = {
  async detectClaude(): Promise<ClaudeStatus> {
    const running =
      (await isProcessRunning('Claude.exe')) ||
      (await isProcessRunning('claude.exe'));

    if (!running) return 'not_detected';

    const title = await getForegroundWindowTitle();
    if (title && title.toLowerCase().includes('claude')) {
      return inferStatusFromTitle(title);
    }

    return 'idle';
  },

  async detectPermissionDialog(): Promise<PermissionDialogInfo> {
    const title = await getForegroundWindowTitle();
    if (!title || title.toLowerCase().includes('pixelpaw')) {
      return { detected: false };
    }
    if (matchesPermissionDialog(title)) {
      return {
        detected: true,
        appName: title.split(' - ')[0] ?? 'System',
        message: title,
      };
    }
    return { detected: false };
  },

  async detectMeeting(): Promise<MeetingInfo> {
    const title = await getForegroundWindowTitle();
    const appName = title?.split(' - ')[0] ?? null;
    return matchesMeetingSignals(appName, title);
  },
};
