import { HerCueReminders } from '../../../modules/hercue-reminders';
import { ANDROID_NOTIFICATION_CHANNELS } from '../../constants/config';
import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { OCCURRENCE_STATUS } from '../../constants/statuses';
import {
  getOccurrenceById,
  updateOccurrenceStatus,
} from '../../database/repositories/reminderRepository';
import { LOG_CATEGORY, logger } from '../../utils/logger';
import { failed, ok, unimplemented } from '../serviceResult';
import { getAllReminderConfigs, loadSettings } from '../settings/settingsService';
import { buildNativeReminderPayload } from './nativePayload';
import { createSnoozeOccurrence, reconcileOccurrences } from './reconciliation';
import { buildReminderMessage } from './reminderMessages';

/**
 * Reminder scheduling adapter.
 *
 * Screens and services only ever talk to this object. Everything below it is
 * the native AlarmManager layer, which owns the whole trigger path — the app
 * process is usually dead when an alarm fires, so no JavaScript runs there.
 *
 * Deliberately absent: there is no `setInterval` fallback. A foreground timer
 * cannot deliver a reminder when the app is closed, so reporting the capability
 * as unavailable is more useful than pretending.
 */

/** Reached only where the native module is absent — Expo Go, iOS or web. */
const PHASE = 'an Android development build';

const schedulePort = {
  /**
   * @param context optional pre-loaded `{ settings, definitions }` so a
   *   reconciliation pass does not re-read them for every occurrence.
   */
  async schedule(occurrence, context = null) {
    const settings = context?.settings ?? (await loadSettings());
    const definitions = context?.definitions ?? (await getAllReminderConfigs());
    const definition = definitions?.[occurrence.type] ?? null;

    const payload = buildNativeReminderPayload(occurrence, { definition, settings });
    const result = HerCueReminders.schedule(payload);

    if (result === 'failed') {
      logger.warn(LOG_CATEGORY.SCHEDULER, `Alarm rejected for ${occurrence.type}`);
      return 'failed';
    }

    if (occurrence.nativeScheduleId !== occurrence.id) {
      await updateOccurrenceStatus(occurrence.id, occurrence.status, {
        nativeScheduleId: occurrence.id,
      });
    }

    logger.debug(
      LOG_CATEGORY.SCHEDULER,
      `Alarm ${result} for ${occurrence.type} at ${occurrence.scheduledAt}`
    );
    return result;
  },

  async cancel(occurrenceId) {
    HerCueReminders.cancel(occurrenceId);
    logger.debug(LOG_CATEGORY.SCHEDULER, `Alarm cancelled ${occurrenceId}`);
  },
};

export { schedulePort };

export const reminderScheduler = {
  get isImplemented() {
    return HerCueReminders.isAvailable();
  },

  isAvailable() {
    return HerCueReminders.isAvailable();
  },

  async scheduleOccurrence(occurrence) {
    if (!HerCueReminders.isAvailable()) return unimplemented('Occurrence scheduling', PHASE);
    try {
      return ok(await schedulePort.schedule(occurrence));
    } catch (error) {
      logger.error(LOG_CATEGORY.SCHEDULER, 'Could not schedule occurrence', error);
      return failed('That reminder could not be scheduled.', error);
    }
  },

  async cancelOccurrence(occurrenceId) {
    if (!HerCueReminders.isAvailable()) return unimplemented('Occurrence cancellation', PHASE);
    await schedulePort.cancel(occurrenceId);
    return ok();
  },

  /**
   * Idempotent: generates missing occurrences, cancels invalid alarms and marks
   * expired unanswered occurrences MISSED. Safe to call repeatedly.
   */
  async reconcile(reason = 'unspecified') {
    if (!HerCueReminders.isAvailable()) return unimplemented('Schedule reconciliation', PHASE);
    try {
      return ok(await reconcileOccurrences({ schedulePort, reason }));
    } catch (error) {
      logger.error(LOG_CATEGORY.SCHEDULER, 'Reconciliation failed', error);
      return failed('Reminders could not be reconciled.', error);
    }
  },

  async snoozeOccurrence(occurrenceId, minutes) {
    const occurrence = await getOccurrenceById(occurrenceId);
    if (!occurrence) return failed('That reminder is no longer available.');

    const settings = await loadSettings();
    const child = await createSnoozeOccurrence({
      occurrence,
      minutes: minutes ?? settings.defaultSnoozeMinutes,
    });

    if (child) await schedulePort.schedule(child);
    HerCueReminders.dismissNotification(occurrenceId);
    return ok(child);
  },

  /** Android 12+ restricts exact alarms; the UI must degrade gracefully. */
  async canScheduleExact() {
    return HerCueReminders.canScheduleExact();
  },

  async openAlarmSettings() {
    if (!HerCueReminders.isAvailable()) return unimplemented('Alarms & reminders settings', PHASE);
    return HerCueReminders.openExactAlarmSettings() ? ok() : failed('Settings could not be opened.');
  },

  /** Cancels every native alarm — used before clearing the database. */
  async cancelAll() {
    HerCueReminders.cancelAll();
    return ok();
  },

  /**
   * Fires the real path a few seconds out rather than a mock, so what the user
   * sees is exactly what a reminder will do on this device.
   */
  async testReminder(secondsFromNow = 5) {
    if (!HerCueReminders.isAvailable()) return unimplemented('Test reminder', PHASE);

    const settings = await loadSettings();
    const message = buildReminderMessage(REMINDER_TYPES.WATER, {});

    // Goes through buildNativeReminderPayload so the test cannot pass while the
    // real contract is broken.
    const payload = buildNativeReminderPayload(
      {
        id: 'hercue-test-reminder',
        occurrenceKey: 'hercue-test-reminder',
        type: REMINDER_TYPES.WATER,
        scheduledAt: new Date(Date.now() + secondsFromNow * 1000).toISOString(),
        message: 'This is what a HerCue reminder looks like.',
        metadata: { title: 'Test reminder', speech: message.speech },
      },
      { settings }
    );

    const result = HerCueReminders.schedule({
      ...payload,
      channelId: ANDROID_NOTIFICATION_CHANNELS.reminders,
      actions: [],
      deepLink: '/settings',
    });

    return result === 'failed' ? failed('The test reminder could not be scheduled.') : ok(result);
  },
};

export { OCCURRENCE_STATUS };

