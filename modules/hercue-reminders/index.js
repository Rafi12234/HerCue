import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * Thin JS surface over the native reminder engine.
 *
 * `requireOptionalNativeModule` keeps this importable in Expo Go and on iOS,
 * where the module does not exist — callers check `isAvailable()` rather than
 * crashing on import.
 */
const native = requireOptionalNativeModule('HerCueReminders');

export const isNativeReminderEngineAvailable = () =>
  Platform.OS === 'android' && native != null;

function guard(name, fallback) {
  return (...args) => {
    if (!isNativeReminderEngineAvailable()) return fallback;
    return native[name](...args);
  };
}

export const HerCueReminders = {
  isAvailable: isNativeReminderEngineAvailable,
  canScheduleExact: guard('canScheduleExact', false),
  openExactAlarmSettings: guard('openExactAlarmSettings', false),
  hasVibrator: guard('hasVibrator', false),

  /** Returns "exact" | "inexact" | "failed". */
  schedule: guard('schedule', 'failed'),
  cancel: guard('cancel', undefined),
  cancelAll: guard('cancelAll', undefined),
  scheduledIds: guard('scheduledIds', []),

  pendingActions: guard('pendingActions', '[]'),
  clearPendingActions: guard('clearPendingActions', undefined),
  dismissNotification: guard('dismissNotification', undefined),

  vibrate: guard('vibrate', undefined),
  stopVibration: guard('stopVibration', undefined),
  speak: guard('speak', undefined),
  stopSpeaking: guard('stopSpeaking', undefined),

  showNow: guard('showNow', undefined),
};
