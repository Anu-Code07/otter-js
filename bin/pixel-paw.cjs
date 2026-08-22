#!/usr/bin/env node
/**
 * PixelPaw CLI — launches the Electron desktop companion.
 */
const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');

const pkg = require('../package.json');
const args = process.argv.slice(2);

if (args.includes('--version') || args.includes('-v')) {
  console.log(pkg.version);
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`pixel-paw v${pkg.version}

Usage:
  pixel-paw                  Start PixelPaw
  pixel-paw --reset-position Center the pet on screen (fixes invisible pet)
  pixel-paw --version        Show version
`);
  process.exit(0);
}

const env = {
  ...process.env,
  NODE_ENV: 'production',
  ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
};

if (args.includes('--reset-position')) {
  env.PIXELPAW_RESET_POSITION = '1';
}

const main = path.join(__dirname, '..', 'dist-electron', 'main.js');

const child = spawn(electron, [main], {
  stdio: 'inherit',
  env,
});

child.on('error', (err) => {
  console.error('Failed to start PixelPaw:', err.message);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
