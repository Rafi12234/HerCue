import { OCCURRENCE_STATUS } from '../../constants/statuses';
import { createId } from '../../utils/ids';
import { nowIso, toIso } from '../../utils/dates';
import { resolveExecutor } from '../db';

/**
 * `reminder_definitions` (recurring configuration) and `reminder_occurrences`
 * (concrete materialised instances).
 *
 * Database state only. Nothing here talks to AlarmManager or expo-notifications
 * — the Phase 3/4 scheduler reads and writes through these functions.
 */

const DEFINITION_COLUMNS = `
  id, type, title, enabled, interval_minutes, active_start_time, active_end_time,
  snooze_minutes, voice_enabled, vibration_enabled, schedule_mode, created_at, updated_at
`;

const OCCURRENCE_COLUMNS = `
  id, occurrence_key, definition_id, medicine_id, medicine_schedule_id, type,
  scheduled_at, triggered_at, completed_at, status, parent_occurrence_id,
  native_schedule_id, message, metadata_json, created_at, updated_at
`;

function mapDefinition(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    enabled: row.enabled === 1,
    intervalMinutes: row.interval_minutes,
    activeStartTime: row.active_start_time,
    activeEndTime: row.active_end_time,
    snoozeMinutes: row.snooze_minutes,
    voiceEnabled: row.voice_enabled === 1,
    vibrationEnabled: row.vibration_enabled === 1,
    scheduleMode: row.schedule_mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOccurrence(row) {
  if (!row) return null;
  return {
    id: row.id,
    occurrenceKey: row.occurrence_key,
    definitionId: row.definition_id,
    medicineId: row.medicine_id,
    medicineScheduleId: row.medicine_schedule_id,
    type: row.type,
    scheduledAt: row.scheduled_at,
    triggeredAt: row.triggered_at,
    completedAt: row.completed_at,
    status: row.status,
    parentOccurrenceId: row.parent_occurrence_id,
    nativeScheduleId: row.native_schedule_id,
    message: row.message,
    metadata: row.metadata_json ? JSON.parse(row.metadata_json) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* -------------------------------------------------------------------------- */
/* Definitions                                                                */
/* -------------------------------------------------------------------------- */

export async function createReminderDefinition(input, executor) {
  const db = await resolveExecutor(executor);
  const id = input.id ?? createId();
  const timestamp = nowIso();

  await db.runAsync(
    `INSERT INTO reminder_definitions (
       id, type, title, enabled, interval_minutes, active_start_time, active_end_time,
       snooze_minutes, voice_enabled, vibration_enabled, schedule_mode, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.type,
      input.title ?? null,
      input.enabled === false ? 0 : 1,
      input.intervalMinutes ?? null,
      input.activeStartTime ?? null,
      input.activeEndTime ?? null,
      input.snoozeMinutes ?? 15,
      input.voiceEnabled === false ? 0 : 1,
      input.vibrationEnabled === false ? 0 : 1,
      input.scheduleMode ?? 'FIXED_INTERVAL',
      timestamp,
      timestamp,
    ]
  );

  return getReminderDefinitionByType(input.type, db);
}

const UPDATABLE_DEFINITION_FIELDS = {
  title: 'title',
  enabled: 'enabled',
  intervalMinutes: 'interval_minutes',
  activeStartTime: 'active_start_time',
  activeEndTime: 'active_end_time',
  snoozeMinutes: 'snooze_minutes',
  voiceEnabled: 'voice_enabled',
  vibrationEnabled: 'vibration_enabled',
  scheduleMode: 'schedule_mode',
};

const BOOLEAN_DEFINITION_FIELDS = new Set(['enabled', 'voiceEnabled', 'vibrationEnabled']);

export async function updateReminderDefinition(type, changes, executor) {
  const db = await resolveExecutor(executor);

  const assignments = [];
  const params = [];

  for (const [key, column] of Object.entries(UPDATABLE_DEFINITION_FIELDS)) {
    if (!(key in changes)) continue;
    assignments.push(`${column} = ?`);
    params.push(BOOLEAN_DEFINITION_FIELDS.has(key) ? (changes[key] ? 1 : 0) : changes[key]);
  }

  if (assignments.length === 0) return getReminderDefinitionByType(type, db);

  assignments.push('updated_at = ?');
  params.push(nowIso(), type);

  await db.runAsync(
    `UPDATE reminder_definitions SET ${assignments.join(', ')} WHERE type = ?;`,
    params
  );

  return getReminderDefinitionByType(type, db);
}

export async function getReminderDefinitionByType(type, executor) {
  const db = await resolveExecutor(executor);
  const row = await db.getFirstAsync(
    `SELECT ${DEFINITION_COLUMNS} FROM reminder_definitions WHERE type = ? LIMIT 1;`,
    [type]
  );
  return mapDefinition(row);
}

export async function getAllReminderDefinitions(executor) {
  const db = await resolveExecutor(executor);
  const rows = await db.getAllAsync(`SELECT ${DEFINITION_COLUMNS} FROM reminder_definitions;`);
  return rows.map(mapDefinition);
}

export async function getActiveReminderDefinitions(executor) {
  const db = await resolveExecutor(executor);
  const rows = await db.getAllAsync(
    `SELECT ${DEFINITION_COLUMNS} FROM reminder_definitions WHERE enabled = 1;`
  );
  return rows.map(mapDefinition);
}

/** Idempotent seed: creates the row on first run, leaves user edits alone after. */
export async function ensureReminderDefinition(input, executor) {
  const db = await resolveExecutor(executor);
  const existing = await getReminderDefinitionByType(input.type, db);
  if (existing) return existing;
  return createReminderDefinition(input, db);
}

/* -------------------------------------------------------------------------- */
/* Occurrences                                                                */
/* -------------------------------------------------------------------------- */

export async function createOccurrence(input, executor) {
  const db = await resolveExecutor(executor);
  const id = input.id ?? createId();
  const timestamp = nowIso();

  await db.runAsync(
    `INSERT INTO reminder_occurrences (
       id, occurrence_key, definition_id, medicine_id, medicine_schedule_id, type,
       scheduled_at, triggered_at, completed_at, status, parent_occurrence_id,
       native_schedule_id, message, metadata_json, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (occurrence_key) DO NOTHING;`,
    [
      id,
      input.occurrenceKey,
      input.definitionId ?? null,
      input.medicineId ?? null,
      input.medicineScheduleId ?? null,
      input.type,
      toIso(input.scheduledAt),
      input.triggeredAt ? toIso(input.triggeredAt) : null,
      input.completedAt ? toIso(input.completedAt) : null,
      input.status ?? OCCURRENCE_STATUS.PENDING,
      input.parentOccurrenceId ?? null,
      input.nativeScheduleId ?? null,
      input.message ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
      timestamp,
      timestamp,
    ]
  );

  // ON CONFLICT DO NOTHING makes reconciliation safe to run twice; either way
  // the caller gets the row that now owns this key.
  return getOccurrenceByKey(input.occurrenceKey, db);
}

export async function getOccurrenceById(id, executor) {
  const db = await resolveExecutor(executor);
  const row = await db.getFirstAsync(
    `SELECT ${OCCURRENCE_COLUMNS} FROM reminder_occurrences WHERE id = ?;`,
    [id]
  );
  return mapOccurrence(row);
}

export async function getOccurrenceByKey(occurrenceKey, executor) {
  const db = await resolveExecutor(executor);
  const row = await db.getFirstAsync(
    `SELECT ${OCCURRENCE_COLUMNS} FROM reminder_occurrences WHERE occurrence_key = ?;`,
    [occurrenceKey]
  );
  return mapOccurrence(row);
}

export async function updateOccurrenceStatus(id, status, changes = {}, executor) {
  const db = await resolveExecutor(executor);
  const timestamp = nowIso();

  await db.runAsync(
    `UPDATE reminder_occurrences
       SET status = ?,
           triggered_at = COALESCE(?, triggered_at),
           completed_at = COALESCE(?, completed_at),
           native_schedule_id = COALESCE(?, native_schedule_id),
           updated_at = ?
     WHERE id = ?;`,
    [
      status,
      changes.triggeredAt ? toIso(changes.triggeredAt) : null,
      changes.completedAt ? toIso(changes.completedAt) : null,
      changes.nativeScheduleId ?? null,
      timestamp,
      id,
    ]
  );

  return getOccurrenceById(id, db);
}

export async function markOccurrenceCompleted(id, completedAt = new Date(), executor) {
  return updateOccurrenceStatus(id, OCCURRENCE_STATUS.COMPLETED, { completedAt }, executor);
}

export async function markOccurrenceSnoozed(id, executor) {
  return updateOccurrenceStatus(id, OCCURRENCE_STATUS.SNOOZED, {}, executor);
}

export async function markOccurrenceSkipped(id, executor) {
  return updateOccurrenceStatus(id, OCCURRENCE_STATUS.SKIPPED, {}, executor);
}

export async function markOccurrenceMissed(id, executor) {
  return updateOccurrenceStatus(id, OCCURRENCE_STATUS.MISSED, {}, executor);
}

export async function getPendingOccurrences(options = {}, executor) {
  const db = await resolveExecutor(executor);
  const { type = null, before = null, limit = null } = options;

  const params = [OCCURRENCE_STATUS.PENDING, OCCURRENCE_STATUS.TRIGGERED];
  let sql = `SELECT ${OCCURRENCE_COLUMNS} FROM reminder_occurrences WHERE status IN (?, ?)`;

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (before) {
    sql += ' AND scheduled_at <= ?';
    params.push(toIso(before));
  }

  sql += ' ORDER BY scheduled_at ASC';
  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
  }

  const rows = await db.getAllAsync(`${sql};`, params);
  return rows.map(mapOccurrence);
}

export async function getNextPendingOccurrence(options = {}, executor) {
  const [next] = await getPendingOccurrences({ ...options, limit: 1 }, executor);
  return next ?? null;
}

export async function getOccurrencesForRange(start, end, options = {}, executor) {
  const db = await resolveExecutor(executor);
  const { type = null } = options;

  const params = [toIso(start), toIso(end)];
  let sql = `SELECT ${OCCURRENCE_COLUMNS} FROM reminder_occurrences WHERE scheduled_at BETWEEN ? AND ?`;

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }

  const rows = await db.getAllAsync(`${sql} ORDER BY scheduled_at ASC;`, params);
  return rows.map(mapOccurrence);
}

/** Used when a schedule changes: past history is preserved, future plans are not. */
export async function cancelFutureOccurrences(filters = {}, from = new Date(), executor) {
  const db = await resolveExecutor(executor);
  const { type = null, medicineId = null, definitionId = null } = filters;

  const params = [
    OCCURRENCE_STATUS.CANCELLED,
    nowIso(),
    toIso(from),
    OCCURRENCE_STATUS.PENDING,
    OCCURRENCE_STATUS.TRIGGERED,
  ];
  let sql = `UPDATE reminder_occurrences SET status = ?, updated_at = ?
             WHERE scheduled_at >= ? AND status IN (?, ?)`;

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (medicineId) {
    sql += ' AND medicine_id = ?';
    params.push(medicineId);
  }
  if (definitionId) {
    sql += ' AND definition_id = ?';
    params.push(definitionId);
  }

  const result = await db.runAsync(`${sql};`, params);
  return result.changes ?? 0;
}
