import { LOG_CATEGORY, logger } from '../../utils/logger';

/**
 * Migration 001 — initial V1 schema.
 *
 * Mirrors `docs/06_DATABASE_AND_DATA_MODEL.md`. Timestamps that represent an
 * instant are ISO-8601 UTC strings; schedule values are local "HH:mm"; cycle
 * dates are "yyyy-MM-dd".
 */
export const migration001 = {
  version: 1,
  name: 'initial_schema',
  async up(db) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key         TEXT PRIMARY KEY NOT NULL,
        value       TEXT,
        updated_at  TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reminder_definitions (
        id                  TEXT PRIMARY KEY NOT NULL,
        type                TEXT NOT NULL CHECK (type IN ('WATER','BATHROOM','FOOD','PERIOD')),
        title               TEXT,
        enabled             INTEGER NOT NULL DEFAULT 1,
        interval_minutes    INTEGER,
        active_start_time   TEXT,
        active_end_time     TEXT,
        snooze_minutes      INTEGER NOT NULL DEFAULT 15,
        voice_enabled       INTEGER NOT NULL DEFAULT 1,
        vibration_enabled   INTEGER NOT NULL DEFAULT 1,
        schedule_mode       TEXT NOT NULL DEFAULT 'FIXED_INTERVAL'
                              CHECK (schedule_mode IN ('FIXED_INTERVAL','FROM_LAST_COMPLETION')),
        created_at          TEXT NOT NULL,
        updated_at          TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS medicines (
        id            TEXT PRIMARY KEY NOT NULL,
        name          TEXT NOT NULL,
        dosage        TEXT,
        instructions  TEXT,
        notes         TEXT,
        color_key     TEXT,
        active        INTEGER NOT NULL DEFAULT 1,
        start_date    TEXT,
        end_date      TEXT,
        archived_at   TEXT,
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL,
        CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
      );

      CREATE TABLE IF NOT EXISTS medicine_schedules (
        id            TEXT PRIMARY KEY NOT NULL,
        medicine_id   TEXT NOT NULL,
        time_of_day   TEXT NOT NULL,
        repeat_type   TEXT NOT NULL DEFAULT 'DAILY'
                        CHECK (repeat_type IN ('DAILY','DAYS_OF_WEEK')),
        days_of_week  TEXT,
        enabled       INTEGER NOT NULL DEFAULT 1,
        created_at    TEXT NOT NULL,
        updated_at    TEXT NOT NULL,
        FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS reminder_occurrences (
        id                    TEXT PRIMARY KEY NOT NULL,
        occurrence_key        TEXT NOT NULL UNIQUE,
        definition_id         TEXT,
        medicine_id           TEXT,
        medicine_schedule_id  TEXT,
        type                  TEXT NOT NULL
                                CHECK (type IN ('WATER','MEDICINE','BATHROOM','FOOD','PERIOD')),
        scheduled_at          TEXT NOT NULL,
        triggered_at          TEXT,
        completed_at          TEXT,
        status                TEXT NOT NULL DEFAULT 'PENDING'
                                CHECK (status IN ('PENDING','TRIGGERED','COMPLETED','SNOOZED','SKIPPED','MISSED','CANCELLED')),
        parent_occurrence_id  TEXT,
        native_schedule_id    TEXT,
        message               TEXT,
        metadata_json         TEXT,
        created_at            TEXT NOT NULL,
        updated_at            TEXT NOT NULL,
        FOREIGN KEY (definition_id) REFERENCES reminder_definitions (id) ON DELETE CASCADE,
        FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE CASCADE,
        FOREIGN KEY (medicine_schedule_id) REFERENCES medicine_schedules (id) ON DELETE CASCADE,
        FOREIGN KEY (parent_occurrence_id) REFERENCES reminder_occurrences (id) ON DELETE SET NULL,
        CHECK (
          (type = 'MEDICINE' AND medicine_id IS NOT NULL)
          OR (type <> 'MEDICINE')
        )
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id             TEXT PRIMARY KEY NOT NULL,
        type           TEXT NOT NULL
                         CHECK (type IN ('WATER','MEDICINE','BATHROOM','FOOD','PERIOD')),
        action         TEXT NOT NULL,
        status         TEXT NOT NULL
                         CHECK (status IN ('COMPLETED','SNOOZED','SKIPPED','MISSED','CANCELLED')),
        occurred_at    TEXT NOT NULL,
        scheduled_at   TEXT,
        occurrence_id  TEXT,
        medicine_id    TEXT,
        value_numeric  REAL,
        value_text     TEXT,
        source         TEXT NOT NULL DEFAULT 'MANUAL'
                         CHECK (source IN ('REMINDER_ACTION','MANUAL','SYSTEM')),
        metadata_json  TEXT,
        created_at     TEXT NOT NULL,
        FOREIGN KEY (occurrence_id) REFERENCES reminder_occurrences (id) ON DELETE SET NULL,
        FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS notification_history (
        id             TEXT PRIMARY KEY NOT NULL,
        occurrence_id  TEXT,
        type           TEXT NOT NULL
                         CHECK (type IN ('WATER','MEDICINE','BATHROOM','FOOD','PERIOD','SYSTEM')),
        title          TEXT NOT NULL,
        body           TEXT NOT NULL,
        status         TEXT,
        is_read        INTEGER NOT NULL DEFAULT 0,
        delivered_at   TEXT NOT NULL,
        action_at      TEXT,
        created_at     TEXT NOT NULL,
        FOREIGN KEY (occurrence_id) REFERENCES reminder_occurrences (id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS period_cycles (
        id          TEXT PRIMARY KEY NOT NULL,
        start_date  TEXT NOT NULL UNIQUE,
        end_date    TEXT,
        notes       TEXT,
        source      TEXT NOT NULL DEFAULT 'MANUAL',
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL,
        CHECK (end_date IS NULL OR end_date >= start_date)
      );

      CREATE INDEX IF NOT EXISTS idx_occurrences_scheduled
        ON reminder_occurrences (scheduled_at);
      CREATE INDEX IF NOT EXISTS idx_occurrences_type_scheduled
        ON reminder_occurrences (type, scheduled_at);
      CREATE INDEX IF NOT EXISTS idx_occurrences_status_scheduled
        ON reminder_occurrences (status, scheduled_at);
      CREATE INDEX IF NOT EXISTS idx_occurrences_medicine_scheduled
        ON reminder_occurrences (medicine_id, scheduled_at);

      CREATE INDEX IF NOT EXISTS idx_activity_occurred
        ON activity_logs (occurred_at);
      CREATE INDEX IF NOT EXISTS idx_activity_type_occurred
        ON activity_logs (type, occurred_at);

      CREATE INDEX IF NOT EXISTS idx_notifications_delivered
        ON notification_history (delivered_at);
      CREATE INDEX IF NOT EXISTS idx_notifications_unread
        ON notification_history (is_read, delivered_at);

      CREATE INDEX IF NOT EXISTS idx_medicine_schedules_medicine
        ON medicine_schedules (medicine_id);

      CREATE INDEX IF NOT EXISTS idx_period_start
        ON period_cycles (start_date);
    `);

    logger.info(LOG_CATEGORY.DB, 'Applied migration 001 (initial_schema)');
  },
};
