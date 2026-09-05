import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { OCCURRENCE_STATUS } from '../../constants/statuses';
import { toDate } from '../../utils/dates';

/**
 * Derives "what matters next" from the dashboard view-model.
 *
 * Home only renders the result — the choosing happens here so the same rule can
 * be reused by the notification deep-link handler in Phase 9.
 */

function candidate(type, title, detail, at) {
  const date = toDate(at);
  return date ? { type, title, detail, at: date } : null;
}

export function selectNextMedicineDose(medicine) {
  if (!medicine?.doses?.length) return null;

  return medicine.doses
    .filter((dose) => dose.status === OCCURRENCE_STATUS.PENDING)
    .map((dose) => ({ dose, at: toDate(dose.scheduledAt) }))
    .filter((entry) => entry.at)
    .sort((a, b) => a.at - b.at)[0]?.dose ?? null;
}

export function selectNextReminder(data, now = new Date()) {
  if (!data) return null;

  const nextDose = selectNextMedicineDose(data.medicine);

  const candidates = [
    data.water?.enabled &&
      candidate(REMINDER_TYPES.WATER, 'Water', 'Time for a few sips', data.water.nextReminderAt),
    nextDose &&
      candidate(
        REMINDER_TYPES.MEDICINE,
        nextDose.name,
        nextDose.dosage || nextDose.instruction || 'Medicine',
        nextDose.scheduledAt
      ),
    data.bathroom?.enabled &&
      candidate(
        REMINDER_TYPES.BATHROOM,
        'Bathroom',
        'A gentle check-in',
        data.bathroom.nextReminderAt
      ),
    data.food?.enabled &&
      candidate(REMINDER_TYPES.FOOD, 'Food', 'Have you eaten anything?', data.food.nextCheckAt),
  ].filter(Boolean);

  const upcoming = candidates.filter((entry) => entry.at >= now).sort((a, b) => a.at - b.at);
  if (upcoming.length > 0) return { ...upcoming[0], isOverdue: false };

  // Nothing ahead: surface the most recently passed one so Home is never blank
  // while reminders are switched on.
  const passed = candidates.sort((a, b) => b.at - a.at);
  return passed.length > 0 ? { ...passed[0], isOverdue: true } : null;
}

export function selectWaterProgress(water) {
  if (!water?.goal) return 0;
  return Math.max(0, Math.min(1, water.count / water.goal));
}

export function selectMedicineProgress(medicine) {
  if (!medicine?.scheduledCount) return 0;
  return Math.max(0, Math.min(1, medicine.takenCount / medicine.scheduledCount));
}

export function selectHasAnyCareData(data) {
  if (!data) return false;
  return Boolean(
    data.water?.enabled ||
      data.medicine?.scheduledCount ||
      data.bathroom?.enabled ||
      data.food?.enabled ||
      data.period?.lastStartDate
  );
}
