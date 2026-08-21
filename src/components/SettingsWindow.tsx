import { useCallback, useEffect, useState } from 'react';
import { ipc } from '../services/ipc';
import { getAvailablePets, isPetAvailable } from '../pets/registry';
import type { AppSettings } from '../types/system';
import type { AttentionSourceId, AttentionSignal } from '../types/attention';
import { ATTENTION_SOURCE_LABELS } from '../types/attention';
import type { ClaudeStatus } from '../types/claude';

interface SettingsWindowProps {
  onClose?: () => void;
}

const SOURCE_TOGGLES: Array<{
  detectionKey: keyof AppSettings;
  alertKey: keyof AppSettings;
  id: AttentionSourceId;
}> = [
  { id: 'claude', detectionKey: 'claudeDetectionEnabled', alertKey: 'claudeAlerts' },
  { id: 'permission', detectionKey: 'permissionDetectionEnabled', alertKey: 'permissionAlerts' },
  { id: 'build', detectionKey: 'buildDetectionEnabled', alertKey: 'buildAlerts' },
  { id: 'terminal', detectionKey: 'terminalDetectionEnabled', alertKey: 'terminalAlerts' },
  { id: 'git', detectionKey: 'gitDetectionEnabled', alertKey: 'gitAlerts' },
  { id: 'meeting', detectionKey: 'meetingDetectionEnabled', alertKey: 'meetingAlerts' },
  { id: 'integration', detectionKey: 'integrationWebhookEnabled', alertKey: 'integrationAlerts' },
];

export function SettingsWindow({ onClose }: SettingsWindowProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    void ipc().settings.get().then(setSettings);
    return ipc().settings.onChange(setSettings);
  }, []);

  const update = useCallback(async (partial: Partial<AppSettings>) => {
    const next = await ipc().settings.set(partial);
    setSettings(next);
  }, []);

  const simulate = useCallback(async (sourceId: AttentionSourceId, signal: Partial<AttentionSignal> | null) => {
    await ipc().attention.simulate(sourceId, signal);
  }, []);

  const simulateClaude = useCallback(async (status: ClaudeStatus) => {
    await ipc().claude.simulateStatus(status);
  }, []);

  const clearSimulation = useCallback(async () => {
    const sources: AttentionSourceId[] = ['claude', 'permission', 'build', 'terminal', 'git', 'meeting', 'integration'];
    await Promise.all(sources.map((id) => ipc().attention.simulate(id, null)));
    await ipc().claude.simulateStatus(null);
  }, []);

  if (!settings) {
    return <div className="settings-loading">Loading settings...</div>;
  }

  return (
    <div className="settings-window">
      <header className="settings-header">
        <h1>PixelPaw Settings</h1>
        {onClose && (
          <button type="button" className="close-btn" onClick={onClose}>×</button>
        )}
      </header>

      <section>
        <h2>General</h2>
        <label><input type="checkbox" checked={settings.launchAtStartup} onChange={(e) => void update({ launchAtStartup: e.target.checked })} /> Launch at startup</label>
        <label>Pet size: {settings.petSize}px<input type="range" min={64} max={200} value={settings.petSize} onChange={(e) => void update({ petSize: Number(e.target.value) })} /></label>
        <label>Opacity: {Math.round(settings.petOpacity * 100)}%<input type="range" min={0.3} max={1} step={0.05} value={settings.petOpacity} onChange={(e) => void update({ petOpacity: Number(e.target.value) })} /></label>
        <label><input type="checkbox" checked={settings.alwaysOnTop} onChange={(e) => void update({ alwaysOnTop: e.target.checked })} /> Always on top</label>
        <label><input type="checkbox" checked={settings.rememberPosition} onChange={(e) => void update({ rememberPosition: e.target.checked })} /> Remember position</label>
      </section>

      <section>
        <h2>Behaviour</h2>
        <label><input type="checkbox" checked={settings.followCursor} onChange={(e) => void update({ followCursor: e.target.checked })} /> Follow cursor</label>
        <label><input type="checkbox" checked={settings.randomWandering} onChange={(e) => void update({ randomWandering: e.target.checked })} /> Random wandering</label>
        <label><input type="checkbox" checked={settings.sleepWhenInactive} onChange={(e) => void update({ sleepWhenInactive: e.target.checked })} /> Sleep when inactive</label>
        <label>Interaction frequency: {Math.round(settings.interactionFrequency * 100)}%<input type="range" min={0} max={1} step={0.05} value={settings.interactionFrequency} onChange={(e) => void update({ interactionFrequency: Number(e.target.value) })} /></label>
      </section>

      <section>
        <h2>Attention Alerts</h2>
        <label><input type="checkbox" checked={settings.attentionAlertsEnabled} onChange={(e) => void update({ attentionAlertsEnabled: e.target.checked })} /> Master attention alerts</label>
        <label><input type="checkbox" checked={settings.desktopNotifications} onChange={(e) => void update({ desktopNotifications: e.target.checked })} /> Desktop notifications</label>
        <label><input type="checkbox" checked={settings.notificationSound} onChange={(e) => void update({ notificationSound: e.target.checked })} /> Notification sound</label>
        <label><input type="checkbox" checked={settings.alertMessages} onChange={(e) => void update({ alertMessages: e.target.checked })} /> Speech bubble messages</label>
        <label><input type="checkbox" checked={settings.doNotDisturbEnabled} onChange={(e) => void update({ doNotDisturbEnabled: e.target.checked })} /> Do not disturb</label>
        {settings.doNotDisturbEnabled && (
          <div className="dnd-row">
            <label>From <input type="time" value={settings.doNotDisturbStart} onChange={(e) => void update({ doNotDisturbStart: e.target.value })} /></label>
            <label>To <input type="time" value={settings.doNotDisturbEnd} onChange={(e) => void update({ doNotDisturbEnd: e.target.value })} /></label>
          </div>
        )}
      </section>

      <section>
        <h2>Attention Sources</h2>
        {SOURCE_TOGGLES.map(({ id, detectionKey, alertKey }) => (
          <div key={id} className="source-toggle-group">
            <strong>{ATTENTION_SOURCE_LABELS[id]}</strong>
            <label><input type="checkbox" checked={Boolean(settings[detectionKey])} onChange={(e) => void update({ [detectionKey]: e.target.checked })} /> Detect</label>
            <label><input type="checkbox" checked={Boolean(settings[alertKey])} onChange={(e) => void update({ [alertKey]: e.target.checked })} /> Alert</label>
          </div>
        ))}
        <label>Build watch path<input type="text" placeholder="~/project/build.log" value={settings.buildWatchPath} onChange={(e) => void update({ buildWatchPath: e.target.value })} /></label>
        <label>Terminal watch path<input type="text" placeholder="~/.pixelpaw/terminal.log" value={settings.terminalWatchPath} onChange={(e) => void update({ terminalWatchPath: e.target.value })} /></label>
        <label>Webhook port: {settings.integrationWebhookPort}<input type="number" min={1024} max={65535} value={settings.integrationWebhookPort} onChange={(e) => void update({ integrationWebhookPort: Number(e.target.value) })} /></label>
        <p className="settings-hint">POST to <code>http://127.0.0.1:{settings.integrationWebhookPort}/attention</code></p>
      </section>

      <section>
        <h2>Appearance</h2>
        <div className="pet-selector">
          {getAvailablePets().map((pet) => (
            <button
              key={pet.id}
              type="button"
              className={`pet-option ${settings.selectedPetId === pet.id ? 'selected' : ''}`}
              disabled={!isPetAvailable(pet.id)}
              onClick={() => isPetAvailable(pet.id) && void update({ selectedPetId: pet.id })}
              title={isPetAvailable(pet.id) ? pet.name : 'Coming soon'}
            >
              {pet.emoji} {pet.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Developer Mode</h2>
        <label><input type="checkbox" checked={settings.developerMode} onChange={(e) => void update({ developerMode: e.target.checked })} /> Enable developer mode</label>
        {settings.developerMode && (
          <div className="dev-panel">
            <p>Simulate attention sources</p>
            <div className="dev-buttons">
              <button type="button" onClick={() => void simulateClaude('waiting_for_user')}>Claude waiting</button>
              <button type="button" onClick={() => void simulateClaude('working')}>Claude working</button>
              <button type="button" onClick={() => void simulate('permission', { status: 'needs_user', priority: 'critical', message: 'App wants microphone access' })}>Permission dialog</button>
              <button type="button" onClick={() => void simulate('build', { status: 'needs_user', priority: 'high', message: 'Build failed' })}>Build failed</button>
              <button type="button" onClick={() => void simulate('build', { status: 'success', priority: 'medium', message: 'Build succeeded!' })}>Build success</button>
              <button type="button" onClick={() => void simulate('terminal', { status: 'needs_user', priority: 'high', message: 'Terminal needs input' })}>Terminal prompt</button>
              <button type="button" onClick={() => void simulate('git', { status: 'needs_user', priority: 'high', message: 'Merge conflict' })}>Git conflict</button>
              <button type="button" onClick={() => void simulate('meeting', { status: 'working', priority: 'low', message: 'Zoom meeting' })}>In meeting</button>
              <button type="button" onClick={() => void simulate('integration', { status: 'needs_user', priority: 'high', message: 'VS Code needs you' })}>Integration</button>
              <button type="button" onClick={() => void clearSimulation()}>Clear all</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
