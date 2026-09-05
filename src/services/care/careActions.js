import { FEATURES } from '../../constants/features';
import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { useDashboardStore } from '../../stores/dashboardStore';
import { haptics } from '../../utils/haptics';
import { LOG_CATEGORY, logger } from '../../utils/logger';
import { reminderScheduler } from '../reminder/reminderScheduler';

/**
 * The single entry point for Home's quick actions.
 *
 * Screens call these instead of touching stores or repositories directly. When
 * Phase 2/3 land, only the bodies here change: each action becomes a
 * transaction that writes an activity row, resolves the occurrence and asks the
 * scheduler to reconcile. The call sites stay exactly as they are.
 */

async function reconcileIfAvailable(reason) {
  if (!FEATURES.reminderScheduling) return;
  await reminderScheduler.reconcile(reason);
}

async function run(type, apply, reason) {
  try {
    apply();
    haptics.success();
    await reconcileIfAvailable(reason);
    logger.info(LOG_CATEGORY.UI, `Care action recorded: ${type}`);
    return { ok: true, persisted: FEATURES.persistentDashboard };
  } catch (error) {
    logger.error(LOG_CATEGORY.UI, `Care action failed: ${type}`, error);
    haptics.warning();
    return { ok: false, message: 'Something went wrong saving that. Please try again.' };
  }
}

export const careActions = {
  drinkWater() {
    const store = useDashboardStore.getState();
    return run(REMINDER_TYPES.WATER, store.confirmWater, 'water-completed');
  },

  eat() {
    const store = useDashboardStore.getState();
    return run(REMINDER_TYPES.FOOD, store.confirmFood, 'food-completed');
  },

  visitBathroom() {
    const store = useDashboardStore.getState();
    return run(REMINDER_TYPES.BATHROOM, store.confirmBathroom, 'bathroom-completed');
  },

  startPeriod(date = new Date()) {
    const store = useDashboardStore.getState();
    return run(REMINDER_TYPES.PERIOD, () => store.logPeriodStart(date), 'period-started');
  },
};
