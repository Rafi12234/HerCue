import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { withTransaction } from '../../database/db';
import {
  archiveMedicine,
  createMedicine,
  createMedicineSchedule,
  deleteMedicineSchedule,
  getActiveMedicinesWithSchedules,
  getAllMedicines,
  getMedicine,
  getMedicineSchedules,
  setMedicineActive,
  updateMedicine,
} from '../../database/repositories/medicineRepository';
import { cancelFutureOccurrences } from '../../database/repositories/reminderRepository';
import { LOG_CATEGORY, logger } from '../../utils/logger';
import { reminderScheduler } from '../reminder/reminderScheduler';

/**
 * Medicine domain service.
 *
 * Any change to a medicine or its times invalidates future alarms, so every
 * mutation here ends the same way: cancel obsolete future occurrences, then
 * reconcile. Past history is never touched (doc 02 §2.5).
 */

export function validateMedicine({ name, times, startDate, endDate }) {
  const errors = {};

  if (!name || !name.trim()) errors.name = 'Give the medicine a name.';
  if (!times || times.length === 0) errors.times = 'Add at least one time.';
  if (startDate && endDate && endDate < startDate) {
    errors.endDate = 'The end date can’t be before the start date.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

async function replaceSchedules(medicineId, times, repeatType, daysOfWeek, db) {
  const existing = await getMedicineSchedules(medicineId, db);
  for (const schedule of existing) {
    await deleteMedicineSchedule(schedule.id, db);
  }

  for (const timeOfDay of times) {
    await createMedicineSchedule(
      { medicineId, timeOfDay, repeatType, daysOfWeek: daysOfWeek ?? null },
      db
    );
  }
}

export async function saveMedicine(input) {
  const { valid, errors } = validateMedicine(input);
  if (!valid) return { ok: false, errors };

  const repeatType = input.daysOfWeek?.length ? 'DAYS_OF_WEEK' : 'DAILY';
  const times = [...new Set(input.times)].sort();

  try {
    const medicine = await withTransaction(async (db) => {
      const saved = input.id
        ? await updateMedicine(
            input.id,
            {
              name: input.name.trim(),
              dosage: input.dosage?.trim() || null,
              instructions: input.instructions?.trim() || null,
              startDate: input.startDate ?? null,
              endDate: input.endDate ?? null,
              active: input.active !== false,
            },
            db
          )
        : await createMedicine(
            {
              name: input.name.trim(),
              dosage: input.dosage?.trim() || null,
              instructions: input.instructions?.trim() || null,
              startDate: input.startDate ?? null,
              endDate: input.endDate ?? null,
              active: input.active !== false,
            },
            db
          );

      await replaceSchedules(saved.id, times, repeatType, input.daysOfWeek, db);

      // The old times must not keep firing after an edit.
      if (input.id) {
        await cancelFutureOccurrences({ medicineId: saved.id }, new Date(), db);
      }

      return saved;
    });

    await reminderScheduler.reconcile('medicine-saved');
    logger.info(LOG_CATEGORY.DB, `Medicine saved (${times.length} time(s))`);
    return { ok: true, medicine };
  } catch (error) {
    logger.error(LOG_CATEGORY.DB, 'Could not save medicine', error);
    return { ok: false, message: 'Couldn’t save that medicine. Please try again.' };
  }
}

export async function setActive(medicineId, active) {
  try {
    await withTransaction(async (db) => {
      await setMedicineActive(medicineId, active, db);
      if (!active) await cancelFutureOccurrences({ medicineId }, new Date(), db);
    });

    await reminderScheduler.reconcile('medicine-toggled');
    return { ok: true };
  } catch (error) {
    logger.error(LOG_CATEGORY.DB, 'Could not change medicine state', error);
    return { ok: false, message: 'Couldn’t update that medicine.' };
  }
}

/** Soft delete: alarms stop, history keeps its meaning. */
export async function archive(medicineId) {
  try {
    await withTransaction(async (db) => {
      await archiveMedicine(medicineId, db);
      await cancelFutureOccurrences({ medicineId }, new Date(), db);
    });

    await reminderScheduler.reconcile('medicine-archived');
    return { ok: true };
  } catch (error) {
    logger.error(LOG_CATEGORY.DB, 'Could not archive medicine', error);
    return { ok: false, message: 'Couldn’t remove that medicine.' };
  }
}

export async function listMedicines() {
  const [all, withSchedules] = await Promise.all([
    getAllMedicines(),
    getActiveMedicinesWithSchedules(),
  ]);

  const scheduleMap = new Map(withSchedules.map((entry) => [entry.id, entry.schedules]));
  return all.map((medicine) => ({
    ...medicine,
    schedules: scheduleMap.get(medicine.id) ?? [],
  }));
}

export async function loadMedicine(medicineId) {
  const [medicine, schedules] = await Promise.all([
    getMedicine(medicineId),
    getMedicineSchedules(medicineId),
  ]);
  if (!medicine) return null;
  return { ...medicine, schedules };
}

export const MEDICINE_TYPE = REMINDER_TYPES.MEDICINE;
