#!/usr/bin/env node
/**
 * PixelPaw CLI — launches the Electron desktop companion.
 */
const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');

const main = path.join(__dirname, '..', 'dist-electron', 'main.js');

const child = spawn(electron, [main], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
  },
});

child.on('error', (err) => {
  console.error('Failed to start PixelPaw:', err.message);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
