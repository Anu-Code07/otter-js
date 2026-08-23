import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface UpcomingCalendarEvent {
  title: string;
  minutesUntil: number;
}

async function runAppleScript(lines: string[]): Promise<string> {
  const { stdout } = await execFileAsync('osascript', lines.flatMap((line) => ['-e', line]));
  return stdout.trim();
}

/** Read Calendar.app events starting within leadMinutes (macOS only). */
export async function getUpcomingCalendarEvent(leadMinutes: number): Promise<UpcomingCalendarEvent | null> {
  if (process.platform !== 'darwin') return null;

  try {
    const output = await runAppleScript([
      'tell application "Calendar"',
      'set now to current date',
      'set lead to now + (' + String(leadMinutes) + ' * minutes)',
      'set foundTitle to ""',
      'set foundMinutes to -1',
      'repeat with cal in calendars',
      'repeat with e in (events of cal whose start date ≥ now and start date ≤ lead)',
      'set mins to round ((start date of e - now) / minutes)',
      'if foundMinutes is -1 or mins < foundMinutes then',
      'set foundMinutes to mins',
      'set foundTitle to title of e as text',
      'end if',
      'end repeat',
      'end repeat',
      'if foundTitle is "" then return ""',
      'return foundTitle & "|" & (foundMinutes as text)',
      'end tell',
    ]);

    if (!output || output === '') return null;
    const [title, minutesRaw] = output.split('|');
    const minutesUntil = Number(minutesRaw);
    if (!title || Number.isNaN(minutesUntil)) return null;
    return { title, minutesUntil };
  } catch {
    return null;
  }
}
