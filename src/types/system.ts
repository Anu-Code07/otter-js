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
  githubDetectionEnabled: boolean;
  githubAlerts: boolean;
  calendarDetectionEnabled: boolean;
  calendarAlerts: boolean;
  buildWatchPath: string;
  terminalWatchPath: string;
  attentionAlertsEnabled: boolean;
  doNotDisturbEnabled: boolean;
  doNotDisturbStart: string;
  doNotDisturbEnd: string;
}

export type PerformanceMode = 'minimal' | 'normal' | 'playful';

export interface AssistantSettings {
  showMoodIndicator: boolean;
  stretchReminderEnabled: boolean;
  stretchReminderMinutes: number;
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  standupReminderEnabled: boolean;
  standupReminderTime: string;
  focusModeEnabled: boolean;
  calendarReminderLeadMinutes: number;
  githubToken: string;
}

export interface AppSettings extends AttentionSourceSettings, AssistantSettings {
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
  petName: string;
  hasCompletedOnboarding: boolean;
  performanceMode: PerformanceMode;
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
  githubDetectionEnabled: false,
  githubAlerts: true,
  calendarDetectionEnabled: true,
  calendarAlerts: true,
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
  petName: '',
  hasCompletedOnboarding: false,
  performanceMode: 'normal',
  inactivityTimeoutMs: 120_000,
  notificationCooldownMs: 60_000,
  showMoodIndicator: true,
  stretchReminderEnabled: true,
  stretchReminderMinutes: 120,
  pomodoroWorkMinutes: 25,
  pomodoroBreakMinutes: 5,
  standupReminderEnabled: false,
  standupReminderTime: '09:00',
  focusModeEnabled: false,
  calendarReminderLeadMinutes: 5,
  githubToken: '',
  settingsMigrationVersion: 8,
};

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
