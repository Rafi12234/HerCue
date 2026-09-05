import {
  addDays,
  addMonths,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isAfter,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

/**
 * Range maths for the Activity screen.
 *
 * All boundaries are computed in local time, so an event at 12:05 AM belongs to
 * the new local day rather than the previous UTC one.
 */

export const ACTIVITY_VIEWS = {
  DAY: 'DAY',
  WEEK: 'WEEK',
  MONTH: 'MONTH',
  YEAR: 'YEAR',
};

export const ACTIVITY_VIEW_OPTIONS = [
  { value: ACTIVITY_VIEWS.DAY, label: 'Day' },
  { value: ACTIVITY_VIEWS.WEEK, label: 'Week' },
  { value: ACTIVITY_VIEWS.MONTH, label: 'Month' },
  { value: ACTIVITY_VIEWS.YEAR, label: 'Year' },
];

const WEEK_OPTIONS = { weekStartsOn: 1 };

export function buildRange(view, anchor = new Date(), now = new Date()) {
  switch (view) {
    case ACTIVITY_VIEWS.WEEK: {
      const start = startOfWeek(anchor, WEEK_OPTIONS);
      const end = endOfWeek(anchor, WEEK_OPTIONS);
      return {
        start,
        end,
        label: `${format(start, 'd MMM')} – ${format(end, 'd MMM')}`,
        canGoForward: isAfter(now, end),
      };
    }
    case ACTIVITY_VIEWS.MONTH: {
      const start = startOfMonth(anchor);
      const end = endOfMonth(anchor);
      return { start, end, label: format(anchor, 'MMMM yyyy'), canGoForward: isAfter(now, end) };
    }
    case ACTIVITY_VIEWS.YEAR: {
      const start = startOfYear(anchor);
      const end = endOfYear(anchor);
      return { start, end, label: format(anchor, 'yyyy'), canGoForward: isAfter(now, end) };
    }
    case ACTIVITY_VIEWS.DAY:
    default: {
      const start = startOfDay(anchor);
      const end = endOfDay(anchor);
      const isToday = format(anchor, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
      return {
        start,
        end,
        label: isToday ? 'Today' : format(anchor, 'EEEE, d MMM'),
        canGoForward: isAfter(now, end),
      };
    }
  }
}

export function shiftAnchor(view, anchor, direction) {
  switch (view) {
    case ACTIVITY_VIEWS.WEEK:
      return addDays(anchor, 7 * direction);
    case ACTIVITY_VIEWS.MONTH:
      return addMonths(anchor, direction);
    case ACTIVITY_VIEWS.YEAR:
      return addYears(anchor, direction);
    case ACTIVITY_VIEWS.DAY:
    default:
      return addDays(anchor, direction);
  }
}

/** Wording per view for the empty state — factual, never a "health score". */
export const VIEW_EMPTY_COPY = {
  [ACTIVITY_VIEWS.DAY]: {
    title: 'Your day is just getting started.',
    message: 'Each water, meal, medicine and bathroom confirmation will appear here in order.',
  },
  [ACTIVITY_VIEWS.WEEK]: {
    title: 'No records for this week yet',
    message: 'Once reminders are running, this shows routine completion day by day.',
  },
  [ACTIVITY_VIEWS.MONTH]: {
    title: 'No records for this month yet',
    message: 'Monthly totals and category breakdowns build up from what you confirm.',
  },
  [ACTIVITY_VIEWS.YEAR]: {
    title: 'No records for this year yet',
    message: 'A month-by-month view appears once there is history to summarise.',
  },
};
