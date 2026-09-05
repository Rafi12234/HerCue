import { ANDROID_NOTIFICATION_CHANNELS, DEFAULTS } from '../../constants/config';
import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { REMINDER_ACTIONS, REMINDER_DEEP_LINKS, buildReminderMessage } from './reminderMessages';

/**
 * The single authoritative JS→Kotlin payload contract.
 *
 * Field names here must match `ReminderRecord` in the native module exactly. It
 * lives in one function so the two sides cannot drift apart again — a rename on
 * either side is a one-line change here, not a silent scheduling failure.
 *
 * Native field reference:
 *   occurrenceId, occurrenceKey, type, title, body, speech, scheduledAt,
 *   channelId, actions, vibrate, speak, snoozeMinutes, followUpMinutes, deepLink
 */

/** Food and bathroom re-arm from the confirmation; water and medicine do not. */
const ANCHORED_TYPES = new Set([REMINDER_TYPES.FOOD, REMINDER_TYPES.BATHROOM]);

function channelFor(type) {
  return type === REMINDER_TYPES.MEDICINE
    ? ANDROID_NOTIFICATION_CHANNELS.medicine
    : ANDROID_NOTIFICATION_CHANNELS.reminders;
}

function snoozeFor(type, definition, settings) {
  if (type === REMINDER_TYPES.MEDICINE) return DEFAULTS.medicineSnoozeMinutes;
  return definition?.snoozeMinutes ?? settings?.defaultSnoozeMinutes ?? DEFAULTS.waterSnoozeMinutes;
}

/**
 * @param occurrence the stored `reminder_occurrences` row
 * @param definition the matching `reminder_definitions` row, when there is one
 * @param settings global settings snapshot
 */
export function buildNativeReminderPayload(occurrence, { definition = null, settings = {} } = {}) {
  const metadata = occurrence.metadata ?? {};
  const fallback = buildReminderMessage(occurrence.type, {});

  // Per-category switches win over the global one: turning voice off for
  // bathroom must not silence medicine.
  const voiceOn = (definition?.voiceEnabled ?? true) && settings.voiceEnabled !== false;
  const vibrateOn = (definition?.vibrationEnabled ?? true) && settings.vibrationEnabled !== false;

  const followUpMinutes =
    ANCHORED_TYPES.has(occurrence.type) && definition?.intervalMinutes
      ? definition.intervalMinutes
      : null;

  return {
    occurrenceId: occurrence.id,
    occurrenceKey: occurrence.occurrenceKey ?? occurrence.id,
    type: occurrence.type,
    title: metadata.title ?? fallback.title,
    body: occurrence.message ?? fallback.body,
    speech: voiceOn ? (metadata.speech ?? fallback.speech) : '',
    scheduledAt: new Date(occurrence.scheduledAt).getTime(),
    channelId: channelFor(occurrence.type),
    actions: REMINDER_ACTIONS[occurrence.type] ?? [],
    vibrate: vibrateOn,
    speak: voiceOn,
    snoozeMinutes: snoozeFor(occurrence.type, definition, settings),
    followUpMinutes,
    deepLink: REMINDER_DEEP_LINKS[occurrence.type] ?? '/',
  };
}
