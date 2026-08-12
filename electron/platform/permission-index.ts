import type { PermissionDialogInfo } from './permission';
import { macosAdapter } from './macos';
import { windowsAdapter } from './windows';
import { linuxAdapter } from './linux';

export async function detectPermissionDialogOnPlatform(): Promise<PermissionDialogInfo> {
  switch (process.platform) {
    case 'darwin':
      return macosAdapter.detectPermissionDialog();
    case 'win32':
      return windowsAdapter.detectPermissionDialog();
    case 'linux':
    default:
      return linuxAdapter.detectPermissionDialog();
  }
}
