import { HerCueReminders } from '../../../modules/hercue-reminders';
import { LOG_CATEGORY, logger } from '../../utils/logger';
import { ok, unimplemented } from '../serviceResult';

/**
 * Reminder vibration adapter, backed by Android VibrationEffect.
 *
 * This is the strong, deliberate reminder waveform — not the light UI haptics
 * in `utils/haptics`. It is always finite: the phone must never buzz endlessly.
 */

const PHASE = 'a later update';

/** pulse · pause · pulse · longer pause · final pulse */
export const REMINDER_PATTERN_MS = [0, 320, 180, 320, 320, 480];

export const vibrationService = {
  get isImplemented() {
    return HerCueReminders.isAvailable();
  },

  async isAvailable() {
    return HerCueReminders.isAvailable() && HerCueReminders.hasVibrator();
  },

  async playReminderPattern() {
    if (!HerCueReminders.isAvailable()) return unimplemented('Reminder vibration', PHASE);
    HerCueReminders.vibrate(REMINDER_PATTERN_MS);
    logger.debug(LOG_CATEGORY.SCHEDULER, 'Reminder vibration triggered');
    return ok();
  },

  async cancel() {
    if (!HerCueReminders.isAvailable()) return unimplemented('Reminder vibration', PHASE);
    HerCueReminders.stopVibration();
    return ok();
  },
};
