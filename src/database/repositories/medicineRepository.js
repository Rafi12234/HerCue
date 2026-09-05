import { createId } from '../../utils/ids';
import { nowIso, toCalendarDate } from '../../utils/dates';
import { resolveExecutor } from '../db';

/**
 * `medicines` and `medicine_schedules`.
 *
 * Persistence foundation for Phase 5. Deletion is soft by default so historical
 * activity rows keep their meaning (`docs/02_FEATURE_BEHAVIOR_SPEC.md` §2.5).
 */

const MEDICINE_COLUMNS = `
  id, name, dosage, instructions, notes, color_key, active,
  start_date, end_date, archived_at, created_at, updated_at
`;

const SCHEDULE_COLUMNS = `
  id, medicine_id, time_of_day, repeat_type, days_of_week, enabled, created_at, updated_at
`;

function mapMedicine(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage,
    instructions: row.instructions,
    notes: row.notes,
    colorKey: row.color_key,
    active: row.active === 1,
    startDate: row.start_date,
    endDate: row.end_date,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSchedule(row) {
  if (!row) return null;
  return {
    id: row.id,
    medicineId: row.medicine_id,
    timeOfDay: row.time_of_day,
    repeatType: row.repeat_type,
    daysOfWeek: row.days_of_week ? JSON.parse(row.days_of_week) : null,
    enabled: row.enabled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* -------------------------------------------------------------------------- */
/* Medicines                                                                  */
/* -------------------------------------------------------------------------- */

export async function createMedicine(input, executor) {
  const db = await resolveExecutor(executor);
  const id = input.id ?? createId();
  const timestamp = nowIso();

  await db.runAsync(
    `INSERT INTO medicines (
       id, name, dosage, instructions, notes, color_key, active,
       start_date, end_date, archived_at, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?);`,
    [
      id,
      input.name,
      input.dosage ?? null,
      input.instructions ?? null,
      input.notes ?? null,
      input.colorKey ?? null,
      input.active === false ? 0 : 1,
      input.startDate ? toCalendarDate(input.startDate) : null,
      input.endDate ? toCalendarDate(input.endDate) : null,
      timestamp,
      timestamp,
    ]
  );

  return getMedicine(id, db);
}

const UPDATABLE_FIELDS = {
  name: 'name',
  dosage: 'dosage',
  instructions: 'instructions',
  notes: 'notes',
  colorKey: 'color_key',
  active: 'active',
  startDate: 'start_date',
  endDate: 'end_date',
};

export async function updateMedicine(id, changes, executor) {
  const db = await resolveExecutor(executor);

  const assignments = [];
  const params = [];

  for (const [key, column] of Object.entries(UPDATABLE_FIELDS)) {
    if (!(key in changes)) continue;
    assignments.push(`${column} = ?`);

    if (key === 'active') params.push(changes.active ? 1 : 0);
    else if (key === 'startDate' || key === 'endDate') {
      params.push(changes[key] ? toCalendarDate(changes[key]) : null);
    } else params.push(changes[key] ?? null);
  }

  if (assignments.length === 0) return getMedicine(id, db);

  assignments.push('updated_at = ?');
  params.push(nowIso(), id);

  await db.runAsync(`UPDATE medicines SET ${assignments.join(', ')} WHERE id = ?;`, params);
  return getMedicine(id, db);
}

export async function getMedicine(id, executor) {
  const db = await resolveExecutor(executor);
  const row = await db.getFirstAsync(`SELECT ${MEDICINE_COLUMNS} FROM medicines WHERE id = ?;`, [
    id,
  ]);
  return mapMedicine(row);
}

export async function getActiveMedicines(executor) {
  const db = await resolveExecutor(executor);
  const rows = await db.getAllAsync(
    `SELECT ${MEDICINE_COLUMNS} FROM medicines
     WHERE active = 1 AND archived_at IS NULL ORDER BY name COLLATE NOCASE ASC;`
  );
  return rows.map(mapMedicine);
}

export async function getAllMedicines(options = {}, executor) {
  const db = await resolveExecutor(executor);
  const { includeArchived = false } = options;

  const sql = includeArchived
    ? `SELECT ${MEDICINE_COLUMNS} FROM medicines ORDER BY name COLLATE NOCASE ASC;`
    : `SELECT ${MEDICINE_COLUMNS} FROM medicines WHERE archived_at IS NULL
       ORDER BY name COLLATE NOCASE ASC;`;

  const rows = await db.getAllAsync(sql);
  return rows.map(mapMedicine);
}

export async function countActiveMedicines(executor) {
  const db = await resolveExecutor(executor);
  const row = await db.getFirstAsync(
    'SELECT COUNT(*) AS total FROM medicines WHERE active = 1 AND archived_at IS NULL;'
  );
  return row?.total ?? 0;
}

export async function setMedicineActive(id, active, executor) {
  return updateMedicine(id, { active }, executor);
}

/** Soft delete: history keeps its meaning, future scheduling stops. */
export async function archiveMedicine(id, executor) {
  const db = await resolveExecutor(executor);
  const timestamp = nowIso();
  await db.runAsync(
    'UPDATE medicines SET archived_at = ?, active = 0, updated_at = ? WHERE id = ?;',
    [timestamp, timestamp, id]
  );
  return getMedicine(id, db);
}

/* -------------------------------------------------------------------------- */
/* Schedules                                                                  */
/* -------------------------------------------------------------------------- */

export async function createMedicineSchedule(input, executor) {
  const db = await resolveExecutor(executor);
  const id = input.id ?? createId();
  const timestamp = nowIso();

  await db.runAsync(
    `INSERT INTO medicine_schedules (
       id, medicine_id, time_of_day, repeat_type, days_of_week, enabled, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      input.medicineId,
      input.timeOfDay,
      input.repeatType ?? 'DAILY',
      input.daysOfWeek ? JSON.stringify(input.daysOfWeek) : null,
      input.enabled === false ? 0 : 1,
      timestamp,
      timestamp,
    ]
  );

  return getMedicineScheduleById(id, db);
}

export async function getMedicineScheduleById(id, executor) {
  const db = await resolveExecutor(executor);
  const row = await db.getFirstAsync(
    `SELECT ${SCHEDULE_COLUMNS} FROM medicine_schedules WHERE id = ?;`,
    [id]
  );
  return mapSchedule(row);
}

export async function getMedicineSchedules(medicineId, executor) {
  const db = await resolveExecutor(executor);
  const rows = await db.getAllAsync(
    `SELECT ${SCHEDULE_COLUMNS} FROM medicine_schedules
     WHERE medicine_id = ? ORDER BY time_of_day ASC;`,
    [medicineId]
  );
  return rows.map(mapSchedule);
}

export async function updateMedicineSchedule(id, changes, executor) {
  const db = await resolveExecutor(executor);

  const assignments = [];
  const params = [];

  if ('timeOfDay' in changes) {
    assignments.push('time_of_day = ?');
    params.push(changes.timeOfDay);
  }
  if ('repeatType' in changes) {
    assignments.push('repeat_type = ?');
    params.push(changes.repeatType);
  }
  if ('daysOfWeek' in changes) {
    assignments.push('days_of_week = ?');
    params.push(changes.daysOfWeek ? JSON.stringify(changes.daysOfWeek) : null);
  }
  if ('enabled' in changes) {
    assignments.push('enabled = ?');
    params.push(changes.enabled ? 1 : 0);
  }

  if (assignments.length === 0) return getMedicineScheduleById(id, db);

  assignments.push('updated_at = ?');
  params.push(nowIso(), id);

  await db.runAsync(
    `UPDATE medicine_schedules SET ${assignments.join(', ')} WHERE id = ?;`,
    params
  );
  return getMedicineScheduleById(id, db);
}

export async function deleteMedicineSchedule(id, executor) {
  const db = await resolveExecutor(executor);
  const result = await db.runAsync('DELETE FROM medicine_schedules WHERE id = ?;', [id]);
  return (result.changes ?? 0) > 0;
}

/** One query for the Phase 5 occurrence generator and today's dose list. */
export async function getActiveMedicinesWithSchedules(executor) {
  const db = await resolveExecutor(executor);
  const medicines = await getActiveMedicines(db);
  if (medicines.length === 0) return [];

  const rows = await db.getAllAsync(
    `SELECT ${SCHEDULE_COLUMNS} FROM medicine_schedules WHERE enabled = 1 ORDER BY time_of_day ASC;`
  );
  const schedules = rows.map(mapSchedule);

  return medicines.map((medicine) => ({
    ...medicine,
    schedules: schedules.filter((schedule) => schedule.medicineId === medicine.id),
  }));
}
