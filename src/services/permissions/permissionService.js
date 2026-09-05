import { Platform } from 'react-native';

import { notificationService, PERMISSION_STATUS } from '../notification/notificationService';
import { reminderScheduler } from '../reminder/reminderScheduler';

/**
 * Single place the UI asks "what is HerCue actually allowed to do right now?".
 *
 * Exact-alarm access cannot be inspected from JavaScript, so it is reported as
 * UNKNOWN until the native module lands rather than being guessed at.
 */

export const EXACT_ALARM_STATUS = {
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  UNKNOWN: 'UNKNOWN',
};

export const permissionService = {
  async getSnapshot() {
    const notifications = await notificationService.getPermissionStatus();
    const canScheduleExact = await reminderScheduler.canScheduleExact();

    return {
      notifications,
      exactAlarms: reminderScheduler.isImplemented
        ? canScheduleExact
          ? EXACT_ALARM_STATUS.AVAILABLE
          : EXACT_ALARM_STATUS.UNAVAILABLE
        : EXACT_ALARM_STATUS.UNKNOWN,
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
