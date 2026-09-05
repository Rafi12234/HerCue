import {
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfDay,
  endOfMonth,
  format,
  isWithinInterval,
  startOfDay,
  startOfMonth,
} from 'date-fns';

import { REMINDER_TYPE_LIST } from '../../constants/reminderTypes';
import { ACTIVITY_SOURCE, OCCURRENCE_STATUS } from '../../constants/statuses';

/**
 * Pure aggregation over stored activity rows.
 *
 * Counts only what was recorded — there is no modelling or interpolation here,
 * and nothing is described as good or bad (`docs/08_ACTIVITY_AND_ANALYTICS.md` §5).
 */

export const BUCKET = {
  DAY: 'DAY',
  MONTH: 'MONTH',
};

function emptyCounts() {
  return { completed: 0, missed: 0, skipped: 0, snoozed: 0, manual: 0, total: 0 };
}

function tally(counts, activity) {
  switch (activity.status) {
    case OCCURRENCE_STATUS.COMPLETED:
      counts.completed += 1;
      break;
    case OCCURRENCE_STATUS.MISSED:
      counts.missed += 1;
      break;
    case OCCURRENCE_STATUS.SKIPPED:
      counts.skipped += 1;
      break;
    case OCCURRENCE_STATUS.SNOOZED:
      counts.snoozed += 1;
      break;
    default:
      break;
  }

  if (activity.source === ACTIVITY_SOURCE.MANUAL) counts.manual += 1;
  counts.total += 1;
}

/**
 * Completed ÷ resolved, over *scheduled* reminders only.
 *
 * Manual confirmations are excluded from both sides: logging water from Home
 * answers no reminder, so counting it would inflate the rate (doc 08 §H5).
 * Snoozes are excluded too — a snooze is a step towards an outcome, and the
 * child occurrence it creates carries the real result.
 */
export function completionRate(counts) {
  const scheduledCompleted = counts.completed - counts.manual;
  const resolved = scheduledCompleted + counts.missed + counts.skipped;
  return resolved <= 0 ? null : Math.max(0, scheduledCompleted) / resolved;
}

function emptyTypeCounts() {
  return Object.fromEntries(REMINDER_TYPE_LIST.map((type) => [type, emptyCounts()]));
}

function buildBuckets(start, end, granularity) {
  if (granularity === BUCKET.MONTH) {
    return eachMonthOfInterval({ start, end }).map((month) => ({
      key: format(month, 'yyyy-MM'),
      label: format(month, 'LLL'),
      start: startOfMonth(month),
      end: endOfMonth(month),
      counts: emptyCounts(),
      byType: emptyTypeCounts(),
    }));
  }

  return eachDayOfInterval({ start, end }).map((day) => ({
    key: format(day, 'yyyy-MM-dd'),
    label: format(day, 'EEEEE'),
    start: startOfDay(day),
    end: endOfDay(day),
    counts: emptyCounts(),
    byType: emptyTypeCounts(),
  }));
}

/**
 * A snoozed reminder resolves through the child occurrence it created, so the
 * parent's SNOOZED row is dropped once a later row for the same occurrence
 * chain exists. Without this one reminder would be counted twice.
 */
function withoutSupersededSnoozes(activities) {
  const resolvedOccurrences = new Set(
    activities
      .filter((activity) => activity.status !== OCCURRENCE_STATUS.SNOOZED && activity.occurrenceId)
      .map((activity) => activity.occurrenceId)
  );

  return activities.filter(
    (activity) =>
      activity.status !== OCCURRENCE_STATUS.SNOOZED ||
      !activity.occurrenceId ||
      !resolvedOccurrences.has(activity.occurrenceId)
  );
}

export function summariseActivities(activities = [], { start, end, granularity = BUCKET.DAY } = {}) {
  const totals = emptyCounts();
  const byType = Object.fromEntries(REMINDER_TYPE_LIST.map((type) => [type, emptyCounts()]));
  const buckets = buildBuckets(start, end, granularity);
  const rows = withoutSupersededSnoozes(activities);

  for (const activity of rows) {
    const occurredAt = new Date(activity.occurredAt);

    tally(totals, activity);
    if (byType[activity.type]) tally(byType[activity.type], activity);

    const bucket = buckets.find((entry) =>
      isWithinInterval(occurredAt, { start: entry.start, end: entry.end })
    );
    if (bucket) {
      tally(bucket.counts, activity);
      if (bucket.byType[activity.type]) tally(bucket.byType[activity.type], activity);
    }
  }

  return {
    totals,
    byType,
    buckets,
    completionRate: completionRate(totals),
    hasData: totals.total > 0,
  };
}

/**
 * Per-bucket completed counts, ready to plot. Passing a type narrows the series
 * to that category so the chart can be switched without re-querying.
 */
export function seriesForType(summary, type = null) {
  return summary.buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    value: type ? (bucket.byType?.[type]?.completed ?? 0) : bucket.counts.completed,
  }));
}

export function busiestBucket(summary) {
  return summary.buckets.reduce(
    (best, bucket) => (bucket.counts.completed > (best?.counts.completed ?? -1) ? bucket : best),
    null
  );
}
