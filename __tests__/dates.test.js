import { endOfDay, startOfDay } from 'date-fns';

import {
  daysBetweenCalendarDates,
  formatRelativeToNow,
  isSameLocalDay,
  toCalendarDate,
} from '../src/utils/dates';

describe('toCalendarDate', () => {
  it('produces a date-only value in local time', () => {
    expect(toCalendarDate(new Date(2026, 8, 6, 14, 30))).toBe('2026-09-06');
  });

  it('keeps an event just after local midnight on the new day', () => {
    expect(toCalendarDate(new Date(2026, 8, 6, 0, 5))).toBe('2026-09-06');
  });

  it('keeps an event just before local midnight on the old day', () => {
    expect(toCalendarDate(new Date(2026, 8, 6, 23, 55))).toBe('2026-09-06');
  });
});

describe('local day boundaries', () => {
  it('brackets a whole local day', () => {
    const day = new Date(2026, 8, 6, 13, 0);
    expect(startOfDay(day).getHours()).toBe(0);
    expect(endOfDay(day).getHours()).toBe(23);
    expect(toCalendarDate(startOfDay(day))).toBe('2026-09-06');
    expect(toCalendarDate(endOfDay(day))).toBe('2026-09-06');
  });

  it('treats 12:05 AM as the new day, not the previous one', () => {
    const justAfterMidnight = new Date(2026, 8, 6, 0, 5);
    expect(isSameLocalDay(justAfterMidnight, new Date(2026, 8, 5, 23, 55))).toBe(false);
    expect(isSameLocalDay(justAfterMidnight, new Date(2026, 8, 6, 9, 0))).toBe(true);
  });
});

describe('daysBetweenCalendarDates', () => {
  it('counts calendar days regardless of time of day', () => {
    expect(daysBetweenCalendarDates(new Date(2026, 8, 6, 23, 0), new Date(2026, 8, 7, 1, 0))).toBe(
      1
    );
  });

  it('is negative once the date has passed', () => {
    expect(daysBetweenCalendarDates(new Date(2026, 8, 9), new Date(2026, 8, 6))).toBe(-3);
  });

  it('crosses a month end correctly', () => {
    expect(daysBetweenCalendarDates(new Date(2026, 7, 30), new Date(2026, 8, 2))).toBe(3);
  });

  it('handles a leap day', () => {
    expect(daysBetweenCalendarDates(new Date(2028, 1, 28), new Date(2028, 2, 1))).toBe(2);
  });
});

describe('formatRelativeToNow', () => {
  const now = new Date(2026, 8, 6, 12, 0);

  it('describes the near future', () => {
    expect(formatRelativeToNow(new Date(2026, 8, 6, 12, 24), now)).toBe('in 24 min');
  });

  it('describes the past', () => {
    expect(formatRelativeToNow(new Date(2026, 8, 6, 10, 0), now)).toBe('2 hr ago');
  });

  it('collapses the boundary to "just now"', () => {
    expect(formatRelativeToNow(now, now)).toBe('just now');
  });
});
