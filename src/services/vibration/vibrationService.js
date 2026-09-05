import { LOG_CATEGORY, logger } from '../../utils/logger';
import { unimplemented } from '../serviceResult';

/**
 * Reminder vibration adapter (Android VibrationEffect in Phase 4).
 *
 * This is the strong, deliberate reminder waveform — not the light UI haptics
 * in `utils/haptics`. It is always finite: the phone must never buzz endlessly.
 */

const PHASE = 'Phase 4 — reminder engine hardening';

/** pulse · pause · pulse · longer pause · final pulse */
export const REMINDER_PATTERN_MS = [0, 320, 180, 320, 320, 480];

export const vibrationService = {
  isImplemented: false,

  async isAvailable() {
    return false;
  },

  async playReminderPattern() {
    logger.debug(LOG_CATEGORY.SCHEDULER, 'playReminderPattern called on stub');
    return unimplemented('Reminder vibration', PHASE);
  },

  async cancel() {
    return unimplemented('Reminder vibration', PHASE);
  },
};
