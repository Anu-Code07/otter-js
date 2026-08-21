import { describe, it, expect } from 'vitest';
import {
  claudeStatusToPetState,
  attentionSignalToPetState,
  cursorReactionLevel,
  distanceBetween,
  shouldResetClaudeAlert,
  shouldTriggerClaudeAlert,
  pickWeighted,
  isBusyPetState,
} from '../src/services/petLogic';
import { createIdleSignal } from '../src/services/attentionLogic';

describe('petLogic', () => {
  describe('distanceBetween', () => {
    it('calculates euclidean distance', () => {
      expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });
  });

  describe('cursorReactionLevel', () => {
    it('returns far beyond 500px', () => {
      expect(cursorReactionLevel(600)).toBe('far');
    });
    it('returns look between 200-500px', () => {
      expect(cursorReactionLevel(300)).toBe('look');
    });
    it('returns approach between 100-200px', () => {
      expect(cursorReactionLevel(150)).toBe('approach');
    });
    it('returns interact under 100px', () => {
      expect(cursorReactionLevel(50)).toBe('interact');
    });
  });

  describe('claudeStatusToPetState', () => {
    it('maps working to claude_working', () => {
      expect(claudeStatusToPetState('working')).toBe('claude_working');
    });
    it('maps waiting to claude_waiting', () => {
      expect(claudeStatusToPetState('waiting_for_user')).toBe('claude_waiting');
    });
  });

  describe('shouldTriggerClaudeAlert', () => {
    it('triggers on transition to waiting_for_user', () => {
      expect(shouldTriggerClaudeAlert('working', 'waiting_for_user', false)).toBe(true);
    });
    it('does not trigger when already waiting', () => {
      expect(shouldTriggerClaudeAlert('waiting_for_user', 'waiting_for_user', false)).toBe(false);
    });
    it('does not trigger when already alerted', () => {
      expect(shouldTriggerClaudeAlert('working', 'waiting_for_user', true)).toBe(false);
    });
    it('working to waiting = one alert scenario', () => {
      const first = shouldTriggerClaudeAlert('working', 'waiting_for_user', false);
      const repeat = shouldTriggerClaudeAlert('waiting_for_user', 'waiting_for_user', true);
      expect(first).toBe(true);
      expect(repeat).toBe(false);
    });
  });

  describe('shouldResetClaudeAlert', () => {
    it('resets when leaving waiting state', () => {
      expect(shouldResetClaudeAlert('waiting_for_user', 'working')).toBe(true);
    });
    it('does not reset while still waiting', () => {
      expect(shouldResetClaudeAlert('waiting_for_user', 'waiting_for_user')).toBe(false);
    });
  });

  describe('pickWeighted', () => {
    it('returns an item from the list', () => {
      const items = [{ action: 'a', weight: 1 }, { action: 'b', weight: 99 }];
      const picked = pickWeighted(items);
      expect(items).toContainEqual(picked);
    });
  });

  describe('attentionSignalToPetState', () => {
    it('maps meeting working to in_meeting', () => {
      const signal = { ...createIdleSignal('meeting'), status: 'working' as const };
      expect(attentionSignalToPetState(signal)).toBe('in_meeting');
    });
  });

  describe('isBusyPetState', () => {
    it('treats in_meeting as busy', () => {
      expect(isBusyPetState('in_meeting')).toBe(true);
    });
  });
});

describe('AnimationEngine', () => {
  it('advances frames over time', async () => {
    const { AnimationEngine } = await import('../src/animations/AnimationEngine');
    const engine = new AnimationEngine({
      idle: { name: 'idle', frames: ['/a.png', '/b.png'], fps: 10, loop: true },
      blink: { name: 'blink', frames: ['/c.png'], fps: 8, loop: false },
      look_around: { name: 'look_around', frames: ['/d.png'], fps: 6, loop: true },
      walk_left: { name: 'walk_left', frames: ['/e.png'], fps: 8, loop: true },
      walk_right: { name: 'walk_right', frames: ['/f.png'], fps: 8, loop: true },
      run_left: { name: 'run_left', frames: ['/g.png'], fps: 12, loop: true },
      run_right: { name: 'run_right', frames: ['/h.png'], fps: 12, loop: true },
      sit: { name: 'sit', frames: ['/i.png'], fps: 6, loop: true },
      sleep: { name: 'sleep', frames: ['/j.png'], fps: 2, loop: true },
      wake_up: { name: 'wake_up', frames: ['/k.png'], fps: 6, loop: false },
      thinking: { name: 'thinking', frames: ['/l.png'], fps: 6, loop: true },
      curious: { name: 'curious', frames: ['/m.png'], fps: 6, loop: true },
      excited: { name: 'excited', frames: ['/n.png'], fps: 6, loop: true },
      happy: { name: 'happy', frames: ['/o.png'], fps: 6, loop: false },
      alert: { name: 'alert', frames: ['/p.png'], fps: 6, loop: true },
      annoyed: { name: 'annoyed', frames: ['/q.png'], fps: 6, loop: true },
      wave: { name: 'wave', frames: ['/r.png'], fps: 6, loop: false },
      celebrate: { name: 'celebrate', frames: ['/s.png'], fps: 10, loop: true },
      stretch: { name: 'stretch', frames: ['/t.png'], fps: 6, loop: false },
      yawn: { name: 'yawn', frames: ['/u.png'], fps: 6, loop: false },
    });

    let lastSrc = '';
    engine.setOnFrameChange((src) => { lastSrc = src; });
    engine.play('idle');
    expect(lastSrc).toBe('/a.png');
    engine.update(100);
    expect(lastSrc).toBe('/b.png');
  });
});

describe('notification cooldown logic', () => {
  it('deduplicates repeated waiting states', () => {
    let hasAlerted = false;
    const transitions: Array<[string, string]> = [
      ['working', 'waiting_for_user'],
      ['waiting_for_user', 'waiting_for_user'],
      ['waiting_for_user', 'waiting_for_user'],
    ];

    let alertCount = 0;
    for (const [prev, curr] of transitions) {
      if (shouldTriggerClaudeAlert(prev as 'working', curr as 'waiting_for_user', hasAlerted)) {
        alertCount++;
        hasAlerted = true;
      }
    }
    expect(alertCount).toBe(1);
  });
});
