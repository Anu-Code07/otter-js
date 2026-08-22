/**
 * Shared pixel sprite drawing utilities for all pets.
 */
import { PNG } from 'pngjs';

export const LOGICAL_SIZE = 64;
export const SPRITE_SIZE = 128;
export const SCALE = SPRITE_SIZE / LOGICAL_SIZE;

export type Color = [number, number, number, number];

export interface PetPalette {
  furDark: Color;
  furMid: Color;
  furLight: Color;
  belly: Color;
  face: Color;
  nose: Color;
  eye: Color;
  eyeWhite: Color;
  blush: Color;
  alert: Color;
  sparkle: Color;
  zzz: Color;
  accent: Color;
}

export interface DrawOptions {
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

export interface SpeciesShape {
  id: string;
  hasTail: boolean;
  hasWhiskers: boolean;
  earStyle: 'round' | 'point' | 'none' | 'horns';
  bodyWide: number;
  maskEyes?: boolean;
  beak?: boolean;
  customDraw?: 'dragon';
}

export function setPixel(data: Buffer, x: number, y: number, color: Color): void {
  const px = Math.round(x * SCALE);
  const py = Math.round(y * SCALE);
  for (let dy = 0; dy < SCALE; dy++) {
    for (let dx = 0; dx < SCALE; dx++) {
      const sx = px + dx;
      const sy = py + dy;
      if (sx < 0 || sy < 0 || sx >= SPRITE_SIZE || sy >= SPRITE_SIZE) continue;
      const idx = (SPRITE_SIZE * sy + sx) << 2;
      data[idx] = color[0];
      data[idx + 1] = color[1];
      data[idx + 2] = color[2];
      data[idx + 3] = color[3];
    }
  }
}

export function fillRect(
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

export function drawCreature(
  data: Buffer,
  palette: PetPalette,
  shape: SpeciesShape,
  opts: DrawOptions = {},
): void {
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
  const bodyW = shape.bodyWide;

  if (shape.hasTail) {
    fillRect(data, ox(44 + tailWag), oy(38), 8, 6, palette.furDark);
    fillRect(data, ox(50 + tailWag), oy(36), 6, 4, palette.furMid);
    if (shape.id === 'raccoon') {
      fillRect(data, ox(48 + tailWag), oy(37), 2, 2, palette.accent);
      fillRect(data, ox(52 + tailWag), oy(35), 2, 2, palette.eyeWhite);
    }
  }

  const bodyX = 32 - bodyW / 2;
  fillRect(data, ox(bodyX), oy(30), bodyW, 18, palette.furMid);
  fillRect(data, ox(bodyX + 1), oy(31), bodyW - 2, 16, palette.furLight);
  fillRect(data, ox(bodyX + 2), oy(34), bodyW - 4, 12, palette.belly);

  fillRect(data, ox(18), oy(14), 28, 22, palette.furMid);
  fillRect(data, ox(19), oy(15), 26, 20, palette.furLight);
  fillRect(data, ox(20), oy(18), 22, 16, palette.face);

  if (shape.earStyle === 'round') {
    fillRect(data, ox(20), oy(12), 6, 6, palette.furDark);
    fillRect(data, ox(38), oy(12), 6, 6, palette.furDark);
  } else if (shape.earStyle === 'point') {
    fillRect(data, ox(21), oy(10), 5, 7, palette.furDark);
    fillRect(data, ox(40), oy(10), 5, 7, palette.furDark);
    setPixel(data, ox(23), oy(10), palette.furMid);
    setPixel(data, ox(42), oy(10), palette.furMid);
  }

  if (shape.hasWhiskers) {
    fillRect(data, ox(14), oy(28), 5, 1, palette.furDark);
    fillRect(data, ox(43), oy(28), 5, 1, palette.furDark);
  }

  const eyeY = oy(24);
  if (sleep) {
    fillRect(data, ox(26), eyeY, 6, 2, palette.eye);
    fillRect(data, ox(36), eyeY, 6, 2, palette.eye);
  } else if (eyesOpen) {
    const eyeH = eyesWide ? 6 : 4;
    fillRect(data, ox(26), eyeY - (eyesWide ? 1 : 0), 6, eyeH, palette.eyeWhite);
    fillRect(data, ox(36), eyeY - (eyesWide ? 1 : 0), 6, eyeH, palette.eyeWhite);
    fillRect(data, ox(28), eyeY + (eyesWide ? 0 : 1), 3, eyesWide ? 4 : 2, palette.eye);
    fillRect(data, ox(38), eyeY + (eyesWide ? 0 : 1), 3, eyesWide ? 4 : 2, palette.eye);
    if (shape.maskEyes) {
      fillRect(data, ox(24), eyeY - 2, 8, 3, palette.accent);
      fillRect(data, ox(36), eyeY - 2, 8, 3, palette.accent);
    }
  } else {
    fillRect(data, ox(26), eyeY + 1, 6, 2, palette.eye);
    fillRect(data, ox(36), eyeY + 1, 6, 2, palette.eye);
  }

  if (shape.beak) {
    fillRect(data, ox(29), oy(30), 6, 4, palette.accent);
    fillRect(data, ox(30), oy(32), 4, 2, palette.nose);
  } else {
    fillRect(data, ox(30), oy(30), 4, 3, palette.nose);
    if (mouthOpen) {
      fillRect(data, ox(28), oy(33), 8, 4, palette.nose);
      fillRect(data, ox(29), oy(34), 6, 2, palette.face);
    }
  }

  if (blush) {
    fillRect(data, ox(22), oy(28), 4, 2, palette.blush);
    fillRect(data, ox(40), oy(28), 4, 2, palette.blush);
  }

  const pawY = oy(44);
  if (pawUp === 'left' || pawUp === 'both') {
    fillRect(data, ox(16), oy(34), 7, 10, palette.face);
  } else {
    fillRect(data, ox(20), pawY, 8, 6, palette.face);
  }
  if (pawUp === 'right' || pawUp === 'both') {
    fillRect(data, ox(41), oy(34), 7, 10, palette.face);
  } else {
    fillRect(data, ox(38), pawY, 8, 6, palette.face);
  }

  if (alert) {
    fillRect(data, ox(46), oy(10), 4, 8, palette.alert);
    fillRect(data, ox(47), oy(8), 2, 2, palette.alert);
  }

  if (sparkle) {
    fillRect(data, ox(10), oy(14), 3, 3, palette.sparkle);
    fillRect(data, ox(50), oy(18), 3, 3, palette.sparkle);
  }

  if (showZzz) {
    fillRect(data, ox(48), oy(8), 3, 2, palette.zzz);
    fillRect(data, ox(52), oy(5), 4, 2, palette.zzz);
    fillRect(data, ox(56), oy(2), 5, 2, palette.zzz);
  }
}

/** Emerald dragon — horns, wings, serpentine tail, scale belly. */
export function drawDragon(
  data: Buffer,
  palette: PetPalette,
  opts: DrawOptions = {},
): void {
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

  // Wings (behind body)
  fillRect(data, ox(10), oy(22), 10, 14, palette.furDark);
  fillRect(data, ox(8), oy(24), 6, 10, palette.furMid);
  fillRect(data, ox(46), oy(22), 10, 14, palette.furDark);
  fillRect(data, ox(50), oy(24), 6, 10, palette.furMid);

  // Serpentine tail
  fillRect(data, ox(46 + tailWag), oy(40), 8, 5, palette.furMid);
  fillRect(data, ox(52 + tailWag), oy(38), 6, 4, palette.furLight);
  fillRect(data, ox(56 + tailWag), oy(34), 5, 4, palette.furMid);
  fillRect(data, ox(58 + tailWag), oy(30), 4, 3, palette.accent);

  // Body & scales
  fillRect(data, ox(20), oy(28), 26, 20, palette.furMid);
  fillRect(data, ox(21), oy(29), 24, 18, palette.furLight);
  fillRect(data, ox(23), oy(32), 20, 14, palette.belly);
  // Scale dots
  setPixel(data, ox(26), oy(34), palette.furDark);
  setPixel(data, ox(30), oy(36), palette.furDark);
  setPixel(data, ox(34), oy(34), palette.furDark);
  setPixel(data, ox(38), oy(36), palette.furDark);

  // Neck & head
  fillRect(data, ox(22), oy(16), 22, 14, palette.furMid);
  fillRect(data, ox(23), oy(17), 20, 12, palette.furLight);
  fillRect(data, ox(24), oy(18), 18, 10, palette.face);

  // Horns
  fillRect(data, ox(22), oy(10), 4, 8, palette.accent);
  fillRect(data, ox(21), oy(8), 3, 4, palette.sparkle);
  fillRect(data, ox(38), oy(10), 4, 8, palette.accent);
  fillRect(data, ox(40), oy(8), 3, 4, palette.sparkle);

  // Snout
  fillRect(data, ox(28), oy(26), 10, 6, palette.furLight);
  fillRect(data, ox(30), oy(28), 6, 3, palette.nose);
  if (mouthOpen) {
    fillRect(data, ox(29), oy(30), 8, 4, palette.alert);
    fillRect(data, ox(30), oy(31), 6, 2, palette.sparkle);
  }

  const eyeY = oy(22);
  if (sleep) {
    fillRect(data, ox(27), eyeY, 5, 2, palette.eye);
    fillRect(data, ox(35), eyeY, 5, 2, palette.eye);
  } else if (eyesOpen) {
    const eyeH = eyesWide ? 5 : 3;
    fillRect(data, ox(27), eyeY, 5, eyeH, palette.eye);
    fillRect(data, ox(35), eyeY, 5, eyeH, palette.eye);
    setPixel(data, ox(28), eyeY + 1, palette.sparkle);
    setPixel(data, ox(36), eyeY + 1, palette.sparkle);
  } else {
    fillRect(data, ox(27), eyeY + 1, 5, 2, palette.eye);
    fillRect(data, ox(35), eyeY + 1, 5, 2, palette.eye);
  }

  if (blush) {
    fillRect(data, ox(24), oy(24), 3, 2, palette.blush);
    fillRect(data, ox(39), oy(24), 3, 2, palette.blush);
  }

  // Claws / paws
  const pawY = oy(46);
  if (pawUp === 'left' || pawUp === 'both') {
    fillRect(data, ox(14), oy(34), 8, 10, palette.furLight);
    fillRect(data, ox(15), oy(42), 3, 3, palette.accent);
    fillRect(data, ox(19), oy(42), 3, 3, palette.accent);
  } else {
    fillRect(data, ox(18), pawY, 9, 6, palette.furLight);
    fillRect(data, ox(19), pawY + 4, 2, 2, palette.accent);
  }
  if (pawUp === 'right' || pawUp === 'both') {
    fillRect(data, ox(42), oy(34), 8, 10, palette.furLight);
    fillRect(data, ox(43), oy(42), 3, 3, palette.accent);
    fillRect(data, ox(47), oy(42), 3, 3, palette.accent);
  } else {
    fillRect(data, ox(39), pawY, 9, 6, palette.furLight);
    fillRect(data, ox(44), pawY + 4, 2, 2, palette.accent);
  }

  if (alert) {
    fillRect(data, ox(46), oy(8), 4, 8, palette.alert);
    fillRect(data, ox(47), oy(6), 2, 2, palette.sparkle);
  }

  if (sparkle) {
    fillRect(data, ox(8), oy(12), 3, 3, palette.sparkle);
    fillRect(data, ox(52), oy(14), 3, 3, palette.sparkle);
    fillRect(data, ox(32), oy(8), 2, 2, palette.alert);
  }

  if (showZzz) {
    fillRect(data, ox(48), oy(6), 3, 2, palette.zzz);
    fillRect(data, ox(52), oy(3), 4, 2, palette.zzz);
  }
}

export function createFrame(
  palette: PetPalette,
  shape: SpeciesShape,
  opts: DrawOptions,
): Buffer {
  const png = new PNG({ width: SPRITE_SIZE, height: SPRITE_SIZE });
  png.data.fill(0);
  if (shape.customDraw === 'dragon') {
    drawDragon(png.data, palette, opts);
  } else {
    drawCreature(png.data, palette, shape, opts);
  }
  return PNG.sync.write(png);
}

export const SPECIES_CONFIG: Record<
  string,
  { palette: PetPalette; shape: SpeciesShape }
> = {
  otter: {
    palette: {
      furDark: [62, 42, 30, 255],
      furMid: [98, 68, 46, 255],
      furLight: [128, 92, 64, 255],
      belly: [218, 192, 158, 255],
      face: [238, 214, 182, 255],
      nose: [40, 28, 22, 255],
      eye: [20, 14, 10, 255],
      eyeWhite: [252, 252, 252, 255],
      blush: [228, 128, 108, 200],
      alert: [255, 72, 52, 255],
      sparkle: [255, 228, 96, 255],
      zzz: [148, 168, 210, 255],
      accent: [180, 120, 80, 255],
    },
    shape: {
      id: 'otter',
      hasTail: true,
      hasWhiskers: true,
      earStyle: 'round',
      bodyWide: 24,
    },
  },
  cat: {
    palette: {
      furDark: [160, 88, 32, 255],
      furMid: [210, 130, 58, 255],
      furLight: [232, 168, 88, 255],
      belly: [248, 220, 180, 255],
      face: [252, 232, 200, 255],
      nose: [220, 100, 80, 255],
      eye: [20, 14, 10, 255],
      eyeWhite: [252, 252, 252, 255],
      blush: [240, 140, 120, 200],
      alert: [255, 72, 52, 255],
      sparkle: [255, 228, 96, 255],
      zzz: [148, 168, 210, 255],
      accent: [200, 100, 40, 255],
    },
    shape: {
      id: 'cat',
      hasTail: true,
      hasWhiskers: true,
      earStyle: 'point',
      bodyWide: 22,
    },
  },
  penguin: {
    palette: {
      furDark: [24, 24, 32, 255],
      furMid: [40, 40, 52, 255],
      furLight: [58, 58, 72, 255],
      belly: [248, 248, 252, 255],
      face: [255, 255, 255, 255],
      nose: [20, 16, 14, 255],
      eye: [12, 10, 8, 255],
      eyeWhite: [252, 252, 252, 255],
      blush: [200, 160, 160, 180],
      alert: [255, 72, 52, 255],
      sparkle: [255, 228, 96, 255],
      zzz: [148, 168, 210, 255],
      accent: [255, 140, 48, 255],
    },
    shape: {
      id: 'penguin',
      hasTail: false,
      hasWhiskers: false,
      earStyle: 'none',
      bodyWide: 22,
      beak: true,
    },
  },
  raccoon: {
    palette: {
      furDark: [52, 52, 58, 255],
      furMid: [88, 88, 96, 255],
      furLight: [128, 128, 136, 255],
      belly: [200, 196, 188, 255],
      face: [220, 216, 208, 255],
      nose: [32, 28, 26, 255],
      eye: [16, 12, 10, 255],
      eyeWhite: [252, 252, 252, 255],
      blush: [180, 140, 130, 180],
      alert: [255, 72, 52, 255],
      sparkle: [255, 228, 96, 255],
      zzz: [148, 168, 210, 255],
      accent: [24, 20, 18, 255],
    },
    shape: {
      id: 'raccoon',
      hasTail: true,
      hasWhiskers: false,
      earStyle: 'round',
      bodyWide: 24,
      maskEyes: true,
    },
  },
  dragon: {
    palette: {
      furDark: [18, 72, 58, 255],
      furMid: [32, 120, 96, 255],
      furLight: [48, 158, 128, 255],
      belly: [255, 200, 88, 255],
      face: [72, 168, 140, 255],
      nose: [24, 48, 40, 255],
      eye: [180, 20, 20, 255],
      eyeWhite: [255, 80, 40, 255],
      blush: [255, 140, 80, 180],
      alert: [255, 90, 32, 255],
      sparkle: [255, 220, 80, 255],
      zzz: [148, 168, 210, 255],
      accent: [255, 180, 48, 255],
    },
    shape: {
      id: 'dragon',
      hasTail: true,
      hasWhiskers: false,
      earStyle: 'horns',
      bodyWide: 26,
      customDraw: 'dragon',
    },
  },
};

export const ANIMATION_FRAMES: Record<string, DrawOptions[]> = {
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
