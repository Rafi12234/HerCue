import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { HerCueReminders } from '../../../modules/hercue-reminders';
import { ANDROID_NOTIFICATION_CHANNELS } from '../../constants/config';
import { LOG_CATEGORY, logger } from '../../utils/logger';
import { failed, ok, unimplemented } from '../serviceResult';

/**
 * Notification adapter.
 *
 * Channels and permissions go through expo-notifications; actual reminder
 * delivery goes through the native layer, because an alarm usually fires with
 * no JavaScript runtime alive to post anything.
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

  /** Posts immediately, bypassing the alarm — used for previews and tests. */
  async show({ id, type, title, body, channelId }) {
    if (!HerCueReminders.isAvailable()) {
      return unimplemented('Reminder notification delivery', 'a device build');
    }

    HerCueReminders.showNow({
      id,
      type,
      title,
      body,
      channelId: channelId ?? ANDROID_NOTIFICATION_CHANNELS.general,
    });
    logger.debug(LOG_CATEGORY.NOTIFICATION, `Notification shown for ${type}`);
    return ok();
  },

  async dismiss(id) {
    if (!HerCueReminders.isAvailable()) {
      return unimplemented('Notification dismissal', 'a device build');
    }
    HerCueReminders.dismissNotification(id);
    return ok();
  },
};
