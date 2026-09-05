import { endOfDay, startOfDay } from 'date-fns';

import { REMINDER_TYPE_META } from '../../constants/reminderTypes';
import { ACTIVITY_ACTION_LABELS, OCCURRENCE_STATUS } from '../../constants/statuses';
import {
  countActivities,
  getActivitiesForRange,
} from '../../database/repositories/activityRepository';

/**
 * Activity read model.
 *
 * Day is real in this phase because it is the cheapest honest way to prove that
 * writes persisted. Week/month/year aggregation is Phase 10 and stays absent
 * rather than being approximated.
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
