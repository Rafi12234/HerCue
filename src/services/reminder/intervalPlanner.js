import { addDays, addMinutes, isBefore, startOfDay } from 'date-fns';

import { applyScheduleTime, toDate } from '../../utils/dates';

/**
 * Pure scheduling maths for the interval-driven reminders (food, bathroom).
 *
 * This decides *when* the next check is due. It does not schedule anything —
 * the platform alarm lands in Phase 3/4 and will consume these values.
 */

function minutesIntoDay(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function scheduleTimeToMinutes(scheduleTime) {
  const [hours, minutes] = String(scheduleTime).split(':').map(Number);
  return hours * 60 + minutes;
}

/** Anchored to the actual confirmation time, per doc 02 §4.2. */
export function nextFromLastCompletion(lastCompletedAt, intervalMinutes) {
  const last = toDate(lastCompletedAt);
  if (!last || !intervalMinutes) return null;
  return addMinutes(last, intervalMinutes);
}

/**
 * Quiet hours normally wrap midnight (22:30 → 07:30), so the window is
 * "at or after start OR before end" rather than a simple between.
 */
export function isWithinQuietHours(date, quietHours) {
  if (!quietHours?.enabled || !quietHours.start || !quietHours.end) return false;

  const target = toDate(date);
  if (!target) return false;

  const current = minutesIntoDay(target);
  const start = scheduleTimeToMinutes(quietHours.start);
  const end = scheduleTimeToMinutes(quietHours.end);

  if (start === end) return false;
  return start > end ? current >= start || current < end : current >= start && current < end;
}

/** Pushes a reminder that lands inside quiet hours out to the moment they end. */
export function applyQuietHours(date, quietHours) {
  if (!isWithinQuietHours(date, quietHours)) return toDate(date);

  const target = toDate(date);
  const endToday = applyScheduleTime(quietHours.end, target);

  // Before the window's end on the same calendar day means we are in the
  // early-morning tail of a window that began yesterday.
  if (isBefore(target, endToday)) return endToday;
  return applyScheduleTime(quietHours.end, addDays(startOfDay(target), 1));
}

/**
 * Next interval check.
 *
 * With no recorded completion there is no anchor, so nothing is returned rather
 * than inventing a "last meal" the user never confirmed.
 */
export function planNextCheck({ lastCompletedAt, intervalMinutes, quietHours = null }) {
  const raw = nextFromLastCompletion(lastCompletedAt, intervalMinutes);
  if (!raw) return { at: null, deferredByQuietHours: false };

  const adjusted = applyQuietHours(raw, quietHours);
  return {
    at: adjusted,
    deferredByQuietHours: adjusted.getTime() !== raw.getTime(),
  };
}

/**
 * Next slot on a fixed grid (water): active-window start, stepped by interval.
 *
 * Unlike food and bathroom this is not anchored to the last confirmation, so a
 * slot exists even before the user has confirmed anything today.
 */
export function nextFixedIntervalSlot({
  activeStartTime,
  activeEndTime,
  intervalMinutes,
  from = new Date(),
}) {
  if (!activeStartTime || !activeEndTime || !intervalMinutes) return null;

  const windowStart = applyScheduleTime(activeStartTime, from);
  const windowEnd = applyScheduleTime(activeEndTime, from);

  // A window ending before it starts would loop forever; treat it as unset.
  if (!isBefore(windowStart, windowEnd)) return null;

  for (
    let slot = windowStart;
    !isBefore(windowEnd, slot);
    slot = addMinutes(slot, intervalMinutes)
  ) {
    if (isBefore(from, slot)) return slot;
  }

  return applyScheduleTime(activeStartTime, addDays(startOfDay(from), 1));
}
