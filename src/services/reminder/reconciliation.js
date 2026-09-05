import { addHours, addMinutes, isBefore, subMinutes } from 'date-fns';

import { SCHEDULING } from '../../constants/config';
import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { ACTIVITY_ACTION, ACTIVITY_SOURCE, OCCURRENCE_STATUS } from '../../constants/statuses';
import { withTransaction } from '../../database/db';
import {
  createActivity,
  getLatestActivityByType,
} from '../../database/repositories/activityRepository';
import { getActiveMedicinesWithSchedules } from '../../database/repositories/medicineRepository';
import {
  clearNativeScheduleId,
  createOccurrence,
  getOccurrencesForRange,
  getPendingOccurrences,
  updateOccurrenceStatus,
} from '../../database/repositories/reminderRepository';
import { LOG_CATEGORY, logger } from '../../utils/logger';
import { getPeriodOverview } from '../period/periodService';
import { getAllReminderConfigs, getQuietHours, loadSettings } from '../settings/settingsService';
import { generateExpectedOccurrences } from './occurrenceGenerator';

/**
 * Reconciliation — the single place that decides which alarms should exist.
 *
 * Idempotent by construction: occurrences are keyed deterministically and
 * inserted with ON CONFLICT DO NOTHING, and the native layer keys alarms by the
 * same occurrence id. Running this twice changes nothing the second time.
 */

const MISSED_ACTION = {
  [REMINDER_TYPES.WATER]: ACTIVITY_ACTION.MISSED,
  [REMINDER_TYPES.MEDICINE]: ACTIVITY_ACTION.MISSED,
  [REMINDER_TYPES.FOOD]: ACTIVITY_ACTION.MISSED,
  [REMINDER_TYPES.BATHROOM]: ACTIVITY_ACTION.MISSED,
};

async function loadLastCompletions() {
  const [food, bathroom] = await Promise.all([
    getLatestActivityByType(REMINDER_TYPES.FOOD, { action: ACTIVITY_ACTION.ATE }),
    getLatestActivityByType(REMINDER_TYPES.BATHROOM, { action: ACTIVITY_ACTION.WENT }),
  ]);

  return {
    [REMINDER_TYPES.FOOD]: food?.occurredAt ?? null,
    [REMINDER_TYPES.BATHROOM]: bathroom?.occurredAt ?? null,
  };
}

/**
 * An occurrence nobody answered becomes MISSED — a dismissed notification is
 * never treated as a completion (doc 05 §15).
 *
 * Period nudges are excluded: they are informational and carry no action, so
 * "missing" one means nothing and would only clutter the history.
 */
async function sweepMissed(now) {
  const cutoff = subMinutes(now, SCHEDULING.missedAfterMinutes);
  const stale = (await getPendingOccurrences({ before: cutoff })).filter(
    (occurrence) => occurrence.type !== REMINDER_TYPES.PERIOD
  );
  if (stale.length === 0) return 0;

  for (const occurrence of stale) {
    await withTransaction(async (db) => {
      await updateOccurrenceStatus(occurrence.id, OCCURRENCE_STATUS.MISSED, {}, db);
      await createActivity(
        {
          type: occurrence.type,
          action: MISSED_ACTION[occurrence.type] ?? ACTIVITY_ACTION.MISSED,
          status: OCCURRENCE_STATUS.MISSED,
          occurredAt: occurrence.scheduledAt,
          scheduledAt: occurrence.scheduledAt,
          occurrenceId: occurrence.id,
          medicineId: occurrence.medicineId,
          source: ACTIVITY_SOURCE.SYSTEM,
        },
        db
      );
    });
  }

  logger.info(LOG_CATEGORY.SCHEDULER, `Marked ${stale.length} occurrence(s) MISSED`);
  return stale.length;
}

/**
 * @param schedulePort injected so this module stays testable without the
 *   native alarm layer attached.
 */
export async function reconcileOccurrences({ schedulePort, reason = 'unspecified', now = new Date() }) {
  logger.debug(LOG_CATEGORY.SCHEDULER, `Reconciliation started (${reason})`);

  const missedCount = await sweepMissed(now);

  const [configs, medicines, quietHours, lastCompletions, settings, period] = await Promise.all([
    getAllReminderConfigs(),
    getActiveMedicinesWithSchedules(),
    getQuietHours(),
    loadLastCompletions(),
    loadSettings(),
    getPeriodOverview(),
  ]);

  const until = addHours(now, SCHEDULING.horizonHours);

  const expected = generateExpectedOccurrences({
    definitions: configs,
    medicines,
    lastCompletions,
    quietHours,
    period: {
      enabled: settings.periodRemindersEnabled,
      estimatedNextDate: period.estimatedNextDate,
      daysBefore: settings.periodRemindDaysBefore,
      remindAt: settings.periodRemindTime,
    },
    now,
    until,
  });
  const expectedByKey = new Map(expected.map((entry) => [entry.occurrenceKey, entry]));

  const stored = await getOccurrencesForRange(now, until);
  const storedByKey = new Map(stored.map((entry) => [entry.occurrenceKey, entry]));

  let created = 0;
  for (const candidate of expected) {
    if (storedByKey.has(candidate.occurrenceKey)) continue;
    const row = await createOccurrence(candidate);
    if (row) {
      storedByKey.set(row.occurrenceKey, row);
      created += 1;
    }
  }

  // Snooze children are never regenerated, so they must survive the diff.
  let cancelled = 0;
  for (const occurrence of stored) {
    const isOrphaned =
      !expectedByKey.has(occurrence.occurrenceKey) && occurrence.parentOccurrenceId == null;
    const isOpen =
      occurrence.status === OCCURRENCE_STATUS.PENDING ||
      occurrence.status === OCCURRENCE_STATUS.TRIGGERED;

    if (!isOrphaned || !isOpen) continue;

    await updateOccurrenceStatus(occurrence.id, OCCURRENCE_STATUS.CANCELLED);
    await schedulePort.cancel(occurrence.id);
    storedByKey.delete(occurrence.occurrenceKey);
    cancelled += 1;
  }

  // Anything already cancelled in SQL by a domain service (a medicine edit, for
  // example) may still hold a live Android alarm. Sweeping them here is what
  // stops ghost reminders firing for a schedule the user changed.
  let ghostsCleared = 0;
  for (const occurrence of stored) {
    if (occurrence.status !== OCCURRENCE_STATUS.CANCELLED) continue;
    if (!occurrence.nativeScheduleId) continue;

    await schedulePort.cancel(occurrence.id);
    await clearNativeScheduleId(occurrence.id);
    ghostsCleared += 1;
  }

  const scheduleContext = { settings, definitions: configs };

  let scheduled = 0;
  let inexact = 0;
  for (const occurrence of storedByKey.values()) {
    if (occurrence.status !== OCCURRENCE_STATUS.PENDING) continue;
    if (isBefore(new Date(occurrence.scheduledAt), now)) continue;

    const result = await schedulePort.schedule(occurrence, scheduleContext);
    if (result === 'exact') scheduled += 1;
    else if (result === 'inexact') {
      scheduled += 1;
      inexact += 1;
    }
  }

  const summary = { created, cancelled, ghostsCleared, scheduled, inexact, missed: missedCount };
  logger.info(
    LOG_CATEGORY.SCHEDULER,
    `Reconciliation complete (${reason}): ${JSON.stringify(summary)}`
  );
  return summary;
}

/** Snooze: the original is resolved and a linked child carries the new time. */
export async function createSnoozeOccurrence({ occurrence, minutes, now = new Date() }) {
  const scheduledAt = addMinutes(now, minutes);

  return withTransaction(async (db) => {
    await updateOccurrenceStatus(occurrence.id, OCCURRENCE_STATUS.SNOOZED, {}, db);

    await createActivity(
      {
        type: occurrence.type,
        action: ACTIVITY_ACTION.SNOOZED,
        status: OCCURRENCE_STATUS.SNOOZED,
        occurredAt: now,
        scheduledAt: occurrence.scheduledAt,
        occurrenceId: occurrence.id,
        medicineId: occurrence.medicineId,
        source: ACTIVITY_SOURCE.REMINDER_ACTION,
      },
      db
    );

    const child = await createOccurrence(
      {
        occurrenceKey: `${occurrence.id}:snooze:${scheduledAt.toISOString()}`,
        type: occurrence.type,
        scheduledAt,
        definitionId: occurrence.definitionId,
        medicineId: occurrence.medicineId,
        medicineScheduleId: occurrence.medicineScheduleId,
        parentOccurrenceId: occurrence.id,
        message: occurrence.message,
        metadata: occurrence.metadata,
      },
      db
    );

    return child;
  });
}
