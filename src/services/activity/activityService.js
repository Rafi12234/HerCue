import { endOfDay, startOfDay } from 'date-fns';

import { REMINDER_TYPE_META } from '../../constants/reminderTypes';
import { ACTIVITY_ACTION_LABELS, OCCURRENCE_STATUS } from '../../constants/statuses';
import {
  countActivities,
  getActivitiesForRange,
} from '../../database/repositories/activityRepository';
import { BUCKET, summariseActivities } from '../analytics/aggregations';
import { ACTIVITY_VIEWS } from '../analytics/ranges';

/**
 * Activity read model.
 *
 * Day is a literal timeline; the wider views are aggregations of the same rows.
 * Nothing is estimated — an empty range reports itself as empty.
 */

function toTimelineItem(activity) {
  return {
    id: activity.id,
    type: activity.type,
    typeLabel: REMINDER_TYPE_META[activity.type]?.label ?? activity.type,
    actionLabel: ACTIVITY_ACTION_LABELS[activity.action] ?? activity.action,
    status: activity.status,
    occurredAt: activity.occurredAt,
    scheduledAt: activity.scheduledAt,
    source: activity.source,
    valueText: activity.valueText,
  };
}

export async function getDayTimeline(date = new Date()) {
  const activities = await getActivitiesForRange(startOfDay(date), endOfDay(date), {
    order: 'ASC',
  });

  const items = activities.map(toTimelineItem);

  return {
    items,
    completedCount: items.filter((item) => item.status === OCCURRENCE_STATUS.COMPLETED).length,
    totalCount: items.length,
  };
}

export async function countActivitiesInRange(start, end) {
  return countActivities({ start, end });
}

/** Week and month bucket by day; year buckets by month. */
export async function getRangeSummary(view, range) {
  const activities = await getActivitiesForRange(range.start, range.end, { order: 'ASC' });

  return summariseActivities(activities, {
    start: range.start,
    end: range.end,
    granularity: view === ACTIVITY_VIEWS.YEAR ? BUCKET.MONTH : BUCKET.DAY,
  });
}
