import { FEATURES } from '../../constants/features';
import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { useDashboardStore } from '../../stores/dashboardStore';
import { haptics } from '../../utils/haptics';
import { LOG_CATEGORY, logger } from '../../utils/logger';
import { startPeriod as startPeriodService } from '../period/periodService';
import { reminderScheduler } from '../reminder/reminderScheduler';
import { completeBathroom, completeFood, completeMedicine, completeWater } from './careService';

/**
 * The single entry point for Home's quick actions.
 *
 * Persist first, refresh the view-model from SQLite, then celebrate — the
 * success animation must never appear for a write that failed.
 */

async function reconcileIfAvailable(reason) {
  if (!FEATURES.reminderScheduling) return;
  await reminderScheduler.reconcile(reason);
}

async function run(type, persist, reason) {
  try {
    const result = await persist();

    if (result?.ok === false) {
      haptics.warning();
      return { ok: false, message: result.message ?? 'Couldn’t save that. Please try again.' };
    }

    const store = useDashboardStore.getState();
    await store.refresh();
    store.noteConfirmation(type);

    haptics.success();
    await reconcileIfAvailable(reason);

    return { ok: true, duplicate: Boolean(result?.duplicate) };
  } catch (error) {
    logger.error(LOG_CATEGORY.UI, `Care action failed: ${type}`, error);
    haptics.warning();
    return { ok: false, message: 'Couldn’t save that. Please try again.' };
  }
}

export const careActions = {
  drinkWater() {
    return run(REMINDER_TYPES.WATER, () => completeWater(), 'water-completed');
  },

  eat() {
    return run(REMINDER_TYPES.FOOD, () => completeFood(), 'food-completed');
  },

  visitBathroom() {
    return run(REMINDER_TYPES.BATHROOM, () => completeBathroom(), 'bathroom-completed');
  },

  startPeriod(date = new Date()) {
    return run(REMINDER_TYPES.PERIOD, () => startPeriodService(date), 'period-started');
  },

  takeMedicine(medicineId, occurrenceId = null) {
    return run(
      REMINDER_TYPES.MEDICINE,
      () => completeMedicine({ medicineId, occurrenceId }),
      'medicine-completed'
    );
  },
};
