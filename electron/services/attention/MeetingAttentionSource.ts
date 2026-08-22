import { detectMeetingOnPlatform } from '../../platform/meeting-index';
import type { AttentionSignal } from '../../../src/types/attention';
import { BaseAttentionSource } from './BaseAttentionSource';
import { createIdleSignal } from './utils';

export class MeetingAttentionSource extends BaseAttentionSource {
  readonly id = 'meeting' as const;

  constructor() {
    super('meeting');
  }

  protected pollIntervalMs(): number {
    return 5000;
  }

  protected async detect(): Promise<AttentionSignal> {
    const meeting = await detectMeetingOnPlatform();
    if (!meeting.detected) {
      return createIdleSignal('meeting');
    }

    return {
      sourceId: 'meeting',
      status: 'working',
      priority: 'low',
      title: meeting.appName ?? 'Meeting',
      message: meeting.message ?? 'In a meeting',
      timestamp: Date.now(),
    };
  }
}

export const meetingAttentionSource = new MeetingAttentionSource();
