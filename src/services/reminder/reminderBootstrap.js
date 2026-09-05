import { HerCueReminders } from '../../../modules/hercue-reminders';
import { SETTING_KEYS } from '../../constants/settingKeys';
import { getSetting, setSetting } from '../../database/repositories/settingsRepository';
import { LOG_CATEGORY, logger } from '../../utils/logger';
import { drainPendingActions } from './actionProcessor';
import { reminderScheduler } from './reminderScheduler';

/**
 * Everything the reminder engine must do when the app comes back to life.
 *
 * Order is deliberate: queued notification actions are applied *before*
 * reconciliation, so the schedule is rebuilt from the true current state rather
 * than from stale occurrences the user already answered.
 */

/**
 * Wall-clock schedules must follow the user across timezones, while past
 * activity keeps its original instant (doc 02 §6.4).
 */
async function detectTimezoneChange() {
  const current = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'unknown';
  const previous = await getSetting(SETTING_KEYS.LAST_TIMEZONE, null);

  if (previous === current) return false;

  await setSetting(SETTING_KEYS.LAST_TIMEZONE, current);
  if (previous) {
    logger.info(LOG_CATEGORY.SCHEDULER, `Timezone changed ${previous} → ${current}`);
    return true;
  }
  return false;
}

export async function runReminderBootstrap(reason = 'startup') {
  if (!HerCueReminders.isAvailable()) {
    logger.warn(LOG_CATEGORY.SCHEDULER, 'Native reminder engine unavailable on this build');
    return { available: false };
  }

  const drained = await drainPendingActions();
  const timezoneChanged = await detectTimezoneChange();

  const result = await reminderScheduler.reconcile(
    timezoneChanged ? `${reason}+timezone-change` : reason
  );

  return { available: true, drained, timezoneChanged, reconciliation: result?.data ?? null };
}
