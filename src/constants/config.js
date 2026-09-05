/** Named values that would otherwise become magic numbers across the codebase. */

export const SNOOZE_PRESETS_MINUTES = [5, 10, 15, 30];

export const DEFAULTS = {
  waterIntervalMinutes: 120,
  waterDailyGoal: 8,
  waterSnoozeMinutes: 15,

  medicineSnoozeMinutes: 10,

  bathroomIntervalMinutes: 180,
  bathroomSnoozeMinutes: 15,

  foodIntervalMinutes: 360,
  foodSnoozeMinutes: 15,

  activeStartTime: '08:00',
  activeEndTime: '22:00',

  quietHoursEnabled: true,
  quietHoursStart: '22:30',
  quietHoursEnd: '07:30',

  voiceEnabled: true,
  vibrationEnabled: true,

  averageCycleLengthDays: 28,
  averagePeriodDurationDays: 5,
  cyclesUsedForEstimate: 6,
};

/** How far ahead the scheduler materialises occurrences (Phase 3+). */
export const SCHEDULING = {
  horizonHours: 48,
  /** An unanswered occurrence older than this is reconciled to MISSED. */
  missedAfterMinutes: 90,
};

export const ANDROID_NOTIFICATION_CHANNELS = {
  reminders: 'hercue-reminders',
  medicine: 'hercue-medicine',
  general: 'hercue-general',
};
