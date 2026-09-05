import { differenceInMilliseconds } from 'date-fns';

import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { ACTIVITY_ACTION, ACTIVITY_SOURCE, OCCURRENCE_STATUS } from '../../constants/statuses';
import { withTransaction } from '../../database/db';
import {
  createActivity,
  getLatestActivityByType,
} from '../../database/repositories/activityRepository';
import { markOccurrenceCompleted } from '../../database/repositories/reminderRepository';
import { LOG_CATEGORY, logger } from '../../utils/logger';

/**
 * Care confirmations — the write path behind every Home quick action.
 *
 * Each one persists to SQLite inside a transaction before the UI is allowed to
 * show success, so a confirmation the user sees is always a confirmation that
 * was stored.
 */

/**
 * Notification actions can be delivered more than once and a fast double tap
 * can outrun the button's own guard, so an identical confirmation inside this
 * window resolves to the existing row instead of writing a second one.
 */
const DUPLICATE_WINDOW_MS = 2500;

async function isDuplicate(type, action, at, executor) {
  const latest = await getLatestActivityByType(type, { action }, executor);
  if (!latest) return false;
  return Math.abs(differenceInMilliseconds(at, new Date(latest.occurredAt))) < DUPLICATE_WINDOW_MS;
}

async function confirm({ type, action, occurrenceId, medicineId, source, at, valueNumeric }) {
  const occurredAt = at ?? new Date();

  try {
    const result = await withTransaction(async (db) => {
      if (await isDuplicate(type, action, occurredAt, db)) {
        return { duplicate: true, activity: null };
      }

      // The occurrence records what was meant to happen; the activity records
      // what the user actually did. Both must move together.
      if (occurrenceId) {
        await markOccurrenceCompleted(occurrenceId, occurredAt, db);
      }

      const activity = await createActivity(
        {
          type,
          action,
          status: OCCURRENCE_STATUS.COMPLETED,
          occurredAt,
          occurrenceId: occurrenceId ?? null,
          medicineId: medicineId ?? null,
          valueNumeric: valueNumeric ?? null,
          source: source ?? ACTIVITY_SOURCE.MANUAL,
        },
        db
      );

      return { duplicate: false, activity };
    });

    if (result.duplicate) {
      logger.debug(LOG_CATEGORY.UI, `Ignored duplicate ${type} confirmation`);
      return { ok: true, duplicate: true, activity: null };
    }

    logger.info(LOG_CATEGORY.DB, `${type} ${action} recorded`);
    return { ok: true, duplicate: false, activity: result.activity };
  } catch (error) {
    logger.error(LOG_CATEGORY.DB, `Could not record ${type} ${action}`, error);
    return { ok: false, message: 'Something went wrong saving that. Please try again.' };
  }
}

export function completeWater(options = {}) {
  return confirm({
    type: REMINDER_TYPES.WATER,
    action: ACTIVITY_ACTION.DRANK,
    valueNumeric: 1,
    ...options,
  });
}

export function completeFood(options = {}) {
  return confirm({
    type: REMINDER_TYPES.FOOD,
    action: ACTIVITY_ACTION.ATE,
    ...options,
  });
}

export function completeBathroom(options = {}) {
  return confirm({
    type: REMINDER_TYPES.BATHROOM,
    action: ACTIVITY_ACTION.WENT,
    ...options,
  });
}

/** Ready for Phase 5; the medicine UI that calls it does not exist yet. */
export function completeMedicine({ medicineId, occurrenceId = null, ...options }) {
  return confirm({
    type: REMINDER_TYPES.MEDICINE,
    action: ACTIVITY_ACTION.TAKEN,
    occurrenceId,
    medicineId,
    ...options,
  });
}
