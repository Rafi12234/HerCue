/**
 * Keys used in the `app_settings` table.
 *
 * These strings are persisted, so renaming one silently orphans the stored
 * value. Per-category reminder configuration (intervals, active hours, goals)
 * deliberately lives in `reminder_definitions` instead — see
 * `docs/06_DATABASE_AND_DATA_MODEL.md` — so no value has two homes.
 */
export const SETTING_KEYS = {
  VOICE_ENABLED: 'voice_enabled',
  VIBRATION_ENABLED: 'vibration_enabled',

  QUIET_HOURS_ENABLED: 'quiet_hours_enabled',
  QUIET_HOURS_START: 'quiet_hours_start',
  QUIET_HOURS_END: 'quiet_hours_end',

  DEFAULT_SNOOZE_MINUTES: 'default_snooze_minutes',

  /** Not a schedule property, so it lives here rather than in reminder_definitions. */
  WATER_DAILY_GOAL: 'water_daily_goal',

  AVERAGE_CYCLE_LENGTH_DAYS: 'average_cycle_length_days',

  /** Set the first time the database is seeded, so defaults are not re-applied. */
  SEEDED_AT: 'seeded_at',
  /** IANA zone recorded at last reconciliation, for doc 02 §6.4 timezone checks. */
  LAST_TIMEZONE: 'last_timezone',
};
