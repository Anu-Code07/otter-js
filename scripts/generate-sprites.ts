#!/usr/bin/env tsx
/**
 * Generates placeholder pixel-art otter sprites.
 * Replace assets in assets/pets/otter/ with final artwork (64x64 PNG, transparent).
 */
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const SIZE = 64;
const ASSET_ROOT = path.resolve('public/assets/pets/otter');

const PALETTE = {
  transparent: [0, 0, 0, 0] as [number, number, number, number],
  furDark: [74, 48, 32, 255] as [number, number, number, number],
  furMid: [107, 72, 48, 255] as [number, number, number, number],
  belly: [212, 184, 150, 255] as [number, number, number, number],
  face: [232, 208, 176, 255] as [number, number, number, number],
  nose: [48, 32, 24, 255] as [number, number, number, number],
  eye: [24, 16, 8, 255] as [number, number, number, number],
  eyeWhite: [248, 248, 248, 255] as [number, number, number, number],
  blush: [220, 140, 120, 180] as [number, number, number, number],
  alert: [255, 80, 60, 255] as [number, number, number, number],
  sparkle: [255, 230, 100, 255] as [number, number, number, number],
};

type Color = [number, number, number, number];

function setPixel(data: Buffer, x: number, y: number, color: Color): void {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const idx = (SIZE * y + x) << 2;
  data[idx] = color[0];
  data[idx + 1] = color[1];
  data[idx + 2] = color[2];
  data[idx + 3] = color[3];
}

function fillRect(
  data: Buffer,
  x: number,
  y: number,
  w: number,
  h: number,
  color: Color,
): void {
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      setPixel(data, px, py, color);
    }
  }
}

interface DrawOptions {
  eyesOpen?: boolean;
  eyesWide?: boolean;
  mouthOpen?: boolean;
  tailWag?: number;
  pawUp?: 'left' | 'right' | 'both' | 'none';
  facing?: 'left' | 'right';
  offsetX?: number;
  offsetY?: number;
  blush?: boolean;
  alert?: boolean;
  sparkle?: boolean;
  sleep?: boolean;
}

function drawOtter(data: Buffer, opts: DrawOptions = {}): void {
  const {
    eyesOpen = true,
    eyesWide = false,
    mouthOpen = false,
    tailWag = 0,
    pawUp = 'none',
    facing = 'right',
    offsetX = 0,
    offsetY = 0,
    blush = false,
    alert = false,
    sparkle = false,
    sleep = false,
  } = opts;

  const flip = facing === 'left' ? -1 : 1;
  const ox = (x: number) => Math.round(32 + (x - 32) * flip + offsetX);
  const oy = (y: number) => Math.round(y + offsetY);

  // Tail
  fillRect(data, ox(44 + tailWag), oy(38), 8, 6, PALETTE.furDark);
  fillRect(data, ox(50 + tailWag), oy(36), 6, 4, PALETTE.furMid);

  // Body
  fillRect(data, ox(22), oy(30), 24, 18, PALETTE.furMid);
  fillRect(data, ox(24), oy(34), 18, 12, PALETTE.belly);

  // Head
  fillRect(data, ox(18), oy(14), 28, 22, PALETTE.furMid);
  fillRect(data, ox(20), oy(18), 22, 16, PALETTE.face);

  // Ears
  fillRect(data, ox(20), oy(12), 6, 6, PALETTE.furDark);
  fillRect(data, ox(38), oy(12), 6, 6, PALETTE.furDark);

  // Eyes
  const eyeY = oy(24);
  if (sleep) {
    fillRect(data, ox(26), eyeY, 6, 2, PALETTE.eye);
    fillRect(data, ox(36), eyeY, 6, 2, PALETTE.eye);
  } else if (eyesOpen) {
    const eyeH = eyesWide ? 6 : 4;
    fillRect(data, ox(26), eyeY - (eyesWide ? 1 : 0), 6, eyeH, PALETTE.eyeWhite);
    fillRect(data, ox(36), eyeY - (eyesWide ? 1 : 0), 6, eyeH, PALETTE.eyeWhite);
    fillRect(data, ox(28), eyeY + (eyesWide ? 0 : 1), 3, eyesWide ? 4 : 2, PALETTE.eye);
    fillRect(data, ox(38), eyeY + (eyesWide ? 0 : 1), 3, eyesWide ? 4 : 2, PALETTE.eye);
  } else {
    fillRect(data, ox(26), eyeY + 1, 6, 2, PALETTE.eye);
    fillRect(data, ox(36), eyeY + 1, 6, 2, PALETTE.eye);
  }

  // Nose
  fillRect(data, ox(30), oy(30), 4, 3, PALETTE.nose);

  if (mouthOpen) {
    fillRect(data, ox(29), oy(33), 6, 3, PALETTE.nose);
  }

  if (blush) {
    fillRect(data, ox(22), oy(28), 4, 2, PALETTE.blush);
    fillRect(data, ox(40), oy(28), 4, 2, PALETTE.blush);
  }

  // Paws
  const pawY = oy(44);
  if (pawUp === 'left' || pawUp === 'both') {
    fillRect(data, ox(18), oy(36), 6, 8, PALETTE.face);
  } else {
    fillRect(data, ox(20), pawY, 8, 6, PALETTE.face);
  }
  if (pawUp === 'right' || pawUp === 'both') {
    fillRect(data, ox(42), oy(36), 6, 8, PALETTE.face);
  } else {
    fillRect(data, ox(38), pawY, 8, 6, PALETTE.face);
  }

  if (alert) {
    fillRect(data, ox(46), oy(10), 4, 8, PALETTE.alert);
    fillRect(data, ox(47), oy(8), 2, 2, PALETTE.alert);
  }

  if (sparkle) {
    fillRect(data, ox(12), oy(16), 3, 3, PALETTE.sparkle);
    fillRect(data, ox(48), oy(20), 2, 2, PALETTE.sparkle);
  }
}

function createFrame(opts: DrawOptions): Buffer {
  const png = new PNG({ width: SIZE, height: SIZE });
  png.data.fill(0);
  drawOtter(png.data, opts);
  return PNG.sync.write(png);
}

const ANIMATIONS: Record<string, DrawOptions[]> = {
  idle: [
    {},
    { offsetY: -1 },
    {},
    { offsetY: 1 },
  ],
  blink: [{}, { eyesOpen: false }, {}],
  'look_around': [{}, { offsetX: -2 }, { offsetX: 2 }, {}],
  'walk-left': [
    { facing: 'left', offsetY: 1 },
    { facing: 'left', offsetY: 0 },
    { facing: 'left', offsetY: 1, offsetX: -2 },
    { facing: 'left', offsetY: 0, offsetX: -4 },
  ],
  'walk-right': [
    { facing: 'right', offsetY: 1 },
    { facing: 'right', offsetY: 0 },
    { facing: 'right', offsetY: 1, offsetX: 2 },
    { facing: 'right', offsetY: 0, offsetX: 4 },
  ],
  'run-left': [
    { facing: 'left', offsetY: 2, offsetX: -2 },
    { facing: 'left', offsetY: 0, offsetX: -6 },
    { facing: 'left', offsetY: 2, offsetX: -10 },
    { facing: 'left', offsetY: 0, offsetX: -14 },
  ],
  'run-right': [
    { facing: 'right', offsetY: 2, offsetX: 2 },
    { facing: 'right', offsetY: 0, offsetX: 6 },
    { facing: 'right', offsetY: 2, offsetX: 10 },
    { facing: 'right', offsetY: 0, offsetX: 14 },
  ],
  sit: [{ offsetY: 4 }, { offsetY: 4, pawUp: 'both' }],
  sleep: [{ sleep: true, offsetY: 6 }, { sleep: true, offsetY: 6, offsetX: 1 }],
  wake: [{ sleep: true }, { eyesOpen: true, offsetY: 2 }, {}],
  thinking: [{}, { offsetX: -1 }, { pawUp: 'right' }, { pawUp: 'right', offsetX: 1 }],
  curious: [{ eyesWide: true }, { eyesWide: true, offsetX: 2 }, { eyesWide: true, offsetX: -2 }],
  excited: [{ blush: true, pawUp: 'both' }, { blush: true, offsetY: -2 }, { blush: true, sparkle: true }],
  happy: [{ blush: true }, { blush: true, mouthOpen: true }],
  alert: [{ eyesWide: true }, { eyesWide: true, alert: true }, { eyesWide: true, alert: true, offsetY: -2 }],
  annoyed: [{ offsetX: -1 }, { eyesOpen: false }, { offsetX: 1 }],
  wave: [{ pawUp: 'right' }, { pawUp: 'right', offsetY: -2 }, { pawUp: 'right' }],
  celebrate: [{ sparkle: true, pawUp: 'both' }, { sparkle: true, offsetY: -3 }, { sparkle: true, blush: true }],
  stretch: [{ offsetY: 2 }, { offsetY: -2, pawUp: 'both' }, {}],
  yawn: [{ mouthOpen: true }, { mouthOpen: true, eyesOpen: false }, {}],
};

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function generateSprites(): void {
  for (const [folder, frames] of Object.entries(ANIMATIONS)) {
    const dir = path.join(ASSET_ROOT, folder.replace(/_/g, '-'));
    ensureDir(dir);
    frames.forEach((frameOpts, index) => {
      const buffer = createFrame(frameOpts);
      const filename = path.join(dir, `frame-${String(index).padStart(2, '0')}.png`);
      fs.writeFileSync(filename, buffer);
    });
    console.log(`Generated ${frames.length} frames in ${dir}`);
  }

  // Tray icon
  const trayDir = path.join('public', 'assets');
  ensureDir(trayDir);
  const trayPng = createFrame({ offsetY: 4 });
  fs.writeFileSync(path.join('public', 'assets', 'tray-icon.png'), trayPng);
  console.log('Generated tray icon');
}

generateSprites();
