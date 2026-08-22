import fs from 'fs';
import path from 'path';
import os from 'os';
import type { AttentionSignal } from '../../../src/types/attention';
import { BaseAttentionSource } from './BaseAttentionSource';
import { createIdleSignal } from './utils';
import { settingsService } from '../SettingsService';

const TERMINAL_PROMPT_PATTERNS = [
  /\(y\/n\)/i,
  /\[y\/n\]/i,
  /password:/i,
  /passphrase/i,
  /continue\?/i,
  /are you sure/i,
  /sudo:/i,
  /waiting for input/i,
];

const TERMINAL_ERROR_PATTERNS = [
  /command not found/i,
  /error:/i,
  /fatal:/i,
  /panic:/i,
  /segmentation fault/i,
];

export class TerminalAttentionSource extends BaseAttentionSource {
  readonly id = 'terminal' as const;
  private lastAlertHash = '';

  constructor() {
    super('terminal');
  }

  protected pollIntervalMs(): number {
    return 5000;
  }

  protected async detect(): Promise<AttentionSignal> {
    const watchPath = this.resolveWatchPath();
    if (!watchPath || !fs.existsSync(watchPath)) {
      return createIdleSignal('terminal');
    }
    const tail = fs.readFileSync(watchPath, 'utf8').slice(-3000);
    const hash = `${tail.length}:${tail.slice(-80)}`;
    if (hash === this.lastAlertHash) return createIdleSignal('terminal');

    for (const pattern of TERMINAL_PROMPT_PATTERNS) {
      if (pattern.test(tail)) {
        this.lastAlertHash = hash;
        return {
          sourceId: 'terminal',
          status: 'needs_user',
          priority: 'high',
          title: 'Terminal',
          message: 'Terminal needs your input',
          timestamp: Date.now(),
        };
      }
    }

    for (const pattern of TERMINAL_ERROR_PATTERNS) {
      if (pattern.test(tail)) {
        this.lastAlertHash = hash;
        return {
          sourceId: 'terminal',
          status: 'error',
          priority: 'medium',
          title: 'Terminal',
          message: 'Terminal error detected',
          timestamp: Date.now(),
        };
      }
    }

    return createIdleSignal('terminal');
  }

  private resolveWatchPath(): string {
    const custom = settingsService.get().terminalWatchPath.trim();
    if (custom) return custom.replace(/^~/, os.homedir());
    const defaults = [
      path.join(os.homedir(), '.pixelpaw', 'terminal.log'),
      path.join(process.cwd(), 'terminal.log'),
    ];
    return defaults.find((p) => fs.existsSync(p)) ?? defaults[0];
  }
}

export const terminalAttentionSource = new TerminalAttentionSource();
