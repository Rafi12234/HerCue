import { endOfDay, startOfDay } from 'date-fns';

import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { ACTIVITY_ACTION, OCCURRENCE_STATUS } from '../../constants/statuses';
import {
  countActivitiesForDay,
  getActivitiesForRange,
  getLatestActivityByType,
} from '../../database/repositories/activityRepository';
import { getActiveMedicinesWithSchedules } from '../../database/repositories/medicineRepository';
import { getNextPendingOccurrence } from '../../database/repositories/reminderRepository';
import { applyScheduleTime } from '../../utils/dates';
import { getPeriodOverview } from '../period/periodService';
import { nextFixedIntervalSlot, planNextCheck } from '../reminder/intervalPlanner';
import { getAllReminderConfigs, loadSettings } from '../settings/settingsService';

/**
 * Builds the Home view-model from SQLite.
 *
 * Everything here is derived by query — there is no `home_dashboard` table to
 * keep in sync (`docs/06_DATABASE_AND_DATA_MODEL.md` §7).
 *
 * The `nextReminderAt` / `nextCheckAt` values are genuine domain data: they say
 * when a reminder is *due*. Delivery is a separate concern that arrives with the
 * Phase 3/4 scheduler, which will read these same rules.
 */

/** `days_of_week` is stored as JS `getDay()` numbers: 0 = Sunday. */
function scheduleAppliesToday(schedule, now) {
  if (schedule.repeatType !== 'DAYS_OF_WEEK') return true;
  if (!Array.isArray(schedule.daysOfWeek) || schedule.daysOfWeek.length === 0) return false;
  return schedule.daysOfWeek.includes(now.getDay());
}

async function buildMedicineSection(now) {
  const medicines = await getActiveMedicinesWithSchedules();

  if (medicines.length === 0) {
    return { takenCount: 0, scheduledCount: 0, doses: [], enabled: false, medicineCount: 0 };
  }

  const takenToday = await getActivitiesForRange(
    startOfDay(now),
    endOfDay(now),
    { types: [REMINDER_TYPES.MEDICINE] },
    undefined
  );

  const takenByMedicine = new Set(
    takenToday
      .filter((activity) => activity.action === ACTIVITY_ACTION.TAKEN)
      .map((activity) => `${activity.medicineId}:${activity.scheduledAt ?? ''}`)
  );

  const doses = [];
  for (const medicine of medicines) {
    for (const schedule of medicine.schedules) {
      if (!scheduleAppliesToday(schedule, now)) continue;

      const scheduledAt = applyScheduleTime(schedule.timeOfDay, now);
      const scheduledIso = scheduledAt.toISOString();
      const isTaken =
        takenByMedicine.has(`${medicine.id}:${scheduledIso}`) ||
        takenByMedicine.has(`${medicine.id}:`);

      doses.push({
        id: `${medicine.id}:${schedule.id}`,
        medicineId: medicine.id,
        name: medicine.name,
        dosage: medicine.dosage,
        instruction: medicine.instructions,
        scheduledAt: scheduledIso,
        status: isTaken ? OCCURRENCE_STATUS.COMPLETED : OCCURRENCE_STATUS.PENDING,
      });
    }
  }

  doses.sort((a, b) => (a.scheduledAt < b.scheduledAt ? -1 : 1));

  return {
    takenCount: doses.filter((dose) => dose.status === OCCURRENCE_STATUS.COMPLETED).length,
    scheduledCount: doses.length,
    doses,
    enabled: doses.length > 0,
    medicineCount: medicines.length,
  };
}

export async function buildDashboard(now = new Date()) {
  const [settings, configs, period] = await Promise.all([
    loadSettings(),
    getAllReminderConfigs(),
    getPeriodOverview(),
  ]);

  const quietHours = {
    enabled: settings.quietHoursEnabled,
    start: settings.quietHoursStart,
    end: settings.quietHoursEnd,
  };

  const waterConfig = configs[REMINDER_TYPES.WATER];
  const foodConfig = configs[REMINDER_TYPES.FOOD];
  const bathroomConfig = configs[REMINDER_TYPES.BATHROOM];

  const [waterCount, lastWater, lastFood, lastBathroom, medicine, nextOccurrence] =
    await Promise.all([
      countActivitiesForDay(REMINDER_TYPES.WATER, { action: ACTIVITY_ACTION.DRANK }, now),
      getLatestActivityByType(REMINDER_TYPES.WATER, { action: ACTIVITY_ACTION.DRANK }),
      getLatestActivityByType(REMINDER_TYPES.FOOD, { action: ACTIVITY_ACTION.ATE }),
      getLatestActivityByType(REMINDER_TYPES.BATHROOM, { action: ACTIVITY_ACTION.WENT }),
      buildMedicineSection(now),
      getNextPendingOccurrence(),
    ]);

  const foodNext = planNextCheck({
    lastCompletedAt: lastFood?.occurredAt ?? null,
    intervalMinutes: foodConfig?.intervalMinutes,
    quietHours,
  });

  const bathroomNext = planNextCheck({
    lastCompletedAt: lastBathroom?.occurredAt ?? null,
    intervalMinutes: bathroomConfig?.intervalMinutes,
    quietHours,
  });

  const waterNext = waterConfig?.enabled
    ? nextFixedIntervalSlot({
        activeStartTime: waterConfig.activeStartTime,
        activeEndTime: waterConfig.activeEndTime,
        intervalMinutes: waterConfig.intervalMinutes,
        from: now,
      })
    : null;

  return {
    source: 'DATABASE',
    generatedAt: now.toISOString(),

    // The genuinely next scheduled alarm, not a projection.
    nextOccurrence: nextOccurrence
      ? {
          id: nextOccurrence.id,
          type: nextOccurrence.type,
          scheduledAt: nextOccurrence.scheduledAt,
          message: nextOccurrence.message,
          title: nextOccurrence.metadata?.title ?? null,
        }
      : null,

    water: {
      count: waterCount,
      goal: settings.waterDailyGoal,
      lastConfirmedAt: lastWater?.occurredAt ?? null,
      nextReminderAt: waterNext ? waterNext.toISOString() : null,
      enabled: Boolean(waterConfig?.enabled),
      intervalMinutes: waterConfig?.intervalMinutes ?? null,
    },

    medicine,

    bathroom: {
      lastConfirmedAt: lastBathroom?.occurredAt ?? null,
      nextReminderAt: bathroomNext.at ? bathroomNext.at.toISOString() : null,
      enabled: Boolean(bathroomConfig?.enabled),
      intervalMinutes: bathroomConfig?.intervalMinutes ?? null,
    },

    food: {
      lastConfirmedAt: lastFood?.occurredAt ?? null,
      nextCheckAt: foodNext.at ? foodNext.at.toISOString() : null,
      intervalMinutes: foodConfig?.intervalMinutes ?? null,
      enabled: Boolean(foodConfig?.enabled),
    },

    period: {
      lastStartDate: period.lastStartDate,
      lastEndDate: period.lastEndDate,
      estimatedNextDate: period.estimatedNextDate,
      averageCycleLengthDays: period.averageCycleLengthDays,
      cycleCount: period.cycleCount,
      isFallbackEstimate: period.isFallbackEstimate,
      daysUntilEstimate: period.daysUntilEstimate,
    },
  };
}
