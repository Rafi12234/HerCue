import { LOG_CATEGORY, logger } from '../../utils/logger';
import { unimplemented } from '../serviceResult';

/**
 * Reminder scheduling adapter — the seam the whole reminder engine hangs from.
 *
 * Screens must only ever talk to this object, never to AlarmManager, Expo
 * notifications or any timer. Phase 4 replaces the body of each method with the
 * Kotlin AlarmManager module without any UI change.
 *
 * Deliberately absent: there is no `setInterval` fallback here. A foreground JS
 * timer cannot deliver a reminder when the app is closed, so pretending it can
 * would be worse than reporting the capability as unavailable.
 */

const PHASE = 'Phase 3/4 — Water + reminder engine hardening';

export const reminderScheduler = {
  isImplemented: false,

  /** Registers one concrete occurrence with the platform scheduler. */
  async scheduleOccurrence(occurrence) {
    logger.debug(LOG_CATEGORY.SCHEDULER, 'scheduleOccurrence called on stub', occurrence?.id);
    return unimplemented('Occurrence scheduling', PHASE);
  },

  async cancelOccurrence(occurrenceId) {
    logger.debug(LOG_CATEGORY.SCHEDULER, 'cancelOccurrence called on stub', occurrenceId);
    return unimplemented('Occurrence cancellation', PHASE);
  },

  /**
   * Idempotent: generates missing occurrences, cancels invalid alarms and marks
   * expired unanswered occurrences MISSED. Safe to call repeatedly.
   */
  async reconcile(reason = 'unspecified') {
    logger.debug(LOG_CATEGORY.SCHEDULER, `reconcile called on stub (${reason})`);
    return unimplemented('Schedule reconciliation', PHASE);
  },

  /** Android 12+ restricts exact alarms; the UI must degrade gracefully. */
  async canScheduleExact() {
    return false;
  },

  async openAlarmSettings() {
    return unimplemented('Alarms & reminders settings shortcut', PHASE);
  },
};
