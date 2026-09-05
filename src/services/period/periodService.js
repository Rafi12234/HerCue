import { differenceInCalendarDays, parseISO } from 'date-fns';

import { ACTIVITY_ACTION, ACTIVITY_SOURCE, OCCURRENCE_STATUS } from '../../constants/statuses';
import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { withTransaction } from '../../database/db';
import { createActivity } from '../../database/repositories/activityRepository';
import {
  createPeriodCycle,
  deleteCycle,
  getCycleByStartDate,
  getLatestCycle,
  getPeriodCycles,
  updateCycle,
} from '../../database/repositories/periodRepository';
import { toCalendarDate } from '../../utils/dates';
import { LOG_CATEGORY, logger } from '../../utils/logger';
import { getCycleSummary, buildCycleHistory } from './periodCalculator';
import { reminderScheduler } from '../reminder/reminderScheduler';
import { loadSettings } from '../settings/settingsService';

/**
 * Period domain service.
 *
 * Owns validation and orchestration; the maths lives in `periodCalculator` and
 * the SQL in `periodRepository`.
 */

/**
 * Period nudges hang off the *estimated* date, so any change to history moves
 * them. Reconciliation regenerates them from the new estimate.
 */
export async function reschedulePeriodReminders(reason = 'period-changed') {
  return reminderScheduler.reconcile(reason);
}

export async function getPeriodOverview() {
  const [cycles, settings] = await Promise.all([getPeriodCycles(), loadSettings()]);

  const summary = getCycleSummary(cycles, {
    defaultCycleLength: settings.averageCycleLengthDays,
  });

  return {
    ...summary,
    history: buildCycleHistory(cycles),
    daysUntilEstimate: summary.estimatedNextDate
      ? differenceInCalendarDays(parseISO(summary.estimatedNextDate), new Date())
      : null,
  };
}

/**
 * Records a period start.
 *
 * A future date is refused rather than silently accepted (doc 09 §5), and a
 * repeat of an existing start date resolves to a no-op so a double tap cannot
 * create two cycles.
 */
export async function startPeriod(date = new Date()) {
  const startDate = toCalendarDate(date);

  if (differenceInCalendarDays(parseISO(startDate), new Date()) > 0) {
    return {
      ok: false,
      message: 'That date is in the future. Pick today or an earlier day.',
    };
  }

  const existing = await getCycleByStartDate(startDate);
  if (existing) {
    return { ok: true, alreadyRecorded: true, cycle: existing };
  }

  try {
    const cycle = await withTransaction(async (db) => {
      const created = await createPeriodCycle({ startDate, source: 'MANUAL' }, db);

      await createActivity(
        {
          type: REMINDER_TYPES.PERIOD,
          action: ACTIVITY_ACTION.STARTED,
          status: OCCURRENCE_STATUS.COMPLETED,
          occurredAt: new Date(),
          valueText: startDate,
          source: ACTIVITY_SOURCE.MANUAL,
        },
        db
      );

      return created;
    });

    logger.info(LOG_CATEGORY.PERIOD, `Period start recorded for ${startDate}`);
    await reschedulePeriodReminders('period-started');
    return { ok: true, alreadyRecorded: false, cycle };
  } catch (error) {
    logger.error(LOG_CATEGORY.PERIOD, 'Could not record period start', error);
    return { ok: false, message: 'Something went wrong saving that. Please try again.' };
  }
}

/** Marks the end of the most recent cycle. */
export async function endPeriod(date = new Date()) {
  const endDate = toCalendarDate(date);
  const latest = await getLatestCycle();

  if (!latest) {
    return { ok: false, message: 'There’s no cycle to close yet.' };
  }
  if (endDate < latest.startDate) {
    return { ok: false, message: 'The end date can’t be before the start date.' };
  }

  try {
    const cycle = await withTransaction(async (db) => {
      const updated = await updateCycle(latest.id, { endDate }, db);

      await createActivity(
        {
          type: REMINDER_TYPES.PERIOD,
          action: ACTIVITY_ACTION.ENDED,
          status: OCCURRENCE_STATUS.COMPLETED,
          occurredAt: new Date(),
          valueText: endDate,
          source: ACTIVITY_SOURCE.MANUAL,
        },
        db
      );

      return updated;
    });

    return { ok: true, cycle };
  } catch (error) {
    logger.error(LOG_CATEGORY.PERIOD, 'Could not record period end', error);
    return { ok: false, message: 'Something went wrong saving that. Please try again.' };
  }
}

/** Corrects an existing entry; every derived value is recalculated on read. */
export async function editCycle(cycleId, changes) {
  const startDate = changes.startDate ? toCalendarDate(changes.startDate) : null;
  const endDate = changes.endDate ? toCalendarDate(changes.endDate) : null;

  if (startDate && differenceInCalendarDays(parseISO(startDate), new Date()) > 0) {
    return { ok: false, message: 'That date is in the future.' };
  }
  if (startDate && endDate && endDate < startDate) {
    return { ok: false, message: 'The end date can’t be before the start date.' };
  }

  try {
    const cycle = await updateCycle(cycleId, {
      ...(startDate ? { startDate } : {}),
      ...('endDate' in changes ? { endDate } : {}),
    });
    await reschedulePeriodReminders('period-edited');
    return { ok: true, cycle };
  } catch (error) {
    logger.error(LOG_CATEGORY.PERIOD, 'Could not edit cycle', error);
    return { ok: false, message: 'Couldn’t update that entry.' };
  }
}

export async function removeCycle(cycleId) {
  try {
    await deleteCycle(cycleId);
    await reschedulePeriodReminders('period-deleted');
    return { ok: true };
  } catch (error) {
    logger.error(LOG_CATEGORY.PERIOD, 'Could not delete cycle', error);
    return { ok: false, message: 'Couldn’t remove that entry.' };
  }
}
