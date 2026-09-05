import { endOfDay, startOfDay } from 'date-fns';

import { ACTIVITY_SOURCE } from '../../constants/statuses';
import { createId } from '../../utils/ids';
import { nowIso, toIso } from '../../utils/dates';
import { resolveExecutor } from '../db';

/**
 * `activity_logs` — what the user actually did.
 *
 * Distinct from `reminder_occurrences`, which records what was *supposed* to
 * happen (`docs/06_DATABASE_AND_DATA_MODEL.md` §6).
 */

const SELECT_COLUMNS = `
  id, type, action, status, occurred_at, scheduled_at, occurrence_id,
  medicine_id, value_numeric, value_text, source, metadata_json, created_at
`;

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    action: row.action,
    status: row.status,
    occurredAt: row.occurred_at,
    scheduledAt: row.scheduled_at,
    occurrenceId: row.occurrence_id,
    medicineId: row.medicine_id,
    valueNumeric: row.value_numeric,
    valueText: row.value_text,
    source: row.source,
    metadata: row.metadata_json ? safeParse(row.metadata_json) : null,
    createdAt: row.created_at,
  };
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function createActivity(input, executor) {
  const db = await resolveExecutor(executor);
  const id = input.id ?? createId();
  const createdAt = nowIso();

  await db.runAsync(
    `INSERT INTO activity_logs (
       id, type, action, status, occurred_at, scheduled_at, occurrence_id,
       medicine_id, value_numeric, value_text, source, metadata_json, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.type,
      input.action,
      input.status,
      toIso(input.occurredAt) ?? createdAt,
      input.scheduledAt ? toIso(input.scheduledAt) : null,
      input.occurrenceId ?? null,
      input.medicineId ?? null,
      input.valueNumeric ?? null,
      input.valueText ?? null,
      input.source ?? ACTIVITY_SOURCE.MANUAL,
      input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt,
    ]
  );

  return getActivityById(id, db);
}

export async function getActivityById(id, executor) {
  const db = await resolveExecutor(executor);
  const row = await db.getFirstAsync(`SELECT ${SELECT_COLUMNS} FROM activity_logs WHERE id = ?;`, [
    id,
  ]);
  return mapRow(row);
}

/**
 * ISO-8601 UTC strings sort lexicographically in the same order as they sort
 * chronologically, so a plain BETWEEN is correct here.
 */
export async function getActivitiesForRange(start, end, options = {}, executor) {
  const db = await resolveExecutor(executor);
  const { types = null, limit = null, order = 'ASC' } = options;

  const params = [toIso(start), toIso(end)];
  let sql = `SELECT ${SELECT_COLUMNS} FROM activity_logs WHERE occurred_at BETWEEN ? AND ?`;

  if (types?.length) {
    sql += ` AND type IN (${types.map(() => '?').join(', ')})`;
    params.push(...types);
  }

  sql += ` ORDER BY occurred_at ${order === 'DESC' ? 'DESC' : 'ASC'}`;

  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
  }

  const rows = await db.getAllAsync(`${sql};`, params);
  return rows.map(mapRow);
}

/** Local-day bounds, so an event at 12:05 AM belongs to the new day (doc 08 §9). */
export async function getTodayActivities(now = new Date(), options = {}, executor) {
  return getActivitiesForRange(startOfDay(now), endOfDay(now), options, executor);
}

export async function getLatestActivityByType(type, options = {}, executor) {
  const db = await resolveExecutor(executor);
  const { action = null, status = null } = options;

  const params = [type];
  let sql = `SELECT ${SELECT_COLUMNS} FROM activity_logs WHERE type = ?`;

  if (action) {
    sql += ' AND action = ?';
    params.push(action);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY occurred_at DESC LIMIT 1;';

  const row = await db.getFirstAsync(sql, params);
  return mapRow(row);
}

export async function countActivities(filters = {}, executor) {
  const db = await resolveExecutor(executor);
  const { type = null, action = null, status = null, start = null, end = null } = filters;

  const params = [];
  let sql = 'SELECT COUNT(*) AS total FROM activity_logs WHERE 1 = 1';

  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (action) {
    sql += ' AND action = ?';
    params.push(action);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (start && end) {
    sql += ' AND occurred_at BETWEEN ? AND ?';
    params.push(toIso(start), toIso(end));
  }

  const row = await db.getFirstAsync(`${sql};`, params);
  return row?.total ?? 0;
}

export async function countActivitiesForDay(type, filters = {}, now = new Date(), executor) {
  return countActivities(
    { type, start: startOfDay(now), end: endOfDay(now), ...filters },
    executor
  );
}

export async function getActivitiesByTypeAndRange(type, start, end, executor) {
  return getActivitiesForRange(start, end, { types: [type] }, executor);
}
