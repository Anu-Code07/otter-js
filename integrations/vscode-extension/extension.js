/* global vscode */

const http = require('http');

const PORT = 47832;

/**
 * @param {object} payload
 */
function sendAttention(payload) {
  const body = JSON.stringify(payload);
  const req = http.request(
    {
      hostname: '127.0.0.1',
      port: PORT,
      path: '/attention',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    },
    (res) => res.resume(),
  );
  req.on('error', () => {
    // PixelPaw not running — fail silently
  });
  req.write(body);
  req.end();
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('pixelpaw.needsAttention', () => {
      sendAttention({
        status: 'needs_user',
        priority: 'high',
        title: 'VS Code',
        message: 'VS Code needs your attention',
        source: 'vscode',
      });
    }),
    vscode.commands.registerCommand('pixelpaw.taskDone', () => {
      sendAttention({
        status: 'success',
        priority: 'medium',
        title: 'VS Code',
        message: 'Task complete!',
        source: 'vscode',
      });
    }),
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
