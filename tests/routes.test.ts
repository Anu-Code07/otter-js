import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isSettingsRoute } from '../src/utils/routes';

describe('isSettingsRoute', () => {
  const originalHash = window.location.hash;

  afterEach(() => {
    window.location.hash = originalHash;
  });

  it('matches dev-style hash', () => {
    window.location.hash = '#/settings';
    expect(isSettingsRoute()).toBe(true);
  });

  it('matches electron loadFile hash', () => {
    window.location.hash = '#settings';
    expect(isSettingsRoute()).toBe(true);
  });

  it('matches slash hash from loadFile', () => {
    window.location.hash = '#/settings';
    expect(isSettingsRoute()).toBe(true);
  });

  it('returns false for pet route', () => {
    window.location.hash = '';
    expect(isSettingsRoute()).toBe(false);
  });
});
