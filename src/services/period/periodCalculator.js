import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

import { DEFAULTS } from '../../constants/config';
import { ISO_DATE_FORMAT } from '../../utils/dates';

/**
 * Pure cycle maths. No database, no React, no side effects — this is the file
 * the tests exercise directly.
 *
 * Cycle length is the gap between the start dates of consecutive periods
 * (`docs/09_PERIOD_TRACKER_SPEC.md` §3). Everything here works in date-only
 * "yyyy-MM-dd" values so a timezone shift can never move a cycle by a day.
 */

/** Guards against typos and impossible history skewing the average. */
const MIN_PLAUSIBLE_CYCLE_DAYS = 10;
const MAX_PLAUSIBLE_CYCLE_DAYS = 90;

function sortByStartAscending(cycles) {
  return [...cycles]
    .filter((cycle) => Boolean(cycle?.startDate))
    .sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0));
}

/**
 * Gaps between consecutive recorded starts, oldest first.
 * The earliest cycle has no predecessor, so it yields no length.
 */
export function calculateCycleLengths(cycles = []) {
  const ordered = sortByStartAscending(cycles);

  return ordered.slice(1).map((cycle, index) => {
    const previous = ordered[index];
    const lengthDays = differenceInCalendarDays(
      parseISO(cycle.startDate),
      parseISO(previous.startDate)
    );
    return {
      cycleId: cycle.id ?? null,
      startDate: cycle.startDate,
      previousStartDate: previous.startDate,
      lengthDays,
      isPlausible: lengthDays >= MIN_PLAUSIBLE_CYCLE_DAYS && lengthDays <= MAX_PLAUSIBLE_CYCLE_DAYS,
    };
  });
}

/**
 * Mean of the most recent plausible cycle lengths.
 * Returns null when there is nothing to average — callers decide the fallback.
 */
export function calculateAverageCycleLength(cycles = [], options = {}) {
  const { maxCycles = DEFAULTS.cyclesUsedForEstimate } = options;

  const plausible = calculateCycleLengths(cycles).filter((entry) => entry.isPlausible);
  if (plausible.length === 0) return null;

  const recent = plausible.slice(-maxCycles);
  const total = recent.reduce((sum, entry) => sum + entry.lengthDays, 0);
  return Math.round(total / recent.length);
}

/**
 * Estimated next start date.
 *
 * With one recorded cycle there is nothing to average, so the user's configured
 * average is used and the result is flagged `isFallback` — the UI leans on that
 * to keep its wording appropriately tentative.
 */
export function estimateNextPeriod(cycles = [], options = {}) {
  const {
    defaultCycleLength = DEFAULTS.averageCycleLengthDays,
    maxCycles = DEFAULTS.cyclesUsedForEstimate,
  } = options;

  const ordered = sortByStartAscending(cycles);
  if (ordered.length === 0) {
    return {
      estimatedStartDate: null,
      averageCycleLengthDays: null,
      basedOnCycleCount: 0,
      isFallback: false,
    };
  }

  const observedAverage = calculateAverageCycleLength(ordered, { maxCycles });
  const cycleLength = observedAverage ?? defaultCycleLength;
  const lastStart = ordered[ordered.length - 1].startDate;

  return {
    estimatedStartDate: format(addDays(parseISO(lastStart), cycleLength), ISO_DATE_FORMAT),
    averageCycleLengthDays: cycleLength,
    basedOnCycleCount: observedAverage === null ? 0 : Math.min(ordered.length - 1, maxCycles),
    isFallback: observedAverage === null,
  };
}

/** Everything the Period screen and Home card need, derived in one pass. */
export function getCycleSummary(cycles = [], options = {}) {
  const ordered = sortByStartAscending(cycles);
  const latest = ordered[ordered.length - 1] ?? null;
  const lengths = calculateCycleLengths(ordered).filter((entry) => entry.isPlausible);
  const estimate = estimateNextPeriod(ordered, options);

  return {
    lastStartDate: latest?.startDate ?? null,
    lastEndDate: latest?.endDate ?? null,
    cycleCount: ordered.length,
    averageCycleLengthDays: estimate.averageCycleLengthDays,
    estimatedNextDate: estimate.estimatedStartDate,
    isFallbackEstimate: estimate.isFallback,
    shortestCycleDays: lengths.length ? Math.min(...lengths.map((e) => e.lengthDays)) : null,
    longestCycleDays: lengths.length ? Math.max(...lengths.map((e) => e.lengthDays)) : null,
  };
}

/** Newest first, with the gap to the previous start attached for the history list. */
export function buildCycleHistory(cycles = []) {
  const lengths = new Map(
    calculateCycleLengths(cycles).map((entry) => [entry.startDate, entry.lengthDays])
  );

  return sortByStartAscending(cycles)
    .reverse()
    .map((cycle) => ({
      ...cycle,
      cycleLengthDays: lengths.get(cycle.startDate) ?? null,
    }));
}
