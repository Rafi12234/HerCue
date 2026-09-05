import { REMINDER_TYPES } from '../../constants/reminderTypes';

/**
 * Reminder copy, shared by the notification body and the spoken sentence.
 *
 * Built once when an occurrence is created and stored on the row, so what is
 * spoken later is exactly what was persisted — the alarm fires in a process
 * that has no access to the database.
 */

/**
 * Text-to-speech reads punctuation and identifiers badly, so anything that is
 * not part of a natural sentence is stripped before it can be spoken.
 */
export function sanitiseForSpeech(text) {
  if (!text) return '';
  return String(text)
    .replace(/[_*`~<>[\]{}|\\/]+/g, ' ')
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?])/g, '$1')
    .trim();
}

function medicineSentence({ name, dosage, instruction }) {
  const safeName = sanitiseForSpeech(name) || 'medicine';

  if (instruction) {
    return `It's time to take your ${safeName}. ${sanitiseForSpeech(instruction)}`;
  }
  if (dosage) {
    return `It's time to take your ${safeName}, ${sanitiseForSpeech(dosage)}.`;
  }
  return `It's time to take your ${safeName}.`;
}

/** `{ title, body, speech }` for one occurrence. */
export function buildReminderMessage(type, context = {}) {
  switch (type) {
    case REMINDER_TYPES.MEDICINE: {
      const sentence = medicineSentence(context);
      return {
        title: sanitiseForSpeech(context.name) || 'Medicine',
        body: sentence,
        speech: sentence,
      };
    }
    case REMINDER_TYPES.FOOD:
      return {
        title: 'A gentle check',
        body: 'It’s been around six hours. Have you eaten anything?',
        speech: 'It has been around six hours. Have you eaten anything?',
      };
    case REMINDER_TYPES.BATHROOM:
      return {
        title: 'Bathroom',
        body: 'A little reminder to take a bathroom break.',
        speech: 'A little reminder to take a bathroom break.',
      };
    case REMINDER_TYPES.WATER:
    default:
      return {
        title: 'Water',
        body: 'It’s time to drink some water.',
        speech: 'It is time to drink some water.',
      };
  }
}

/** Notification action buttons per category, per doc 05 §13. */
export const REMINDER_ACTIONS = {
  [REMINDER_TYPES.WATER]: [
    { id: 'COMPLETE', label: 'Drank' },
    { id: 'SNOOZE', label: 'Snooze' },
  ],
  [REMINDER_TYPES.MEDICINE]: [
    { id: 'COMPLETE', label: 'Taken' },
    { id: 'SNOOZE', label: 'Snooze' },
    { id: 'SKIP', label: 'Skip' },
  ],
  [REMINDER_TYPES.FOOD]: [
    { id: 'COMPLETE', label: 'I ate' },
    { id: 'SNOOZE', label: 'Snooze' },
  ],
  [REMINDER_TYPES.BATHROOM]: [
    { id: 'COMPLETE', label: 'Went' },
    { id: 'SNOOZE', label: 'Snooze' },
  ],
};

/** Where tapping the notification body should land (doc 05 §14). */
export const REMINDER_DEEP_LINKS = {
  [REMINDER_TYPES.WATER]: '/',
  [REMINDER_TYPES.MEDICINE]: '/medicine',
  [REMINDER_TYPES.FOOD]: '/',
  [REMINDER_TYPES.BATHROOM]: '/',
};
