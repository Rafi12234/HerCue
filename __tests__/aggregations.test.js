import { endOfWeek, endOfYear, startOfWeek, startOfYear } from 'date-fns';

import {
  BUCKET,
  busiestBucket,
  completionRate,
  seriesForType,
  summariseActivities,
} from '../src/services/analytics/aggregations';

const activity = (type, status, occurredAt) => ({ type, status, occurredAt });

const WEEK_START = startOfWeek(new Date(2026, 8, 9), { weekStartsOn: 1 });
const WEEK_END = endOfWeek(new Date(2026, 8, 9), { weekStartsOn: 1 });

describe('completionRate', () => {
  it('is null when nothing has resolved, rather than a misleading zero', () => {
    expect(completionRate({ completed: 0, missed: 0, skipped: 0, snoozed: 3 })).toBeNull();
  });

  it('counts missed and skipped against completion', () => {
    expect(completionRate({ completed: 2, missed: 1, skipped: 1, snoozed: 0 })).toBe(0.5);
  });

  it('excludes snoozes, which are a step rather than an outcome', () => {
    expect(completionRate({ completed: 1, missed: 0, skipped: 0, snoozed: 9 })).toBe(1);
  });
});

describe('summariseActivities', () => {
  it('reports an empty range honestly', () => {
    const summary = summariseActivities([], { start: WEEK_START, end: WEEK_END });
    expect(summary.hasData).toBe(false);
    expect(summary.totals.total).toBe(0);
    expect(summary.completionRate).toBeNull();
  });

  it('tallies totals by status', () => {
    const summary = summariseActivities(
      [
        activity('WATER', 'COMPLETED', new Date(2026, 8, 9, 9)),
        activity('WATER', 'COMPLETED', new Date(2026, 8, 9, 11)),
        activity('FOOD', 'MISSED', new Date(2026, 8, 10, 13)),
        activity('MEDICINE', 'SKIPPED', new Date(2026, 8, 11, 21)),
      ],
      { start: WEEK_START, end: WEEK_END }
    );

    expect(summary.totals).toMatchObject({ completed: 2, missed: 1, skipped: 1, total: 4 });
    expect(summary.completionRate).toBe(0.5);
  });

  it('splits counts per category', () => {
    const summary = summariseActivities(
      [
        activity('WATER', 'COMPLETED', new Date(2026, 8, 9, 9)),
        activity('BATHROOM', 'COMPLETED', new Date(2026, 8, 9, 10)),
      ],
      { start: WEEK_START, end: WEEK_END }
    );

    expect(summary.byType.WATER.completed).toBe(1);
    expect(summary.byType.BATHROOM.completed).toBe(1);
    expect(summary.byType.MEDICINE.completed).toBe(0);
  });

  it('creates one bucket per day across a week', () => {
    const summary = summariseActivities([], { start: WEEK_START, end: WEEK_END });
    expect(summary.buckets).toHaveLength(7);
  });

  it('creates one bucket per month across a year', () => {
    const summary = summariseActivities([], {
      start: startOfYear(new Date(2026, 0, 1)),
      end: endOfYear(new Date(2026, 0, 1)),
      granularity: BUCKET.MONTH,
    });
    expect(summary.buckets).toHaveLength(12);
  });

  it('places each activity in the bucket for its local day', () => {
    const summary = summariseActivities(
      [
        activity('WATER', 'COMPLETED', new Date(2026, 8, 9, 23, 55)),
        activity('WATER', 'COMPLETED', new Date(2026, 8, 10, 0, 5)),
      ],
      { start: WEEK_START, end: WEEK_END }
    );

    const withData = summary.buckets.filter((b) => b.counts.completed > 0);
    expect(withData).toHaveLength(2);
  });

  it('ignores activity outside the range', () => {
    const summary = summariseActivities(
      [activity('WATER', 'COMPLETED', new Date(2026, 7, 1, 9))],
      { start: WEEK_START, end: WEEK_END }
    );
    expect(summary.buckets.every((b) => b.counts.total === 0)).toBe(true);
  });
});

describe('seriesForType and busiestBucket', () => {
  const summary = summariseActivities(
    [
      activity('WATER', 'COMPLETED', new Date(2026, 8, 9, 9)),
      activity('WATER', 'COMPLETED', new Date(2026, 8, 9, 11)),
      activity('WATER', 'COMPLETED', new Date(2026, 8, 10, 9)),
    ],
    { start: WEEK_START, end: WEEK_END }
  );

  it('produces one plottable point per bucket', () => {
    expect(seriesForType(summary)).toHaveLength(7);
  });

  it('finds the bucket with the most confirmations', () => {
    expect(busiestBucket(summary).counts.completed).toBe(2);
  });
});
