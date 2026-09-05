import { addMinutes, addDays, subDays, subMinutes } from 'date-fns';

import { DEFAULTS } from '../constants/config';
import { OCCURRENCE_STATUS } from '../constants/statuses';
import { toCalendarDate } from '../utils/dates';

/**
 * DEVELOPMENT-ONLY preview data for Home.
 *
 * Phase 1 has no repositories yet. Rather than scattering placeholder values
 * through JSX, everything lives here behind `USE_PREVIEW_DASHBOARD`, is
 * generated relative to "now" so it always reads sensibly, and is surfaced in
 * the UI with a visible "Preview data" marker.
 *
 * Delete this file once Phase 2 wires the real repositories in.
 */
export function buildPreviewDashboard(now = new Date()) {
  const lastWater = subMinutes(now, 96);
  const lastMeal = subMinutes(now, 214);
  const lastBathroom = subMinutes(now, 61);
  const lastPeriodStart = subDays(now, 24);

  return {
    source: 'PREVIEW',
    generatedAt: now.toISOString(),

    water: {
      count: 5,
      goal: DEFAULTS.waterDailyGoal,
      lastConfirmedAt: lastWater.toISOString(),
      nextReminderAt: addMinutes(now, 24).toISOString(),
      enabled: true,
    },

    medicine: {
      takenCount: 2,
      scheduledCount: 3,
      doses: [
        {
          id: 'preview-dose-1',
          name: 'Napa',
          dosage: '1 tablet',
          instruction: 'After food',
          scheduledAt: subMinutes(now, 340).toISOString(),
          status: OCCURRENCE_STATUS.COMPLETED,
        },
        {
          id: 'preview-dose-2',
          name: 'Vitamin D',
          dosage: '1 capsule',
          instruction: 'With water',
          scheduledAt: subMinutes(now, 130).toISOString(),
          status: OCCURRENCE_STATUS.COMPLETED,
        },
        {
          id: 'preview-dose-3',
          name: 'Iron supplement',
          dosage: '1 tablet',
          instruction: 'After dinner',
          scheduledAt: addMinutes(now, 268).toISOString(),
          status: OCCURRENCE_STATUS.PENDING,
        },
      ],
      enabled: true,
    },

    bathroom: {
      lastConfirmedAt: lastBathroom.toISOString(),
      nextReminderAt: addMinutes(lastBathroom, DEFAULTS.bathroomIntervalMinutes).toISOString(),
      enabled: true,
    },

    food: {
      lastConfirmedAt: lastMeal.toISOString(),
      nextCheckAt: addMinutes(lastMeal, DEFAULTS.foodIntervalMinutes).toISOString(),
      intervalMinutes: DEFAULTS.foodIntervalMinutes,
      enabled: true,
    },

    period: {
      lastStartDate: toCalendarDate(lastPeriodStart),
      lastEndDate: toCalendarDate(addDays(lastPeriodStart, 4)),
      estimatedNextDate: toCalendarDate(addDays(lastPeriodStart, DEFAULTS.averageCycleLengthDays)),
      averageCycleLengthDays: DEFAULTS.averageCycleLengthDays,
      cycleCount: 4,
    },
  };
}
