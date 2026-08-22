/** Resolve pet sprite paths — uses absolute file:// URLs in Electron for reliable loading. */
export function resolvePetAsset(relativePath: string): string {
  if (typeof window !== 'undefined' && window.pixelPaw?.assets?.resolve) {
    return window.pixelPaw.assets.resolve(relativePath);
  }
  const base = import.meta.env.BASE_URL ?? './';
  return `${base}assets/${relativePath}`;
}

export function idleSpritePath(petId = 'otter'): string {
  return resolvePetAsset(`pets/${petId}/idle/frame-00.png`);
}
