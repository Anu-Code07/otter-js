export interface CursorPosition {
  x: number;
  y: number;
}

export interface AttentionSourceSettings {
  claudeDetectionEnabled: boolean;
  claudeAlerts: boolean;
  permissionDetectionEnabled: boolean;
  permissionAlerts: boolean;
  buildDetectionEnabled: boolean;
  buildAlerts: boolean;
  terminalDetectionEnabled: boolean;
  terminalAlerts: boolean;
  gitDetectionEnabled: boolean;
  gitAlerts: boolean;
  meetingDetectionEnabled: boolean;
  meetingAlerts: boolean;
  integrationWebhookEnabled: boolean;
  integrationAlerts: boolean;
  integrationWebhookPort: number;
  buildWatchPath: string;
  terminalWatchPath: string;
  attentionAlertsEnabled: boolean;
  doNotDisturbEnabled: boolean;
  doNotDisturbStart: string;
  doNotDisturbEnd: string;
}

export interface AppSettings extends AttentionSourceSettings {
  launchAtStartup: boolean;
  petSize: number;
  petOpacity: number;
  alwaysOnTop: boolean;
  rememberPosition: boolean;
  followCursor: boolean;
  randomWandering: boolean;
  sleepWhenInactive: boolean;
  interactionFrequency: number;
  desktopNotifications: boolean;
  notificationSound: boolean;
  alertMessages: boolean;
  developerMode: boolean;
  petEnabled: boolean;
  selectedPetId: string;
  inactivityTimeoutMs: number;
  notificationCooldownMs: number;
  windowBounds?: WindowBounds;
  settingsMigrationVersion?: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  launchAtStartup: false,
  petSize: 160,
  petOpacity: 1,
  alwaysOnTop: true,
  rememberPosition: true,
  followCursor: false,
  randomWandering: false,
  sleepWhenInactive: true,
  interactionFrequency: 0.5,
  claudeDetectionEnabled: true,
  claudeAlerts: true,
  permissionDetectionEnabled: true,
  permissionAlerts: true,
  buildDetectionEnabled: true,
  buildAlerts: true,
  terminalDetectionEnabled: true,
  terminalAlerts: true,
  gitDetectionEnabled: true,
  gitAlerts: true,
  meetingDetectionEnabled: true,
  meetingAlerts: false,
  integrationWebhookEnabled: true,
  integrationAlerts: true,
  integrationWebhookPort: 47832,
  buildWatchPath: '',
  terminalWatchPath: '',
  attentionAlertsEnabled: true,
  doNotDisturbEnabled: false,
  doNotDisturbStart: '22:00',
  doNotDisturbEnd: '08:00',
  desktopNotifications: true,
  notificationSound: false,
  alertMessages: true,
  developerMode: false,
  petEnabled: true,
  selectedPetId: 'otter',
  inactivityTimeoutMs: 120_000,
  notificationCooldownMs: 60_000,
  settingsMigrationVersion: 6,
};

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
