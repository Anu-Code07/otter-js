import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from '../src/types/system';

describe('settings', () => {
  it('has sensible defaults', () => {
    expect(DEFAULT_SETTINGS.petSize).toBeGreaterThanOrEqual(64);
    expect(DEFAULT_SETTINGS.claudeAlerts).toBe(true);
    expect(DEFAULT_SETTINGS.notificationCooldownMs).toBeGreaterThan(0);
    expect(DEFAULT_SETTINGS.hasCompletedOnboarding).toBe(false);
  });
});
