#!/usr/bin/env python3
"""Process watercolor otter source images into PixelPaw sprite folders."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path('/opt/cursor/artifacts/assets')
ASSET_ROOT = ROOT / 'public/assets/pets/otter'
CANVAS_SIZE = 320
WHITE_THRESHOLD = 240
PADDING = 16

POSES = {
    'idle/frame-00.png': 'otter-idle.png',
    'idle/frame-01.png': 'otter-idle-blink.png',
    'wave/frame-00.png': 'otter-wave.png',
    'sleep/frame-00.png': 'otter-sleep.png',
    'alert/frame-00.png': 'otter-alert.png',
}


def remove_white_background(image: Image.Image) -> Image.Image:
    image = image.convert('RGBA')
    pixels = image.load()
    width, height = image.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if r >= WHITE_THRESHOLD and g >= WHITE_THRESHOLD and b >= WHITE_THRESHOLD:
                pixels[x, y] = (r, g, b, 0)

    return image


def trim_and_center(image: Image.Image) -> Image.Image:
    bbox = image.getbbox()
    if not bbox:
        return Image.new('RGBA', (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))

    cropped = image.crop(bbox)
    max_dim = max(cropped.size)
    scale = (CANVAS_SIZE - PADDING * 2) / max_dim
    new_size = (
        max(1, int(cropped.width * scale)),
        max(1, int(cropped.height * scale)),
    )
    resized = cropped.resize(new_size, Image.Resampling.LANCZOS)

    canvas = Image.new('RGBA', (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    offset = (
        (CANVAS_SIZE - resized.width) // 2,
        (CANVAS_SIZE - resized.height) // 2,
    )
    canvas.paste(resized, offset, resized)
    return canvas


def process_source(source_path: Path) -> Image.Image:
    image = Image.open(source_path)
    return trim_and_center(remove_white_background(image))


def main() -> int:
    missing = [name for name in POSES.values() if not (SOURCE_DIR / name).exists()]
    if missing:
        print(f'Missing source images: {missing}', file=sys.stderr)
        return 1

    for dest_rel, source_name in POSES.items():
        dest_path = ASSET_ROOT / dest_rel
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        processed = process_source(SOURCE_DIR / source_name)
        processed.save(dest_path, optimize=True)
        print(f'Wrote {dest_path.relative_to(ROOT)}')

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
