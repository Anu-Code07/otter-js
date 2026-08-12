import { detectPermissionDialogOnPlatform } from '../../platform/permission-index';
import type { AttentionSignal } from '../../../src/types/attention';
import { BaseAttentionSource } from './BaseAttentionSource';
import { createIdleSignal } from './utils';

export class PermissionAttentionSource extends BaseAttentionSource {
  readonly id = 'permission' as const;

  constructor() {
    super('permission');
  }

  protected pollIntervalMs(): number {
    return 1500;
  }

  protected async detect(): Promise<AttentionSignal> {
    const dialog = await detectPermissionDialogOnPlatform();
    if (!dialog.detected) {
      return createIdleSignal('permission');
    }
    return {
      sourceId: 'permission',
      status: 'needs_user',
      priority: 'critical',
      title: dialog.appName ?? 'System',
      message: dialog.message ?? 'Permission dialog detected',
      timestamp: Date.now(),
    };
  }
}

export const permissionAttentionSource = new PermissionAttentionSource();
