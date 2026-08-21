import type { MeetingInfo } from './meeting';
import { macosAdapter } from './macos';
import { windowsAdapter } from './windows';
import { linuxAdapter } from './linux';

export async function detectMeetingOnPlatform(): Promise<MeetingInfo> {
  switch (process.platform) {
    case 'darwin':
      return macosAdapter.detectMeeting();
    case 'win32':
      return windowsAdapter.detectMeeting();
    case 'linux':
    default:
      return linuxAdapter.detectMeeting();
  }
}
