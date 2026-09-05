import { HerCueReminders } from '../../../modules/hercue-reminders';
import { LOG_CATEGORY, logger } from '../../utils/logger';
import { failed, ok, unimplemented } from '../serviceResult';
import { sanitiseForSpeech } from '../reminder/reminderMessages';

/**
 * Spoken reminder adapter, backed by Android TextToSpeech.
 *
 * Whether a sentence is actually audible depends on volume, silent mode, Do Not
 * Disturb, audio focus and OEM power management. This service never claims
 * otherwise — notifications remain the guaranteed channel, speech is a bonus.
 *
 * At alarm time the native layer speaks directly; this JS surface exists for
 * in-app previews and the settings test.
 */

/** Reached only where the native module is absent — Expo Go, iOS or web. */
const PHASE = 'an Android development build';

export { sanitiseForSpeech as sanitizeForSpeech };

export const voiceService = {
  get isImplemented() {
    return HerCueReminders.isAvailable();
  },

  async isAvailable() {
    return HerCueReminders.isAvailable();
  },

  async speak(sentence) {
    if (!HerCueReminders.isAvailable()) return unimplemented('Spoken reminders', PHASE);

    const clean = sanitiseForSpeech(sentence);
    if (!clean) return failed('There was nothing to say.');

    try {
      HerCueReminders.speak(clean);
      logger.debug(LOG_CATEGORY.TTS, 'Speech requested');
      return ok();
    } catch (error) {
      // Speech failing must never take the notification down with it.
      logger.warn(LOG_CATEGORY.TTS, 'Speech failed', error);
      return failed('The spoken reminder couldn’t play, but your notification is still active.');
    }
  },

  async stop() {
    if (!HerCueReminders.isAvailable()) return unimplemented('Spoken reminders', PHASE);
    HerCueReminders.stopSpeaking();
    return ok();
  },
};
