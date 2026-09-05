import { addDays, addMinutes, isAfter, isBefore, parseISO, startOfDay } from 'date-fns';

import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { applyScheduleTime, toCalendarDate } from '../../utils/dates';
import { occurrenceKey } from '../../utils/occurrenceKeys';
import { applyQuietHours, isWithinQuietHours } from './intervalPlanner';
import { buildReminderMessage } from './reminderMessages';

/**
 * Expected-occurrence generation.
 *
 * Pure: given configuration and a moment, it returns the occurrences that
 * *should* exist. Reconciliation diffs this against the database, which is what
 * makes running it twice harmless.
 */

function makeOccurrence({ type, scheduledAt, ownerId, definitionId, medicine, schedule }) {
  const scheduledIso = scheduledAt.toISOString();
  const message = buildReminderMessage(type, {
    name: medicine?.name,
    dosage: medicine?.dosage,
    instruction: medicine?.instructions,
  });

  return {
    occurrenceKey: occurrenceKey(type, ownerId, scheduledIso),
    type,
    scheduledAt: scheduledIso,
    definitionId: definitionId ?? null,
    medicineId: medicine?.id ?? null,
    medicineScheduleId: schedule?.id ?? null,
    message: message.body,
    metadata: { title: message.title, speech: message.speech },
  };
}

/**
 * Water: a fixed grid inside the active window.
 *
 * Slots landing in quiet hours are dropped rather than deferred — deferring
 * would bunch the whole night's reminders onto the same morning minute.
 */
export function generateWaterOccurrences({ definition, from, until, quietHours }) {
  if (!definition?.enabled || !definition.intervalMinutes) return [];
  if (!definition.activeStartTime || !definition.activeEndTime) return [];

  const occurrences = [];

  for (let day = startOfDay(from); !isAfter(day, until); day = addDays(day, 1)) {
    const windowStart = applyScheduleTime(definition.activeStartTime, day);
    const windowEnd = applyScheduleTime(definition.activeEndTime, day);
    if (!isBefore(windowStart, windowEnd)) continue;

    for (
      let slot = windowStart;
      !isAfter(slot, windowEnd);
      slot = addMinutes(slot, definition.intervalMinutes)
    ) {
      if (isBefore(slot, from) || isAfter(slot, until)) continue;
      if (isWithinQuietHours(slot, quietHours)) continue;

      occurrences.push(
        makeOccurrence({
          type: REMINDER_TYPES.WATER,
          scheduledAt: slot,
          ownerId: definition.id,
          definitionId: definition.id,
        })
      );
    }
  }

  return occurrences;
}

function scheduleRunsOn(schedule, day) {
  if (schedule.repeatType !== 'DAYS_OF_WEEK') return true;
  if (!Array.isArray(schedule.daysOfWeek) || schedule.daysOfWeek.length === 0) return false;
  return schedule.daysOfWeek.includes(day.getDay());
}

function medicineActiveOn(medicine, day) {
  const date = toCalendarDate(day);
  if (medicine.startDate && date < medicine.startDate) return false;
  if (medicine.endDate && date > medicine.endDate) return false;
  return true;
}

/**
 * Medicine: one occurrence per enabled schedule per applicable day.
 *
 * Quiet hours are deliberately not applied — silently moving a medicine time
 * would change a medical schedule the user set (doc 02 §6.1).
 */
export function generateMedicineOccurrences({ medicines, from, until }) {
  const occurrences = [];

  for (const medicine of medicines ?? []) {
    if (!medicine.active || medicine.archivedAt) continue;

    for (let day = startOfDay(from); !isAfter(day, until); day = addDays(day, 1)) {
      if (!medicineActiveOn(medicine, day)) continue;

      for (const schedule of medicine.schedules ?? []) {
        if (!schedule.enabled || !scheduleRunsOn(schedule, day)) continue;

        const scheduledAt = applyScheduleTime(schedule.timeOfDay, day);
        if (isBefore(scheduledAt, from) || isAfter(scheduledAt, until)) continue;

        occurrences.push(
          makeOccurrence({
            type: REMINDER_TYPES.MEDICINE,
            scheduledAt,
            ownerId: schedule.id,
            medicine,
            schedule,
          })
        );
      }
    }
  }

  return occurrences;
}

/**
 * Food and bathroom: a single next check anchored to the last confirmation.
 *
 * With no confirmation there is no anchor, so nothing is generated — inventing
 * a "last meal" the user never logged would make the first reminder a lie.
 */
export function generateDynamicOccurrence({ definition, lastCompletedAt, quietHours, now }) {
  if (!definition?.enabled || !definition.intervalMinutes || !lastCompletedAt) return [];

  const anchor = typeof lastCompletedAt === 'string' ? parseISO(lastCompletedAt) : lastCompletedAt;
  const raw = addMinutes(anchor, definition.intervalMinutes);
  const scheduledAt = applyQuietHours(raw, quietHours);

  // A check whose time already passed while the app was closed is handled by
  // the missed sweep, not by scheduling an alarm in the past.
  if (isBefore(scheduledAt, now)) return [];

  return [
    makeOccurrence({
      type: definition.type,
      scheduledAt,
      ownerId: definition.id,
      definitionId: definition.id,
    }),
  ];
}

/**
 * Period: gentle informational nudges ahead of the estimated date.
 *
 * The estimate is not a fact, so these carry no actions and the copy stays
 * tentative (`docs/09_PERIOD_TRACKER_SPEC.md` §6).
 */
export function generatePeriodReminderOccurrences({
  estimatedNextDate,
  daysBefore = [3, 1, 0],
  remindAt = '09:00',
  enabled,
  from,
  until,
}) {
  if (!enabled || !estimatedNextDate) return [];

  const expected = parseISO(estimatedNextDate);

  return daysBefore
    .map((offset) => ({ offset, at: applyScheduleTime(remindAt, addDays(expected, -offset)) }))
    .filter(({ at }) => !isBefore(at, from) && !isAfter(at, until))
    .map(({ offset, at }) => {
      const message = buildReminderMessage(REMINDER_TYPES.PERIOD, { daysBefore: offset });
      return {
        occurrenceKey: occurrenceKey(REMINDER_TYPES.PERIOD, estimatedNextDate, at.toISOString()),
        type: REMINDER_TYPES.PERIOD,
        scheduledAt: at.toISOString(),
        definitionId: null,
        medicineId: null,
        medicineScheduleId: null,
        message: message.body,
        metadata: { title: message.title, speech: message.speech },
      };
    });
}

/** Everything expected across the horizon, for all categories. */
export function generateExpectedOccurrences({
  definitions,
  medicines,
  lastCompletions,
  quietHours,
  period,
  now,
  until,
}) {
  const water = definitions?.[REMINDER_TYPES.WATER];
  const food = definitions?.[REMINDER_TYPES.FOOD];
  const bathroom = definitions?.[REMINDER_TYPES.BATHROOM];

  return [
    ...generateWaterOccurrences({ definition: water, from: now, until, quietHours }),
    ...generateMedicineOccurrences({ medicines, from: now, until }),
    ...generateDynamicOccurrence({
      definition: food,
      lastCompletedAt: lastCompletions?.[REMINDER_TYPES.FOOD] ?? null,
      quietHours,
      now,
    }),
    ...generateDynamicOccurrence({
      definition: bathroom,
      lastCompletedAt: lastCompletions?.[REMINDER_TYPES.BATHROOM] ?? null,
      quietHours,
      now,
    }),
    ...generatePeriodReminderOccurrences({
      estimatedNextDate: period?.estimatedNextDate ?? null,
      daysBefore: period?.daysBefore,
      remindAt: period?.remindAt,
      enabled: period?.enabled,
      from: now,
      until,
    }),
  ];
}
