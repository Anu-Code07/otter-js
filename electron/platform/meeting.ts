export interface MeetingInfo {
  detected: boolean;
  appName?: string;
  message?: string;
}

const MEETING_APP_NAMES = [
  'zoom',
  'microsoft teams',
  'teams',
  'slack',
  'webex',
  'discord',
  'facetime',
  'skype',
  'around',
  'whereby',
];

const MEETING_TITLE_PATTERNS = [
  /google meet/i,
  /zoom meeting/i,
  /zoom -/i,
  /\bmeeting\b/i,
  /\bhuddle\b/i,
  /call with/i,
  /in a call/i,
  /voice channel/i,
  /screen sharing/i,
];

export function matchesMeetingSignals(appName: string | null, title: string | null): MeetingInfo {
  const combined = `${appName ?? ''} ${title ?? ''}`.trim();
  if (!combined || combined.toLowerCase().includes('pixelpaw')) {
    return { detected: false };
  }

  const lowerCombined = combined.toLowerCase();
  const appMatch = appName
    ? MEETING_APP_NAMES.some((name) => appName.toLowerCase().includes(name))
    : false;
  const titleMatch = title
    ? MEETING_TITLE_PATTERNS.some((pattern) => pattern.test(title))
    : false;

  if (!appMatch && !titleMatch) {
    return { detected: false };
  }

  if (appMatch && !titleMatch) {
    const passiveApps = ['slack', 'discord', 'teams'];
    const isPassiveOnly = passiveApps.some((name) => lowerCombined.includes(name));
    if (isPassiveOnly) {
      return { detected: false };
    }
  }

  return {
    detected: true,
    appName: appName ?? title?.split(' - ')[0] ?? 'Meeting',
    message: title ?? 'In a meeting',
  };
}
