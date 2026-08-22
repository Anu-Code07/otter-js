#!/usr/bin/env tsx
/**
 * Generates pixel-art otter sprites for every animation pose.
 * Output: public/assets/pets/otter/<pose>/frame-XX.png (128×128, transparent PNG)
 */
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const LOGICAL_SIZE = 64;
const SIZE = 128;
const SCALE = SIZE / LOGICAL_SIZE;
const ASSET_ROOT = path.resolve('public/assets/pets/otter');

const PALETTE = {
  transparent: [0, 0, 0, 0] as [number, number, number, number],
  furDark: [62, 42, 30, 255] as [number, number, number, number],
  furMid: [98, 68, 46, 255] as [number, number, number, number],
  furLight: [128, 92, 64, 255] as [number, number, number, number],
  belly: [218, 192, 158, 255] as [number, number, number, number],
  face: [238, 214, 182, 255] as [number, number, number, number],
  nose: [40, 28, 22, 255] as [number, number, number, number],
  eye: [20, 14, 10, 255] as [number, number, number, number],
  eyeWhite: [252, 252, 252, 255] as [number, number, number, number],
  blush: [228, 128, 108, 200] as [number, number, number, number],
  alert: [255, 72, 52, 255] as [number, number, number, number],
  sparkle: [255, 228, 96, 255] as [number, number, number, number],
  zzz: [148, 168, 210, 255] as [number, number, number, number],
};

type Color = [number, number, number, number];

function setPixel(data: Buffer, x: number, y: number, color: Color): void {
  const px = Math.round(x * SCALE);
  const py = Math.round(y * SCALE);
  for (let dy = 0; dy < SCALE; dy++) {
    for (let dx = 0; dx < SCALE; dx++) {
      const sx = px + dx;
      const sy = py + dy;
      if (sx < 0 || sy < 0 || sx >= SIZE || sy >= SIZE) continue;
      const idx = (SIZE * sy + sx) << 2;
      data[idx] = color[0];
      data[idx + 1] = color[1];
      data[idx + 2] = color[2];
      data[idx + 3] = color[3];
    }
  }
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
  showZzz?: boolean;
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
    showZzz = false,
  } = opts;

  const flip = facing === 'left' ? -1 : 1;
  const ox = (x: number) => Math.round(32 + (x - 32) * flip + offsetX);
  const oy = (y: number) => Math.round(y + offsetY);

  // Tail
  fillRect(data, ox(44 + tailWag), oy(38), 8, 6, PALETTE.furDark);
  fillRect(data, ox(50 + tailWag), oy(36), 6, 4, PALETTE.furMid);
  fillRect(data, ox(52 + tailWag), oy(34), 4, 3, PALETTE.furLight);

  // Body
  fillRect(data, ox(22), oy(30), 24, 18, PALETTE.furMid);
  fillRect(data, ox(23), oy(31), 22, 16, PALETTE.furLight);
  fillRect(data, ox(24), oy(34), 18, 12, PALETTE.belly);

  // Head
  fillRect(data, ox(18), oy(14), 28, 22, PALETTE.furMid);
  fillRect(data, ox(19), oy(15), 26, 20, PALETTE.furLight);
  fillRect(data, ox(20), oy(18), 22, 16, PALETTE.face);

  // Ears
  fillRect(data, ox(20), oy(12), 6, 6, PALETTE.furDark);
  fillRect(data, ox(38), oy(12), 6, 6, PALETTE.furDark);
  fillRect(data, ox(21), oy(13), 4, 4, PALETTE.furMid);
  fillRect(data, ox(39), oy(13), 4, 4, PALETTE.furMid);

  // Whiskers
  fillRect(data, ox(14), oy(28), 5, 1, PALETTE.furDark);
  fillRect(data, ox(13), oy(30), 6, 1, PALETTE.furDark);
  fillRect(data, ox(43), oy(28), 5, 1, PALETTE.furDark);
  fillRect(data, ox(43), oy(30), 6, 1, PALETTE.furDark);

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
    if (!eyesWide) {
      setPixel(data, ox(29), eyeY + 1, PALETTE.eyeWhite);
      setPixel(data, ox(39), eyeY + 1, PALETTE.eyeWhite);
    }
  } else {
    fillRect(data, ox(26), eyeY + 1, 6, 2, PALETTE.eye);
    fillRect(data, ox(36), eyeY + 1, 6, 2, PALETTE.eye);
  }

  // Nose & mouth
  fillRect(data, ox(30), oy(30), 4, 3, PALETTE.nose);
  if (mouthOpen) {
    fillRect(data, ox(28), oy(33), 8, 4, PALETTE.nose);
    fillRect(data, ox(29), oy(34), 6, 2, PALETTE.face);
  }

  if (blush) {
    fillRect(data, ox(22), oy(28), 4, 2, PALETTE.blush);
    fillRect(data, ox(40), oy(28), 4, 2, PALETTE.blush);
  }

  // Paws
  const pawY = oy(44);
  if (pawUp === 'left' || pawUp === 'both') {
    fillRect(data, ox(16), oy(34), 7, 10, PALETTE.face);
    fillRect(data, ox(17), oy(35), 5, 8, PALETTE.belly);
  } else {
    fillRect(data, ox(20), pawY, 8, 6, PALETTE.face);
    fillRect(data, ox(21), pawY + 1, 6, 4, PALETTE.belly);
  }
  if (pawUp === 'right' || pawUp === 'both') {
    fillRect(data, ox(41), oy(34), 7, 10, PALETTE.face);
    fillRect(data, ox(42), oy(35), 5, 8, PALETTE.belly);
  } else {
    fillRect(data, ox(38), pawY, 8, 6, PALETTE.face);
    fillRect(data, ox(39), pawY + 1, 6, 4, PALETTE.belly);
  }

  if (alert) {
    fillRect(data, ox(46), oy(10), 4, 8, PALETTE.alert);
    fillRect(data, ox(47), oy(8), 2, 2, PALETTE.alert);
    fillRect(data, ox(45), oy(6), 4, 2, PALETTE.alert);
  }

  if (sparkle) {
    fillRect(data, ox(10), oy(14), 3, 3, PALETTE.sparkle);
    fillRect(data, ox(50), oy(18), 3, 3, PALETTE.sparkle);
    fillRect(data, ox(8), oy(22), 2, 2, PALETTE.sparkle);
  }

  if (showZzz) {
    fillRect(data, ox(48), oy(8), 3, 2, PALETTE.zzz);
    fillRect(data, ox(52), oy(5), 4, 2, PALETTE.zzz);
    fillRect(data, ox(56), oy(2), 5, 2, PALETTE.zzz);
  }
}

function createFrame(opts: DrawOptions): Buffer {
  const png = new PNG({ width: SIZE, height: SIZE });
  png.data.fill(0);
  drawOtter(png.data, opts);
  return PNG.sync.write(png);
}

/** Frame counts must match src/animations/frames.ts */
const ANIMATIONS: Record<string, DrawOptions[]> = {
  idle: [{}, { offsetY: -1 }],
  blink: [{}, { eyesOpen: false }, {}],
  'look-around': [{}, { offsetX: -3 }, { offsetX: 3 }, {}],
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
  sleep: [{ sleep: true, offsetY: 6, showZzz: true }],
  wake: [{ sleep: true }, { eyesOpen: true, offsetY: 2 }, {}],
  thinking: [{}, { offsetX: -1 }, { pawUp: 'right' }, { pawUp: 'right', offsetX: 1 }],
  curious: [{ eyesWide: true }, { eyesWide: true, offsetX: 2 }, { eyesWide: true, offsetX: -2 }],
  excited: [{ blush: true, pawUp: 'both' }, { blush: true, offsetY: -2 }, { blush: true, sparkle: true }],
  happy: [{ blush: true }, { blush: true, mouthOpen: true }],
  alert: [{ eyesWide: true, alert: true, offsetY: -1 }],
  annoyed: [{ offsetX: -1 }, { eyesOpen: false }, { offsetX: 1 }],
  wave: [{ pawUp: 'right', offsetY: -2 }],
  celebrate: [{ sparkle: true, pawUp: 'both' }, { sparkle: true, offsetY: -3 }, { sparkle: true, blush: true }],
  stretch: [{ offsetY: 2 }, { offsetY: -2, pawUp: 'both' }, {}],
  yawn: [{ mouthOpen: true }, { mouthOpen: true, eyesOpen: false }, {}],
};

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanStaleFrames(dir: string, keepCount: number): void {
  const files = fs.readdirSync(dir).filter((f) => f.startsWith('frame-') && f.endsWith('.png'));
  for (const file of files) {
    const index = Number(file.replace('frame-', '').replace('.png', ''));
    if (index >= keepCount) {
      fs.unlinkSync(path.join(dir, file));
    }
  }
}

function generateSprites(): void {
  for (const [folder, frames] of Object.entries(ANIMATIONS)) {
    const dir = path.join(ASSET_ROOT, folder);
    ensureDir(dir);
    frames.forEach((frameOpts, index) => {
      const buffer = createFrame(frameOpts);
      const filename = path.join(dir, `frame-${String(index).padStart(2, '0')}.png`);
      fs.writeFileSync(filename, buffer);
    });
    cleanStaleFrames(dir, frames.length);
    console.log(`Generated ${frames.length} frames in ${dir}`);
  }

  const trayPng = createFrame({ offsetY: 4 });
  fs.writeFileSync(path.join('public', 'assets', 'tray-icon.png'), trayPng);
  console.log(`Generated tray icon (${SIZE}×${SIZE})`);
}

generateSprites();
