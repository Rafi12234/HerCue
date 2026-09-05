import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { ANDROID_NOTIFICATION_CHANNELS } from '../../constants/config';
import { LOG_CATEGORY, logger } from '../../utils/logger';
import { failed, ok, unimplemented } from '../serviceResult';

/**
 * Notification adapter.
 *
 * Permission handling and Android channel setup are real from Phase 0 because
 * the rest of the reminder engine depends on them. Actually *delivering* a
 * reminder arrives with Water (Phase 3) and the native alarm layer (Phase 4).
 */

export const PERMISSION_STATUS = {
  GRANTED: 'GRANTED',
  DENIED: 'DENIED',
  UNDETERMINED: 'UNDETERMINED',
  UNSUPPORTED: 'UNSUPPORTED',
};

function mapPermission(response) {
  if (!response) return PERMISSION_STATUS.UNDETERMINED;
  if (response.granted) return PERMISSION_STATUS.GRANTED;
  if (response.canAskAgain === false) return PERMISSION_STATUS.DENIED;
  if (response.status === 'denied') return PERMISSION_STATUS.DENIED;
  return PERMISSION_STATUS.UNDETERMINED;
}

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNELS.reminders, {
    name: 'Reminders',
    description: 'Water, food and bathroom reminders.',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 240, 160, 240],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    enableVibrate: true,
  });

  await Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNELS.medicine, {
    name: 'Medicine reminders',
    description: 'Reminders for medicines you have added.',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 300, 160, 300, 160, 400],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    enableVibrate: true,
  });

  await Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNELS.general, {
    name: 'General updates',
    description: 'Quiet, non-urgent messages from HerCue.',
    importance: Notifications.AndroidImportance.DEFAULT,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });

  logger.info(LOG_CATEGORY.NOTIFICATION, 'Android notification channels ensured');
}

export const notificationService = {
  async initialize() {
    try {
      await ensureAndroidChannels();
      return ok();
    } catch (error) {
      logger.error(LOG_CATEGORY.NOTIFICATION, 'Channel setup failed', error);
      return failed('Notification channels could not be prepared.', error);
    }
  },

  async getPermissionStatus() {
    if (Platform.OS === 'web') return PERMISSION_STATUS.UNSUPPORTED;
    try {
      return mapPermission(await Notifications.getPermissionsAsync());
    } catch (error) {
      logger.error(LOG_CATEGORY.NOTIFICATION, 'Permission read failed', error);
      return PERMISSION_STATUS.UNDETERMINED;
    }
  },

  async requestPermission() {
    if (Platform.OS === 'web') return PERMISSION_STATUS.UNSUPPORTED;
    try {
      return mapPermission(
        await Notifications.requestPermissionsAsync({
          android: {},
          ios: { allowAlert: true, allowSound: true, allowBadge: true },
        })
      );
    } catch (error) {
      logger.error(LOG_CATEGORY.NOTIFICATION, 'Permission request failed', error);
      return PERMISSION_STATUS.UNDETERMINED;
    }
  },

  /** Opens the OS screen where the user controls HerCue's notifications. */
  async openSystemSettings() {
    try {
      await Linking.openSettings();
      return ok();
    } catch (error) {
      return failed('Could not open the system settings screen.', error);
    }
  },

  async show() {
    return unimplemented('Reminder notification delivery', 'Phase 3 — Water');
  },

  async dismiss() {
    return unimplemented('Notification dismissal', 'Phase 3 — Water');
  },
};
