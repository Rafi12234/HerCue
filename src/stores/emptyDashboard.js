import { DEFAULTS } from '../constants/config';

/** Shape used by Home before any data exists — genuine empty states, no zeros pretending to be history. */
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
    },
    medicine: {
      takenCount: 0,
      scheduledCount: 0,
      doses: [],
      enabled: false,
    },
    bathroom: {
      lastConfirmedAt: null,
      nextReminderAt: null,
      enabled: false,
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
    },
  };
}
