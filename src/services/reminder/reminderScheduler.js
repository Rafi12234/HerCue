import { HerCueReminders } from '../../../modules/hercue-reminders';
import { ANDROID_NOTIFICATION_CHANNELS, DEFAULTS } from '../../constants/config';
import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { OCCURRENCE_STATUS } from '../../constants/statuses';
import {
  getOccurrenceById,
  updateOccurrenceStatus,
} from '../../database/repositories/reminderRepository';
import { LOG_CATEGORY, logger } from '../../utils/logger';
import { failed, ok, unimplemented } from '../serviceResult';
import { loadSettings } from '../settings/settingsService';
import { createSnoozeOccurrence, reconcileOccurrences } from './reconciliation';
import { REMINDER_ACTIONS, REMINDER_DEEP_LINKS, buildReminderMessage } from './reminderMessages';

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

const PHASE = 'a later update';

function channelFor(type) {
  return type === REMINDER_TYPES.MEDICINE
    ? ANDROID_NOTIFICATION_CHANNELS.medicine
    : ANDROID_NOTIFICATION_CHANNELS.reminders;
}

/** The payload the native layer stores so it can fire without the database. */
async function toNativePayload(occurrence, settings) {
  const metadata = occurrence.metadata ?? {};
  const fallback = buildReminderMessage(occurrence.type, {});

  return {
    id: occurrence.id,
    type: occurrence.type,
    triggerAtMillis: new Date(occurrence.scheduledAt).getTime(),
    title: metadata.title ?? fallback.title,
    body: occurrence.message ?? fallback.body,
    speech: settings.voiceEnabled ? (metadata.speech ?? fallback.speech) : '',
    channelId: channelFor(occurrence.type),
    vibrate: settings.vibrationEnabled,
    deepLink: REMINDER_DEEP_LINKS[occurrence.type] ?? '/',
    actions: REMINDER_ACTIONS[occurrence.type] ?? [],
    snoozeMinutes:
      occurrence.type === REMINDER_TYPES.MEDICINE
        ? DEFAULTS.medicineSnoozeMinutes
        : settings.defaultSnoozeMinutes,
  };
}

const schedulePort = {
  async schedule(occurrence) {
    const settings = await loadSettings();
    const payload = await toNativePayload(occurrence, settings);
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

    const result = HerCueReminders.schedule({
      id: 'hercue-test-reminder',
      type: REMINDER_TYPES.WATER,
      triggerAtMillis: Date.now() + secondsFromNow * 1000,
      title: 'Test reminder',
      body: 'This is what a HerCue reminder looks like.',
      speech: settings.voiceEnabled ? message.speech : '',
      channelId: ANDROID_NOTIFICATION_CHANNELS.reminders,
      vibrate: settings.vibrationEnabled,
      deepLink: '/settings',
      actions: [],
      snoozeMinutes: settings.defaultSnoozeMinutes,
      isTest: true,
    });

    return result === 'failed' ? failed('The test reminder could not be scheduled.') : ok(result);
  },
};

export { OCCURRENCE_STATUS };

