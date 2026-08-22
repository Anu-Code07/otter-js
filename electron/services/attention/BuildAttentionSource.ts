import fs from 'fs';
import path from 'path';
import os from 'os';
import type { AttentionSignal } from '../../../src/types/attention';
import { BaseAttentionSource } from './BaseAttentionSource';
import { createIdleSignal } from './utils';
import { settingsService } from '../SettingsService';

const BUILD_FAIL_PATTERNS = [
  /build failed/i,
  /compilation failed/i,
  /error TS\d+/i,
  /npm ERR!/i,
  /FAIL\s+/,
  /Tests failed/i,
  /CI failed/i,
];

const BUILD_SUCCESS_PATTERNS = [
  /build succeeded/i,
  /build complete/i,
  /compiled successfully/i,
  /all tests passed/i,
  /CI passed/i,
];

export class BuildAttentionSource extends BaseAttentionSource {
  readonly id = 'build' as const;
  private lastAlertHash = '';

  constructor() {
    super('build');
  }

  protected pollIntervalMs(): number {
    return 5000;
  }

  protected async detect(): Promise<AttentionSignal> {
    const watchPath = this.resolveWatchPath();
    if (!watchPath || !fs.existsSync(watchPath)) {
      return createIdleSignal('build');
    }

    const stat = fs.statSync(watchPath);
    if (stat.isDirectory()) {
      return this.detectFromDirectory(watchPath);
    }

    return this.detectFromFile(watchPath);
  }

  private resolveWatchPath(): string {
    const custom = settingsService.get().buildWatchPath.trim();
    if (custom) return custom.replace(/^~/, os.homedir());
    const defaults = [
      path.join(process.cwd(), 'build.log'),
      path.join(os.homedir(), '.pixelpaw', 'build.log'),
    ];
    return defaults.find((p) => fs.existsSync(p)) ?? defaults[1];
  }

  private detectFromFile(filePath: string): AttentionSignal {
    const content = fs.readFileSync(filePath, 'utf8');
    const tail = content.slice(-4000);
    const hash = `${tail.length}:${tail.slice(-120)}`;
    if (hash === this.lastAlertHash) {
      return createIdleSignal('build');
    }

    for (const pattern of BUILD_FAIL_PATTERNS) {
      if (pattern.test(tail)) {
        this.lastAlertHash = hash;
        return {
          sourceId: 'build',
          status: 'needs_user',
          priority: 'high',
          title: 'Build',
          message: 'Build failed — check output',
          timestamp: Date.now(),
        };
      }
    }

    for (const pattern of BUILD_SUCCESS_PATTERNS) {
      if (pattern.test(tail)) {
        this.lastAlertHash = hash;
        return {
          sourceId: 'build',
          status: 'success',
          priority: 'medium',
          title: 'Build',
          message: 'Build succeeded!',
          timestamp: Date.now(),
        };
      }
    }

    return createIdleSignal('build');
  }

  private detectFromDirectory(dirPath: string): AttentionSignal {
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.log'));
    if (files.length === 0) return createIdleSignal('build');
    const latest = files
      .map((f) => ({ f, m: fs.statSync(path.join(dirPath, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m)[0];
    return this.detectFromFile(path.join(dirPath, latest.f));
  }
}

export const buildAttentionSource = new BuildAttentionSource();
