import { describe, expect, it } from 'vitest';
import { inferClaudeStatusFromText, mergeClaudeStatuses } from '../electron/platform/claudeSignals';

describe('claudeSignals', () => {
  it('detects waiting from Claude app UI text', () => {
    expect(
      inferClaudeStatusFromText('Reply to Claude waiting for your input'),
    ).toBe('waiting_for_user');
  });

  it('detects tool approval buttons', () => {
    expect(
      inferClaudeStatusFromText('Allow Claude to run this command Allow Once Deny'),
    ).toBe('waiting_for_user');
  });

  it('detects working state', () => {
    expect(inferClaudeStatusFromText('Claude is thinking about your request')).toBe('working');
  });

  it('requires claude name for Cursor scans when configured', () => {
    expect(
      inferClaudeStatusFromText('waiting for your input', { requireClaudeName: true }),
    ).toBe('idle');
    expect(
      inferClaudeStatusFromText('Claude is waiting for your input', { requireClaudeName: true }),
    ).toBe('waiting_for_user');
  });

  it('merges statuses with waiting as highest priority', () => {
    expect(mergeClaudeStatuses(['idle', 'working', 'waiting_for_user'])).toBe('waiting_for_user');
    expect(mergeClaudeStatuses(['idle', 'working'])).toBe('working');
  });
});
