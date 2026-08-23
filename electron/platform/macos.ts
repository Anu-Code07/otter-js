import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import type { ClaudeStatus } from '../../src/types/claude';
import type { PermissionDialogInfo } from './permission';
import { matchesPermissionDialog } from './permission';
import type { MeetingInfo } from './meeting';
import { matchesMeetingSignals } from './meeting';
import { inferClaudeStatusFromText, mergeClaudeStatuses } from './claudeSignals';
import { logger } from '../services/Logger';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

export interface PlatformAdapter {
  detectClaude(): Promise<ClaudeStatus>;
  detectPermissionDialog(): Promise<PermissionDialogInfo>;
  detectMeeting(): Promise<MeetingInfo>;
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

async function processExists(name: string): Promise<boolean> {
  try {
    const stdout = await runAppleScript([
      'tell application "System Events"',
      `return exists process "${name}"`,
      'end tell',
    ]);
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}

async function runAppleScript(lines: string[]): Promise<string> {
  const { stdout } = await execFileAsync('osascript', lines.flatMap((line) => ['-e', line]));
  return stdout.trim();
}

async function collectProcessUiText(processName: string): Promise<string> {
  try {
    return await runAppleScript([
      'tell application "System Events"',
      `if not (exists process "${processName}") then return ""`,
      `tell process "${processName}"`,
      'set output to ""',
      'repeat with w in windows',
      'try',
      'set output to output & " " & (title of w as text)',
      'end try',
      'try',
      'repeat with t in static texts of w',
      'try',
      'set output to output & " " & (value of t as text)',
      'end try',
      'end repeat',
      'end try',
      'try',
      'repeat with b in buttons of w',
      'try',
      'set output to output & " " & (title of b as text)',
      'end try',
      'end repeat',
      'end try',
      'end repeat',
      'return output',
      'end tell',
      'end tell',
    ]);
  } catch (error) {
    logger.debug(`Failed to read UI text for ${processName}: ${String(error)}`);
    return '';
  }
}

async function getFrontmostAppName(): Promise<string | null> {
  try {
    const stdout = await runAppleScript([
      'tell application "System Events"',
      'get name of first application process whose frontmost is true',
      'end tell',
    ]);
    return stdout || null;
  } catch {
    return null;
  }
}

async function getFrontWindowTitle(): Promise<string | null> {
  try {
    const stdout = await runAppleScript([
      'tell application "System Events"',
      'get title of front window of (first application process whose frontmost is true)',
      'end tell',
    ]);
    return stdout || null;
  } catch {
    return null;
  }
}

export const macosAdapter: PlatformAdapter = {
  async detectClaude(): Promise<ClaudeStatus> {
    const claudeRunning =
      (await isProcessRunning('Claude')) ||
      (await isProcessRunning('claude')) ||
      (await processExists('Claude'));
    const cursorRunning = await processExists('Cursor');

    if (!claudeRunning && !cursorRunning) return 'not_detected';

    const statuses: ClaudeStatus[] = [];

    if (claudeRunning) {
      const claudeUi = await collectProcessUiText('Claude');
      const claudeStatus = inferClaudeStatusFromText(claudeUi);
      statuses.push(claudeStatus);
      if (claudeStatus === 'waiting_for_user') {
        logger.debug(`Claude waiting detected from Claude app UI`);
      }
    }

    if (cursorRunning) {
      const cursorUi = await collectProcessUiText('Cursor');
      const cursorNamed = inferClaudeStatusFromText(cursorUi, { requireClaudeName: true });
      const cursorAny = inferClaudeStatusFromText(cursorUi);
      statuses.push(cursorNamed);
      if (cursorAny === 'waiting_for_user') {
        statuses.push('waiting_for_user');
      }
      if (cursorNamed === 'waiting_for_user' || cursorAny === 'waiting_for_user') {
        logger.debug('Claude waiting detected from Cursor UI');
      }
    }

    const frontApp = await getFrontmostAppName();
    const frontTitle = await getFrontWindowTitle();
    if (frontApp) {
      const frontLower = frontApp.toLowerCase();
      if (frontLower.includes('claude')) {
        statuses.push(inferClaudeStatusFromText(`${frontApp} ${frontTitle ?? ''}`));
      } else if (frontApp === 'Cursor') {
        statuses.push(
          inferClaudeStatusFromText(`${frontApp} ${frontTitle ?? ''}`, { requireClaudeName: true }),
        );
      }
    }

    const merged = mergeClaudeStatuses(statuses.length > 0 ? statuses : ['idle']);
    if (merged !== 'idle' && merged !== 'not_detected') {
      logger.debug(`Claude status: ${merged}`);
    }
    return merged;
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

  async detectMeeting(): Promise<MeetingInfo> {
    const appName = await getFrontmostAppName();
    const title = await getFrontWindowTitle();
    return matchesMeetingSignals(appName, title);
  },
};
