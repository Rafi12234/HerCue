import {
  buildCycleHistory,
  calculateAverageCycleLength,
  calculateCycleLengths,
  estimateNextPeriod,
  getCycleSummary,
} from '../src/services/period/periodCalculator';

const cycle = (startDate, endDate = null) => ({ id: startDate, startDate, endDate });

describe('calculateCycleLengths', () => {
  it('returns nothing for a single cycle, because there is no gap to measure', () => {
    expect(calculateCycleLengths([cycle('2026-08-12')])).toEqual([]);
  });

  it('measures the gap between consecutive starts', () => {
    const lengths = calculateCycleLengths([cycle('2026-08-12'), cycle('2026-09-09')]);
    expect(lengths).toHaveLength(1);
    expect(lengths[0].lengthDays).toBe(28);
  });

  it('orders unsorted input before measuring', () => {
    const lengths = calculateCycleLengths([cycle('2026-09-09'), cycle('2026-08-12')]);
    expect(lengths[0].lengthDays).toBe(28);
  });

  it('flags implausible gaps instead of dropping the user data', () => {
    const lengths = calculateCycleLengths([cycle('2026-08-12'), cycle('2026-08-14')]);
    expect(lengths[0].lengthDays).toBe(2);
    expect(lengths[0].isPlausible).toBe(false);
  });
});

describe('calculateAverageCycleLength', () => {
  it('is null with too little history to average', () => {
    expect(calculateAverageCycleLength([cycle('2026-08-12')])).toBeNull();
  });

  it('averages the observed gaps', () => {
    const cycles = [cycle('2026-06-01'), cycle('2026-06-29'), cycle('2026-07-29')];
    expect(calculateAverageCycleLength(cycles)).toBe(29);
  });

  it('excludes implausible gaps from the average', () => {
    const cycles = [cycle('2026-06-01'), cycle('2026-06-03'), cycle('2026-07-01')];
    expect(calculateAverageCycleLength(cycles)).toBe(28);
  });

  it('only uses the most recent cycles', () => {
    const cycles = [
      cycle('2026-01-01'),
      cycle('2026-02-10'), // 40 days, older and excluded by the window
      cycle('2026-03-10'), // 28
      cycle('2026-04-07'), // 28
    ];
    expect(calculateAverageCycleLength(cycles, { maxCycles: 2 })).toBe(28);
  });
});

describe('estimateNextPeriod', () => {
  it('has no estimate without history', () => {
    expect(estimateNextPeriod([]).estimatedStartDate).toBeNull();
  });

  it('falls back to the configured average for a single cycle', () => {
    const result = estimateNextPeriod([cycle('2026-08-12')], { defaultCycleLength: 28 });
    expect(result.estimatedStartDate).toBe('2026-09-09');
    expect(result.isFallback).toBe(true);
  });

  it('prefers the observed average once history exists', () => {
    const result = estimateNextPeriod([cycle('2026-06-01'), cycle('2026-07-01')], {
      defaultCycleLength: 28,
    });
    expect(result.averageCycleLengthDays).toBe(30);
    expect(result.estimatedStartDate).toBe('2026-07-31');
    expect(result.isFallback).toBe(false);
  });
});

describe('getCycleSummary', () => {
  it('reports genuinely empty history without inventing values', () => {
    const summary = getCycleSummary([]);
    expect(summary).toMatchObject({
      lastStartDate: null,
      cycleCount: 0,
      estimatedNextDate: null,
      averageCycleLengthDays: null,
    });
  });

  it('summarises the newest cycle and the observed range', () => {
    const cycles = [
      cycle('2026-06-01', '2026-06-05'),
      cycle('2026-06-29'),
      cycle('2026-07-29'),
    ];
    const summary = getCycleSummary(cycles);
    expect(summary.lastStartDate).toBe('2026-07-29');
    expect(summary.cycleCount).toBe(3);
    expect(summary.shortestCycleDays).toBe(28);
    expect(summary.longestCycleDays).toBe(30);
  });
});

describe('buildCycleHistory', () => {
  it('lists newest first and omits the length of the earliest cycle', () => {
    const history = buildCycleHistory([cycle('2026-08-12'), cycle('2026-09-09')]);
    expect(history.map((entry) => entry.startDate)).toEqual(['2026-09-09', '2026-08-12']);
    expect(history[0].cycleLengthDays).toBe(28);
    expect(history[1].cycleLengthDays).toBeNull();
  });
});
