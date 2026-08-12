import type { ClaudeStatus } from '../../src/types/claude';
import { linuxAdapter } from './linux';
import { macosAdapter } from './macos';
import { windowsAdapter } from './windows';

export async function detectClaudeOnPlatform(): Promise<ClaudeStatus> {
  switch (process.platform) {
    case 'darwin':
      return macosAdapter.detectClaude();
    case 'win32':
      return windowsAdapter.detectClaude();
    case 'linux':
    default:
      return linuxAdapter.detectClaude();
  }
}
