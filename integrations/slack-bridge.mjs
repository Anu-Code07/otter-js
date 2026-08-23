#!/usr/bin/env node
/**
 * Slack → PixelPaw bridge (run locally on your Mac).
 *
 * Option A: Slack Workflow posts to this server's /slack endpoint
 * Option B: Use with a tunnel if Slack must reach you from the cloud
 *
 * Usage:
 *   PIXELPAW_PORT=47832 SLACK_BRIDGE_PORT=47833 node integrations/slack-bridge.mjs
 */

import http from 'http';

const pixelPawPort = Number(process.env.PIXELPAW_PORT ?? 47832);
const bridgePort = Number(process.env.SLACK_BRIDGE_PORT ?? 47833);

async function forwardToPixelPaw(payload) {
  const body = JSON.stringify({
    status: 'needs_user',
    title: 'Slack',
    message: payload.text ?? payload.message ?? 'Slack needs you',
    priority: 'high',
  });

  const res = await fetch(`http://127.0.0.1:${pixelPawPort}/attention`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  return res.ok;
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && (req.url === '/slack' || req.url === '/')) {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(data || '{}');
        void forwardToPixelPaw(payload).then((ok) => {
          res.writeHead(ok ? 200 : 502);
          res.end(JSON.stringify({ ok }));
        });
      } catch {
        res.writeHead(400);
        res.end('Invalid JSON');
      }
    });
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

server.listen(bridgePort, '127.0.0.1', () => {
  console.log(`Slack bridge listening on http://127.0.0.1:${bridgePort}/slack`);
  console.log(`Forwarding to PixelPaw http://127.0.0.1:${pixelPawPort}/attention`);
});
