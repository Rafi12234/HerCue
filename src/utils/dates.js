import {
  addMinutes,
  differenceInCalendarDays,
  differenceInMinutes,
  format,
  isToday,
  isTomorrow,
  isYesterday,
  parse,
  startOfDay,
} from 'date-fns';

/**
 * Three distinct time concepts live in this app and must not be mixed:
 *  - instant        → ISO-8601 UTC string, an exact moment ("2026-09-05T14:30:00.000Z")
 *  - schedule time  → local wall clock "HH:mm", no date attached
 *  - calendar date  → "yyyy-MM-dd", for period cycles and day grouping
 */

export const ISO_DATE_FORMAT = 'yyyy-MM-dd';
export const CLOCK_FORMAT = 'HH:mm';

export function nowIso() {
  return new Date().toISOString();
}

export function toIso(date) {
  return date instanceof Date ? date.toISOString() : date;
}

export function toDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') return new Date(value);
  return null;
}

export function toCalendarDate(value) {
  const date = toDate(value);
  return date ? format(date, ISO_DATE_FORMAT) : null;
}

/** Parse a local "HH:mm" schedule value onto a given day. */
export function applyScheduleTime(scheduleTime, onDate = new Date()) {
  return parse(scheduleTime, CLOCK_FORMAT, startOfDay(onDate));
}

export function formatClock(value) {
  const date = toDate(value);
  return date ? format(date, 'h:mm a') : '';
}

/** "8:00 AM" from a stored "08:00" schedule value. */
export function formatScheduleTime(scheduleTime) {
  if (!scheduleTime) return '';
  return format(applyScheduleTime(scheduleTime), 'h:mm a');
}

export function formatFullDate(value = new Date()) {
  const date = toDate(value);
  return date ? format(date, 'EEEE, d MMMM') : '';
}

export function formatShortDate(value) {
  const date = toDate(value);
  return date ? format(date, 'd MMM') : '';
}

export function formatMonthYear(value) {
  const date = toDate(value);
  return date ? format(date, 'MMMM yyyy') : '';
}

/** "Today" / "Yesterday" / "Tomorrow" / "3 Sep" — for section headers. */
export function formatDayLabel(value) {
  const date = toDate(value);
  if (!date) return '';
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'd MMM');
}

function humaniseMinutes(totalMinutes) {
  if (totalMinutes < 1) return 'less than a minute';
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours < 24) {
    return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
  }

  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day' : `${days} days`;
}

/** "in 24 min" for the future, "2 hr ago" for the past, "just now" at the edge. */
export function formatRelativeToNow(value, now = new Date()) {
  const date = toDate(value);
  if (!date) return '';

  const minutes = differenceInMinutes(date, now);
  if (minutes === 0) return 'just now';
  if (minutes > 0) return `in ${humaniseMinutes(minutes)}`;
  return `${humaniseMinutes(Math.abs(minutes))} ago`;
}

/** Compact form for tight card space: "24m", "2h 10m", "3d". */
export function formatCompactDistance(value, now = new Date()) {
  const date = toDate(value);
  if (!date) return '';

  const minutes = Math.abs(differenceInMinutes(date, now));
  if (minutes < 60) return `${Math.max(minutes, 1)}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rest = minutes % 60;
    return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
  }
  return `${Math.floor(hours / 24)}d`;
}

export function daysBetweenCalendarDates(from, to) {
  const start = toDate(from);
  const end = toDate(to);
  if (!start || !end) return null;
  return differenceInCalendarDays(end, start);
}

export function addMinutesToNow(minutes) {
  return addMinutes(new Date(), minutes);
}

export function isSameLocalDay(a, b) {
  const first = toDate(a);
  const second = toDate(b);
  if (!first || !second) return false;
  return differenceInCalendarDays(first, second) === 0;
}

/** Greeting bucket for the Home header. */
export function greetingForDate(value = new Date()) {
  const hour = toDate(value).getHours();
  if (hour < 5) return 'Still awake';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}
