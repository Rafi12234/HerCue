import { differenceInCalendarDays, parseISO } from 'date-fns';

import { ACTIVITY_ACTION, ACTIVITY_SOURCE, OCCURRENCE_STATUS } from '../../constants/statuses';
import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { withTransaction } from '../../database/db';
import { createActivity } from '../../database/repositories/activityRepository';
import {
  createPeriodCycle,
  getCycleByStartDate,
  getPeriodCycles,
} from '../../database/repositories/periodRepository';
import { toCalendarDate } from '../../utils/dates';
import { LOG_CATEGORY, logger } from '../../utils/logger';
import { getCycleSummary, buildCycleHistory } from './periodCalculator';
import { loadSettings } from '../settings/settingsService';

/**
 * Period domain service.
 *
 * Owns validation and orchestration; the maths lives in `periodCalculator` and
 * the SQL in `periodRepository`.
 */

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
    return { ok: true, alreadyRecorded: false, cycle };
  } catch (error) {
    logger.error(LOG_CATEGORY.PERIOD, 'Could not record period start', error);
    return { ok: false, message: 'Something went wrong saving that. Please try again.' };
  }
}
