import { createId } from '../../utils/ids';
import { nowIso, toCalendarDate } from '../../utils/dates';
import { resolveExecutor } from '../db';

/**
 * `period_cycles` — recorded cycle history.
 *
 * Storage only: cycle-length and estimate maths live in `periodCalculator` so
 * they stay pure and testable (`docs/10_PROJECT_STRUCTURE_AND_CODE_RULES.md` §6).
 * Dates are date-only "yyyy-MM-dd" values, never instants.
 */

const COLUMNS = 'id, start_date, end_date, notes, source, created_at, updated_at';

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes,
    source: row.source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createPeriodCycle(input, executor) {
  const db = await resolveExecutor(executor);
  const id = input.id ?? createId();
  const timestamp = nowIso();
  const startDate = toCalendarDate(input.startDate);

  await db.runAsync(
    `INSERT INTO period_cycles (id, start_date, end_date, notes, source, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      startDate,
      input.endDate ? toCalendarDate(input.endDate) : null,
      input.notes ?? null,
      input.source ?? 'MANUAL',
      timestamp,
      timestamp,
    ]
  );

  return getCycleByStartDate(startDate, db);
}

export async function getCycleByStartDate(startDate, executor) {
  const db = await resolveExecutor(executor);
  const row = await db.getFirstAsync(
    `SELECT ${COLUMNS} FROM period_cycles WHERE start_date = ?;`,
    [toCalendarDate(startDate)]
  );
  return mapRow(row);
}

export async function getCycleById(id, executor) {
  const db = await resolveExecutor(executor);
  const row = await db.getFirstAsync(`SELECT ${COLUMNS} FROM period_cycles WHERE id = ?;`, [id]);
  return mapRow(row);
}

export async function getLatestCycle(executor) {
  const db = await resolveExecutor(executor);
  const row = await db.getFirstAsync(
    `SELECT ${COLUMNS} FROM period_cycles ORDER BY start_date DESC LIMIT 1;`
  );
  return mapRow(row);
}

/** Oldest first — the order `periodCalculator` expects. */
export async function getPeriodCycles(executor) {
  const db = await resolveExecutor(executor);
  const rows = await db.getAllAsync(`SELECT ${COLUMNS} FROM period_cycles ORDER BY start_date ASC;`);
  return rows.map(mapRow);
}

export async function getRecentCycles(limit = 12, executor) {
  const db = await resolveExecutor(executor);
  const rows = await db.getAllAsync(
    `SELECT ${COLUMNS} FROM period_cycles ORDER BY start_date DESC LIMIT ?;`,
    [limit]
  );
  return rows.map(mapRow).reverse();
}

export async function countCycles(executor) {
  const db = await resolveExecutor(executor);
  const row = await db.getFirstAsync('SELECT COUNT(*) AS total FROM period_cycles;');
  return row?.total ?? 0;
}

export async function updateCycle(id, changes, executor) {
  const db = await resolveExecutor(executor);

  const assignments = [];
  const params = [];

  if ('startDate' in changes) {
    assignments.push('start_date = ?');
    params.push(toCalendarDate(changes.startDate));
  }
  if ('endDate' in changes) {
    assignments.push('end_date = ?');
    params.push(changes.endDate ? toCalendarDate(changes.endDate) : null);
  }
  if ('notes' in changes) {
    assignments.push('notes = ?');
    params.push(changes.notes ?? null);
  }

  if (assignments.length === 0) return getCycleById(id, db);

  assignments.push('updated_at = ?');
  params.push(nowIso(), id);

  await db.runAsync(`UPDATE period_cycles SET ${assignments.join(', ')} WHERE id = ?;`, params);
  return getCycleById(id, db);
}

export async function deleteCycle(id, executor) {
  const db = await resolveExecutor(executor);
  const result = await db.runAsync('DELETE FROM period_cycles WHERE id = ?;', [id]);
  return (result.changes ?? 0) > 0;
}
