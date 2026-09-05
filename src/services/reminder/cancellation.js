import { OCCURRENCE_STATUS } from '../../constants/statuses';
import {
  cancelFutureOccurrences,
  clearNativeScheduleId,
  getOccurrencesForRange,
} from '../../database/repositories/reminderRepository';
import { LOG_CATEGORY, logger } from '../../utils/logger';
import { schedulePort } from './reminderScheduler';

/** How far ahead a cancellation sweep looks for alarms to tear down. */
const CANCEL_HORIZON_DAYS = 60;

/**
 * Cancels the Android alarms for future occurrences *before* the rows are
 * marked cancelled.
 *
 * Order matters: once a row is CANCELLED, reconciliation no longer treats it as
 * open and would skip tearing down its alarm — which is exactly how a medicine
 * whose time was changed keeps ringing at the old time.
 */
export async function cancelFutureAlarmsFor(filters, from = new Date()) {
  const until = new Date(from.getTime() + CANCEL_HORIZON_DAYS * 24 * 60 * 60 * 1000);
  const upcoming = await getOccurrencesForRange(from, until, filters);

  let cleared = 0;
  for (const occurrence of upcoming) {
    const isOpen =
      occurrence.status === OCCURRENCE_STATUS.PENDING ||
      occurrence.status === OCCURRENCE_STATUS.TRIGGERED ||
      Boolean(occurrence.nativeScheduleId);

    if (!isOpen) continue;

    await schedulePort.cancel(occurrence.id);
    await clearNativeScheduleId(occurrence.id);
    cleared += 1;
  }

  const rows = await cancelFutureOccurrences(filters, from);
  logger.info(
    LOG_CATEGORY.SCHEDULER,
    `Cancelled ${cleared} alarm(s) and ${rows} occurrence(s) for ${JSON.stringify(filters)}`
  );

  return { alarmsCleared: cleared, occurrencesCancelled: rows };
}
