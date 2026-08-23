import { describe, it, expect } from 'vitest';
import {
  mergeAttentionSnapshot,
  shouldTriggerAttentionAlert,
  shouldResetAttentionAlert,
  isInDoNotDisturb,
  isSourceAlertsEnabled,
  attentionAlertKey,
  createIdleSignal,
} from '../src/services/attentionLogic';

describe('attentionLogic', () => {
  it('picks highest priority active signal', () => {
    const snapshot = mergeAttentionSnapshot({
      claude: createIdleSignal('claude'),
      permission: { ...createIdleSignal('permission'), status: 'needs_user', priority: 'critical' },
      build: createIdleSignal('build'),
      terminal: createIdleSignal('terminal'),
      git: createIdleSignal('git'),
      meeting: createIdleSignal('meeting'),
      integration: createIdleSignal('integration'),
      github: createIdleSignal('github'),
      calendar: createIdleSignal('calendar'),
    });
    expect(snapshot.active?.sourceId).toBe('permission');
    expect(snapshot.topPriority).toBe('critical');
  });

  it('triggers alert on transition to needs_user', () => {
    const prev = createIdleSignal('claude');
    const curr = { ...createIdleSignal('claude'), status: 'needs_user' as const, priority: 'high' as const };
    expect(shouldTriggerAttentionAlert(prev, curr, null)).toBe(true);
    expect(shouldTriggerAttentionAlert(curr, curr, attentionAlertKey(curr))).toBe(false);
  });

  it('resets alert when leaving needs_user', () => {
    const prev = { ...createIdleSignal('permission'), status: 'needs_user' as const };
    const curr = createIdleSignal('permission');
    expect(shouldResetAttentionAlert(prev, curr)).toBe(true);
  });

  it('detects do not disturb window', () => {
    const morning = new Date('2026-01-01T23:30:00');
    expect(isInDoNotDisturb(true, '22:00', '08:00', morning)).toBe(true);
    const afternoon = new Date('2026-01-01T14:00:00');
    expect(isInDoNotDisturb(true, '22:00', '08:00', afternoon)).toBe(false);
  });

  it('respects per-source alert toggles', () => {
    const settings = {
      attentionAlertsEnabled: true,
      claudeAlerts: true,
      permissionAlerts: false,
      buildAlerts: true,
      terminalAlerts: true,
      gitAlerts: true,
      integrationAlerts: true,
      githubAlerts: true,
      calendarAlerts: true,
    };
    expect(isSourceAlertsEnabled('claude', settings)).toBe(true);
    expect(isSourceAlertsEnabled('permission', settings)).toBe(false);
    expect(isSourceAlertsEnabled('claude', { ...settings, attentionAlertsEnabled: false })).toBe(false);
  });

  it('working to waiting = one alert', () => {
    const working = { ...createIdleSignal('claude'), status: 'working' as const };
    const waiting = { ...createIdleSignal('claude'), status: 'needs_user' as const };
    let key: string | null = null;
    let count = 0;
    for (const [prev, curr] of [[working, waiting], [waiting, waiting], [waiting, waiting]] as const) {
      if (shouldTriggerAttentionAlert(prev, curr, key)) {
        count++;
        key = attentionAlertKey(curr);
      }
    }
    expect(count).toBe(1);
  });
});
