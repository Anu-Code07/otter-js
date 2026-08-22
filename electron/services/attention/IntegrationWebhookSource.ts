import http from 'http';
import type { AttentionSignal, AttentionStatus } from '../../../src/types/attention';
import { BaseAttentionSource } from './BaseAttentionSource';
import { createIdleSignal } from './utils';
import { settingsService } from '../SettingsService';
import { logger } from '../Logger';

interface WebhookPayload {
  status?: AttentionStatus;
  priority?: AttentionSignal['priority'];
  message?: string;
  title?: string;
  source?: string;
}

export class IntegrationWebhookSource extends BaseAttentionSource {
  readonly id = 'integration' as const;
  private server: http.Server | null = null;
  private pendingSignal: AttentionSignal | null = null;
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super('integration');
  }

  start(): void {
    super.start();
    this.startServer();
  }

  stop(): void {
    super.stop();
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }
    this.stopServer();
  }

  setEnabled(enabled: boolean): void {
    super.setEnabled(enabled);
    if (enabled) this.startServer();
    else this.stopServer();
  }

  protected async detect(): Promise<AttentionSignal> {
    if (this.pendingSignal) {
      const signal = this.pendingSignal;
      return signal;
    }
    return createIdleSignal('integration');
  }

  private startServer(): void {
    if (this.server) return;
    const port = settingsService.get().integrationWebhookPort;
    this.server = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/attention') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          try {
            const payload = JSON.parse(body) as WebhookPayload;
            this.handleWebhook(payload);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
          } catch {
            res.writeHead(400);
            res.end('Invalid JSON');
          }
        });
        return;
      }
      if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, service: 'pixelpaw' }));
        return;
      }
      res.writeHead(404);
      res.end('Not found');
    });

    this.server.listen(port, '127.0.0.1', () => {
      logger.info(`Integration webhook listening on http://127.0.0.1:${port}/attention`);
    });

    this.server.on('error', (err) => {
      logger.warn(`Webhook server error: ${String(err)}`);
    });
  }

  private stopServer(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  private handleWebhook(payload: WebhookPayload): void {
    const status = payload.status ?? 'needs_user';
    const signal: AttentionSignal = {
      sourceId: 'integration',
      status,
      priority: payload.priority ?? (status === 'needs_user' ? 'high' : 'medium'),
      title: payload.title ?? payload.source ?? 'Integration',
      message: payload.message ?? 'Integration alert',
      timestamp: Date.now(),
    };
    this.pendingSignal = signal;
    this.emit(signal);

    if (this.clearTimer) clearTimeout(this.clearTimer);
    if (status === 'success' || status === 'idle') {
      this.clearTimer = setTimeout(() => {
        this.pendingSignal = null;
        this.emit(createIdleSignal('integration'));
      }, 5000);
    }
  }

  restartServer(): void {
    this.stopServer();
    if (this.enabled) this.startServer();
  }
}

export const integrationWebhookSource = new IntegrationWebhookSource();
