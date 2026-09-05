import { isSameDay, subDays } from 'date-fns';

import {
  getNotificationHistory,
  getUnreadCount,
  markAllRead,
  markRead,
} from '../../database/repositories/notificationRepository';

/**
 * Inbox read model.
 *
 * Grouping is real and driven by SQLite; it simply has nothing to group until
 * the reminder engine starts delivering (Phase 3/4).
 */

function groupLabel(deliveredAt, now) {
  const date = new Date(deliveredAt);
  if (isSameDay(date, now)) return 'Today';
  if (isSameDay(date, subDays(now, 1))) return 'Yesterday';
  return 'Earlier';
}

const GROUP_ORDER = ['Today', 'Yesterday', 'Earlier'];

export async function getInbox(options = {}, now = new Date()) {
  const [items, unreadCount] = await Promise.all([
    getNotificationHistory(options),
    getUnreadCount(),
  ]);

  const buckets = new Map();
  for (const item of items) {
    const label = groupLabel(item.deliveredAt, now);
    if (!buckets.has(label)) buckets.set(label, []);
    buckets.get(label).push(item);
  }

  const groups = GROUP_ORDER.filter((label) => buckets.has(label)).map((label) => ({
    label,
    items: buckets.get(label),
  }));

  return { groups, unreadCount, totalCount: items.length };
}

export { markRead, markAllRead };
