export interface PermissionDialogInfo {
  detected: boolean;
  appName?: string;
  message?: string;
}

export const PERMISSION_TITLE_PATTERNS = [
  /would like to/i,
  /wants to access/i,
  /permission/i,
  /allow .* to/i,
  /accessibility/i,
  /microphone/i,
  /camera/i,
  /notifications/i,
  /bluetooth/i,
  /files and folders/i,
  /screen recording/i,
  /keychain/i,
  /confirm/i,
  /are you sure/i,
];

export function matchesPermissionDialog(title: string): boolean {
  return PERMISSION_TITLE_PATTERNS.some((p) => p.test(title));
}
