import type { AttentionSignal } from '../../../src/types/attention';
import { BaseAttentionSource } from './BaseAttentionSource';
import { createIdleSignal } from './utils';
import { getUpcomingCalendarEvent } from '../../platform/calendar';
import { settingsService } from '../SettingsService';

export class CalendarAttentionSource extends BaseAttentionSource {
  readonly id = 'calendar' as const;

  constructor() {
    super('calendar');
  }

  protected pollIntervalMs(): number {
    return 60_000;
  }

  protected async detect(): Promise<AttentionSignal> {
    if (process.platform !== 'darwin') {
      return createIdleSignal('calendar');
    }

    const settings = settingsService.get();
    const lead = settings.calendarReminderLeadMinutes;
    const upcoming = await getUpcomingCalendarEvent(lead);
    if (!upcoming) {
      return createIdleSignal('calendar');
    }

    return {
      sourceId: 'calendar',
      status: 'needs_user',
      priority: 'medium',
      title: 'Calendar',
      message: `${upcoming.title} in ${upcoming.minutesUntil} min`,
      timestamp: Date.now(),
    };
  }
}

export const calendarAttentionSource = new CalendarAttentionSource();
