#!/usr/bin/env tsx
/**
 * Generates pixel-art sprites for all pets (otter, cat, frog, penguin, raccoon).
 */
import fs from 'fs';
import path from 'path';
import {
  ANIMATION_FRAMES,
  createFrame,
  SPECIES_CONFIG,
  SPRITE_SIZE,
} from './sprite-draw';

const ASSETS_ROOT = path.resolve('public/assets/pets');

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

function generateSpecies(speciesId: string): void {
  const config = SPECIES_CONFIG[speciesId];
  if (!config) return;

  const speciesRoot = path.join(ASSETS_ROOT, speciesId);
  for (const [folder, frames] of Object.entries(ANIMATION_FRAMES)) {
    const dir = path.join(speciesRoot, folder);
    ensureDir(dir);
    frames.forEach((frameOpts, index) => {
      const buffer = createFrame(config.palette, config.shape, frameOpts);
      fs.writeFileSync(path.join(dir, `frame-${String(index).padStart(2, '0')}.png`), buffer);
    });
    cleanStaleFrames(dir, frames.length);
  }
  console.log(`Generated ${speciesId} sprites`);
}

function generateSprites(): void {
  for (const speciesId of Object.keys(SPECIES_CONFIG)) {
    generateSpecies(speciesId);
  }

  const otter = SPECIES_CONFIG.otter;
  const trayPng = createFrame(otter.palette, otter.shape, { offsetY: 4 });
  fs.writeFileSync(path.join('public', 'assets', 'tray-icon.png'), trayPng);
  console.log(`Generated tray icon (${SPRITE_SIZE}×${SPRITE_SIZE})`);
}

generateSprites();
