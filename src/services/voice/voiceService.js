import { LOG_CATEGORY, logger } from '../../utils/logger';
import { unimplemented } from '../serviceResult';

/**
 * Spoken reminder adapter (Android TextToSpeech in Phase 4).
 *
 * Whether a sentence is actually audible depends on volume, silent mode, Do Not
 * Disturb, audio focus and OEM power management. This service must never claim
 * otherwise — notifications remain the guaranteed channel, speech is a bonus.
 */

const PHASE = 'Phase 4 — reminder engine hardening';

/** Removes characters that TextToSpeech would read out literally. */
export function sanitizeForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/[_*`~#|<>{}[\]\\/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const voiceService = {
  isImplemented: false,

  async isAvailable() {
    return false;
  },

  async speak(sentence) {
    logger.debug(LOG_CATEGORY.TTS, 'speak called on stub', sanitizeForSpeech(sentence));
    return unimplemented('Spoken reminders', PHASE);
  },

  async stop() {
    return unimplemented('Spoken reminders', PHASE);
  },
};
