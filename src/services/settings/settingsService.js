import { DEFAULTS } from '../../constants/config';
import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { SETTING_KEYS } from '../../constants/settingKeys';
import {
  ensureReminderDefinition,
  getAllReminderDefinitions,
  getReminderDefinitionByType,
  updateReminderDefinition,
} from '../../database/repositories/reminderRepository';
import {
  getAllSettings,
  setSetting,
  setSettings,
} from '../../database/repositories/settingsRepository';
import { LOG_CATEGORY, logger } from '../../utils/logger';

/**
 * Typed access to settings, so screens never parse raw key/value JSON.
 *
 * Two stores sit behind this one API: global preferences in `app_settings`, and
 * per-category schedule configuration in `reminder_definitions`. Each value has
 * exactly one home.
 */

const GLOBAL_DEFAULTS = {
  [SETTING_KEYS.VOICE_ENABLED]: DEFAULTS.voiceEnabled,
  [SETTING_KEYS.VIBRATION_ENABLED]: DEFAULTS.vibrationEnabled,
  [SETTING_KEYS.QUIET_HOURS_ENABLED]: DEFAULTS.quietHoursEnabled,
  [SETTING_KEYS.QUIET_HOURS_START]: DEFAULTS.quietHoursStart,
  [SETTING_KEYS.QUIET_HOURS_END]: DEFAULTS.quietHoursEnd,
  [SETTING_KEYS.DEFAULT_SNOOZE_MINUTES]: DEFAULTS.waterSnoozeMinutes,
  [SETTING_KEYS.WATER_DAILY_GOAL]: DEFAULTS.waterDailyGoal,
  [SETTING_KEYS.AVERAGE_CYCLE_LENGTH_DAYS]: DEFAULTS.averageCycleLengthDays,
};

/**
 * Configuration, not history — seeding these invents nothing the user did.
 * `enabled` stays false until Phase 3/4 can actually deliver a reminder, so the
 * UI never advertises a reminder that cannot fire.
 */
const DEFINITION_SEEDS = [
  {
    type: REMINDER_TYPES.WATER,
    title: 'Water',
    enabled: false,
    intervalMinutes: DEFAULTS.waterIntervalMinutes,
    activeStartTime: DEFAULTS.activeStartTime,
    activeEndTime: DEFAULTS.activeEndTime,
    snoozeMinutes: DEFAULTS.waterSnoozeMinutes,
    scheduleMode: 'FIXED_INTERVAL',
  },
  {
    type: REMINDER_TYPES.FOOD,
    title: 'Food',
    enabled: false,
    intervalMinutes: DEFAULTS.foodIntervalMinutes,
    activeStartTime: DEFAULTS.activeStartTime,
    activeEndTime: DEFAULTS.activeEndTime,
    snoozeMinutes: DEFAULTS.foodSnoozeMinutes,
    scheduleMode: 'FROM_LAST_COMPLETION',
  },
  {
    type: REMINDER_TYPES.BATHROOM,
    title: 'Bathroom',
    enabled: false,
    intervalMinutes: DEFAULTS.bathroomIntervalMinutes,
    activeStartTime: DEFAULTS.activeStartTime,
    activeEndTime: DEFAULTS.activeEndTime,
    snoozeMinutes: DEFAULTS.bathroomSnoozeMinutes,
    scheduleMode: 'FROM_LAST_COMPLETION',
  },
];

/** Runs on every boot; each step is a no-op once already applied. */
export async function seedDefaults() {
  const stored = await getAllSettings();

  const missing = Object.entries(GLOBAL_DEFAULTS).filter(([key]) => !(key in stored));
  if (missing.length > 0) {
    await setSettings(Object.fromEntries(missing));
  }

  for (const seed of DEFINITION_SEEDS) {
    await ensureReminderDefinition(seed);
  }

  if (!stored[SETTING_KEYS.SEEDED_AT]) {
    await setSetting(SETTING_KEYS.SEEDED_AT, new Date().toISOString());
    logger.info(LOG_CATEGORY.DB, 'Seeded default settings and reminder definitions');
  }
}

export async function loadSettings() {
  const stored = await getAllSettings();
  const read = (key) => (key in stored ? stored[key] : GLOBAL_DEFAULTS[key]);

  return {
    voiceEnabled: Boolean(read(SETTING_KEYS.VOICE_ENABLED)),
    vibrationEnabled: Boolean(read(SETTING_KEYS.VIBRATION_ENABLED)),
    quietHoursEnabled: Boolean(read(SETTING_KEYS.QUIET_HOURS_ENABLED)),
    quietHoursStart: read(SETTING_KEYS.QUIET_HOURS_START),
    quietHoursEnd: read(SETTING_KEYS.QUIET_HOURS_END),
    defaultSnoozeMinutes: Number(read(SETTING_KEYS.DEFAULT_SNOOZE_MINUTES)),
    waterDailyGoal: Number(read(SETTING_KEYS.WATER_DAILY_GOAL)),
    averageCycleLengthDays: Number(read(SETTING_KEYS.AVERAGE_CYCLE_LENGTH_DAYS)),
  };
}

export async function updateSetting(key, value) {
  await setSetting(key, value);
  return loadSettings();
}

export async function getQuietHours() {
  const settings = await loadSettings();
  return {
    enabled: settings.quietHoursEnabled,
    start: settings.quietHoursStart,
    end: settings.quietHoursEnd,
  };
}

export async function getReminderConfig(type) {
  return getReminderDefinitionByType(type);
}

export async function getAllReminderConfigs() {
  const definitions = await getAllReminderDefinitions();
  return definitions.reduce((accumulator, definition) => {
    accumulator[definition.type] = definition;
    return accumulator;
  }, {});
}

export async function updateReminderConfig(type, changes) {
  return updateReminderDefinition(type, changes);
}
