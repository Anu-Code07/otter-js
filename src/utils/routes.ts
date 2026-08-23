/** True when this renderer should show the settings panel (not the pet overlay). */
export function isSettingsRoute(): boolean {
  const hash = window.location.hash.replace(/^#/, '').trim();
  return hash === 'settings' || hash === '/settings';
}
