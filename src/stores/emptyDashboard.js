import { DEFAULTS } from '../constants/config';

/**
 * Fallback shape used before hydration and if a read fails.
 *
 * Mirrors what `dashboardService.buildDashboard` returns so screens never have
 * to guard against two different shapes — genuine empty states, no zeros
 * pretending to be history.
 */
export function buildEmptyDashboard(now = new Date()) {
  return {
    source: 'EMPTY',
    generatedAt: now.toISOString(),

    water: {
      count: 0,
      goal: DEFAULTS.waterDailyGoal,
      lastConfirmedAt: null,
      nextReminderAt: null,
      enabled: false,
      intervalMinutes: null,
    },
    medicine: {
      takenCount: 0,
      scheduledCount: 0,
      doses: [],
      enabled: false,
      medicineCount: 0,
    },
    bathroom: {
      lastConfirmedAt: null,
      nextReminderAt: null,
      enabled: false,
      intervalMinutes: null,
    },
    food: {
      lastConfirmedAt: null,
      nextCheckAt: null,
      intervalMinutes: DEFAULTS.foodIntervalMinutes,
      enabled: false,
    },
    period: {
      lastStartDate: null,
      lastEndDate: null,
      estimatedNextDate: null,
      averageCycleLengthDays: null,
      cycleCount: 0,
      isFallbackEstimate: false,
      daysUntilEstimate: null,
    },
  };
}
