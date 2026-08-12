import { Notification } from 'electron';
import { logger } from './Logger';
import { settingsService } from './SettingsService';

export class NotificationService {
  private lastNotificationAt = 0;

  show(title: string, body: string): void {
    const settings = settingsService.get();
    if (!settings.desktopNotifications) return;

    const now = Date.now();
    if (now - this.lastNotificationAt < settings.notificationCooldownMs) {
      logger.debug('Notification suppressed by cooldown');
      return;
    }

    if (!Notification.isSupported()) {
      logger.warn('Desktop notifications not supported');
      return;
    }

    const notification = new Notification({
      title,
      body,
      silent: !settings.notificationSound,
    });
    notification.show();
    this.lastNotificationAt = now;
    logger.info(`Notification shown: ${title}`);
  }

  resetCooldown(): void {
    this.lastNotificationAt = 0;
  }
}

export const notificationService = new NotificationService();
