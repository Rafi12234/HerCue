import { Platform } from 'react-native';

import { notificationService, PERMISSION_STATUS } from '../notification/notificationService';
import { reminderScheduler } from '../reminder/reminderScheduler';
import { vibrationService } from '../vibration/vibrationService';
import { voiceService } from '../voice/voiceService';

/**
 * Single place the UI asks "what is HerCue actually allowed to do right now?".
 *
 * Everything is probed at runtime — a declared manifest permission proves
 * nothing about what the device will actually let the app do.
 */

export const EXACT_ALARM_STATUS = {
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  UNKNOWN: 'UNKNOWN',
};

export const permissionService = {
  async getSnapshot() {
    const [notifications, canScheduleExact, voiceAvailable, vibrationAvailable, channels] =
      await Promise.all([
        notificationService.getPermissionStatus(),
        reminderScheduler.canScheduleExact(),
        voiceService.isAvailable(),
        vibrationService.isAvailable(),
        notificationService.getChannelHealth(),
      ]);

    return {
      notifications,
      exactAlarms: reminderScheduler.isImplemented
        ? canScheduleExact
          ? EXACT_ALARM_STATUS.AVAILABLE
          : EXACT_ALARM_STATUS.UNAVAILABLE
        : EXACT_ALARM_STATUS.UNKNOWN,
      voiceAvailable,
      vibrationAvailable,
      channels,
      engineAvailable: reminderScheduler.isImplemented,
      platformSupported: Platform.OS === 'android' || Platform.OS === 'ios',
    };
  },

  async requestNotifications() {
    return notificationService.requestPermission();
  },

  async openSystemSettings() {
    return notificationService.openSystemSettings();
  },
};

export { PERMISSION_STATUS };
