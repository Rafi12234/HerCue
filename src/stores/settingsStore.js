import { create } from 'zustand';

import { DEFAULTS } from '../constants/config';
import { SETTING_KEYS } from '../constants/settingKeys';
import { reminderScheduler } from '../services/reminder/reminderScheduler';
import { loadSettings, updateSetting } from '../services/settings/settingsService';
import { LOG_CATEGORY, logger } from '../utils/logger';

/**
 * Settings snapshot backed by `app_settings`.
 *
 * `hydrate` runs during bootstrap; every mutation writes to SQLite first and
 * rolls the in-memory value back if the write fails, so what is shown is always
 * what is stored.
 */
export const useSettingsStore = create((set, get) => ({
  persisted: false,
  saving: false,

  voiceEnabled: DEFAULTS.voiceEnabled,
  vibrationEnabled: DEFAULTS.vibrationEnabled,

  quietHoursEnabled: DEFAULTS.quietHoursEnabled,
  quietHoursStart: DEFAULTS.quietHoursStart,
  quietHoursEnd: DEFAULTS.quietHoursEnd,

  defaultSnoozeMinutes: DEFAULTS.waterSnoozeMinutes,
  waterDailyGoal: DEFAULTS.waterDailyGoal,
  averageCycleLengthDays: DEFAULTS.averageCycleLengthDays,

  periodRemindersEnabled: DEFAULTS.periodRemindersEnabled,
  periodRemindDaysBefore: DEFAULTS.periodRemindDaysBefore,
  periodRemindTime: DEFAULTS.periodRemindTime,

  reduceMotion: false,

  async hydrate() {
    const settings = await loadSettings();
    set({ ...settings, persisted: true });
  },

  async setValue(storeKey, settingKey, value) {
    const previous = get()[storeKey];
    set({ [storeKey]: value, saving: true });

    try {
      await updateSetting(settingKey, value);
    } catch (error) {
      logger.error(LOG_CATEGORY.DB, `Could not save setting ${settingKey}`, error);
      set({ [storeKey]: previous });
    } finally {
      set({ saving: false });
    }
  },

  toggleVoice() {
    return get().setValue('voiceEnabled', SETTING_KEYS.VOICE_ENABLED, !get().voiceEnabled);
  },

  toggleVibration() {
    return get().setValue(
      'vibrationEnabled',
      SETTING_KEYS.VIBRATION_ENABLED,
      !get().vibrationEnabled
    );
  },

  toggleQuietHours() {
    return get().setValue(
      'quietHoursEnabled',
      SETTING_KEYS.QUIET_HOURS_ENABLED,
      !get().quietHoursEnabled
    );
  },

  async togglePeriodReminders() {
    await get().setValue(
      'periodRemindersEnabled',
      SETTING_KEYS.PERIOD_REMINDERS_ENABLED,
      !get().periodRemindersEnabled
    );
    // Turning these on or off changes which occurrences should exist.
    await reminderScheduler.reconcile('period-reminders-toggled');
  },

  setReduceMotion(reduceMotion) {
    set({ reduceMotion });
  },
}));
