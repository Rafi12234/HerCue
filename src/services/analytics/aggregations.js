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
import { OCCURRENCE_STATUS } from '../../constants/statuses';

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
  return { completed: 0, missed: 0, skipped: 0, snoozed: 0, total: 0 };
}

function tally(counts, status) {
  switch (status) {
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
  counts.total += 1;
}

/**
 * Completed ÷ resolved. Snoozes are excluded because they are a step on the way
 * to an outcome, not an outcome; counting them would double-count the reminder.
 */
export function completionRate(counts) {
  const resolved = counts.completed + counts.missed + counts.skipped;
  return resolved === 0 ? null : counts.completed / resolved;
}

function buildBuckets(start, end, granularity) {
  if (granularity === BUCKET.MONTH) {
    return eachMonthOfInterval({ start, end }).map((month) => ({
      key: format(month, 'yyyy-MM'),
      label: format(month, 'LLL'),
      start: startOfMonth(month),
      end: endOfMonth(month),
      counts: emptyCounts(),
    }));
  }

  return eachDayOfInterval({ start, end }).map((day) => ({
    key: format(day, 'yyyy-MM-dd'),
    label: format(day, 'EEEEE'),
    start: startOfDay(day),
    end: endOfDay(day),
    counts: emptyCounts(),
  }));
}

export function summariseActivities(activities = [], { start, end, granularity = BUCKET.DAY } = {}) {
  const totals = emptyCounts();
  const byType = Object.fromEntries(REMINDER_TYPE_LIST.map((type) => [type, emptyCounts()]));
  const buckets = buildBuckets(start, end, granularity);

  for (const activity of activities) {
    const occurredAt = new Date(activity.occurredAt);

    tally(totals, activity.status);
    if (byType[activity.type]) tally(byType[activity.type], activity.status);

    const bucket = buckets.find((entry) =>
      isWithinInterval(occurredAt, { start: entry.start, end: entry.end })
    );
    if (bucket) tally(bucket.counts, activity.status);
  }

  return {
    totals,
    byType,
    buckets,
    completionRate: completionRate(totals),
    hasData: totals.total > 0,
  };
}

/** Per-bucket completed counts, ready to plot. */
export function seriesForType(summary) {
  return summary.buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    value: bucket.counts.completed,
  }));
}

export function busiestBucket(summary) {
  return summary.buckets.reduce(
    (best, bucket) => (bucket.counts.completed > (best?.counts.completed ?? -1) ? bucket : best),
    null
  );
}
