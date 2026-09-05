import { createId } from '../../utils/ids';
import { nowIso } from '../../utils/dates';
import { resolveExecutor } from '../db';

/**
 * `notification_history` — the in-app inbox.
 *
 * Deliberately separate from `activity_logs`: deleting an inbox record must not
 * erase the fact that something happened (`docs/02_FEATURE_BEHAVIOR_SPEC.md` §7).
 */

const COLUMNS = `
  id, occurrence_id, type, title, body, status, is_read, delivered_at, action_at, created_at
`;

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    occurrenceId: row.occurrence_id,
    type: row.type,
    title: row.title,
    body: row.body,
    status: row.status,
    isRead: row.is_read === 1,
    deliveredAt: row.delivered_at,
    actionAt: row.action_at,
    createdAt: row.created_at,
  };
}

export async function createNotificationHistory(input, executor) {
  const db = await resolveExecutor(executor);
  const id = input.id ?? createId();
  const timestamp = nowIso();

  await db.runAsync(
    `INSERT INTO notification_history (
       id, occurrence_id, type, title, body, status, is_read, delivered_at, action_at, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.occurrenceId ?? null,
      input.type,
      input.title,
      input.body,
      input.status ?? null,
      input.isRead ? 1 : 0,
      input.deliveredAt ?? timestamp,
      input.actionAt ?? null,
      timestamp,
    ]
  );

  return getNotificationById(id, db);
}

export async function getNotificationById(id, executor) {
  const db = await resolveExecutor(executor);
  const row = await db.getFirstAsync(
    `SELECT ${COLUMNS} FROM notification_history WHERE id = ?;`,
    [id]
  );
  return mapRow(row);
}

export async function getNotificationHistory(options = {}, executor) {
  const db = await resolveExecutor(executor);
  const { limit = 100, unreadOnly = false, types = null } = options;

  const params = [];
  let sql = `SELECT ${COLUMNS} FROM notification_history WHERE 1 = 1`;

  if (unreadOnly) sql += ' AND is_read = 0';
  if (types?.length) {
    sql += ` AND type IN (${types.map(() => '?').join(', ')})`;
    params.push(...types);
  }

  sql += ' ORDER BY delivered_at DESC LIMIT ?;';
  params.push(limit);

  const rows = await db.getAllAsync(sql, params);
  return rows.map(mapRow);
}

export async function getUnreadCount(executor) {
  const db = await resolveExecutor(executor);
  const row = await db.getFirstAsync(
    'SELECT COUNT(*) AS total FROM notification_history WHERE is_read = 0;'
  );
  return row?.total ?? 0;
}

export async function markRead(id, executor) {
  const db = await resolveExecutor(executor);
  await db.runAsync('UPDATE notification_history SET is_read = 1 WHERE id = ?;', [id]);
  return getNotificationById(id, db);
}

export async function markAllRead(executor) {
  const db = await resolveExecutor(executor);
  const result = await db.runAsync(
    'UPDATE notification_history SET is_read = 1 WHERE is_read = 0;'
  );
  return result.changes ?? 0;
}

/** Removes the inbox entry only; the linked activity row is untouched. */
export async function deleteInboxRecord(id, executor) {
  const db = await resolveExecutor(executor);
  const result = await db.runAsync('DELETE FROM notification_history WHERE id = ?;', [id]);
  return (result.changes ?? 0) > 0;
}
