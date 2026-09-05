import { HerCueReminders } from '../../../modules/hercue-reminders';
import { REMINDER_TYPES } from '../../constants/reminderTypes';
import { ACTIVITY_ACTION, ACTIVITY_SOURCE, OCCURRENCE_STATUS } from '../../constants/statuses';
import { withTransaction } from '../../database/db';
import { createActivity } from '../../database/repositories/activityRepository';
import { createNotificationHistory } from '../../database/repositories/notificationRepository';
import {
  createOccurrence,
  getOccurrenceById,
  updateOccurrenceStatus,
} from '../../database/repositories/reminderRepository';
import { LOG_CATEGORY, logger } from '../../utils/logger';
import { buildReminderMessage } from './reminderMessages';

/**
 * Drains the native action queue into SQLite.
 *
 * Notification actions are handled in a process with no JavaScript runtime, so
 * native records the decision and its real timestamp durably. This runs on the
 * next launch or resume and is the only place those decisions become rows.
 *
 * Order matters: the queue is only cleared after every entry has been applied,
 * so a crash mid-drain replays rather than loses.
 */

const COMPLETION_ACTION = {
  [REMINDER_TYPES.WATER]: ACTIVITY_ACTION.DRANK,
  [REMINDER_TYPES.MEDICINE]: ACTIVITY_ACTION.TAKEN,
  [REMINDER_TYPES.FOOD]: ACTIVITY_ACTION.ATE,
  [REMINDER_TYPES.BATHROOM]: ACTIVITY_ACTION.WENT,
};

const RESOLVED_STATUSES = new Set([
  OCCURRENCE_STATUS.COMPLETED,
  OCCURRENCE_STATUS.SKIPPED,
  OCCURRENCE_STATUS.CANCELLED,
]);

function parseQueue(raw) {
  try {
    const parsed = JSON.parse(raw ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    logger.error(LOG_CATEGORY.SCHEDULER, 'Native action queue was unreadable', error);
    return [];
  }
}

async function recordDelivery(occurrence, actedAt) {
  const message = buildReminderMessage(occurrence.type, {});
  const metadata = occurrence.metadata ?? {};

  await withTransaction(async (db) => {
    if (occurrence.status === OCCURRENCE_STATUS.PENDING) {
      await updateOccurrenceStatus(
        occurrence.id,
        OCCURRENCE_STATUS.TRIGGERED,
        { triggeredAt: actedAt },
        db
      );
    }

    await createNotificationHistory(
      {
        occurrenceId: occurrence.id,
        type: occurrence.type,
        title: metadata.title ?? message.title,
        body: occurrence.message ?? message.body,
        status: OCCURRENCE_STATUS.TRIGGERED,
        deliveredAt: actedAt.toISOString(),
      },
      db
    );
  });
}

async function recordCompletion(occurrence, actedAt) {
  await withTransaction(async (db) => {
    await updateOccurrenceStatus(
      occurrence.id,
      OCCURRENCE_STATUS.COMPLETED,
      { completedAt: actedAt },
      db
    );

    await createActivity(
      {
        type: occurrence.type,
        action: COMPLETION_ACTION[occurrence.type] ?? ACTIVITY_ACTION.TAKEN,
        status: OCCURRENCE_STATUS.COMPLETED,
        occurredAt: actedAt,
        scheduledAt: occurrence.scheduledAt,
        occurrenceId: occurrence.id,
        medicineId: occurrence.medicineId,
        valueNumeric: occurrence.type === REMINDER_TYPES.WATER ? 1 : null,
        source: ACTIVITY_SOURCE.REMINDER_ACTION,
      },
      db
    );
  });
}

async function recordSkip(occurrence, actedAt) {
  await withTransaction(async (db) => {
    await updateOccurrenceStatus(occurrence.id, OCCURRENCE_STATUS.SKIPPED, {}, db);
    await createActivity(
      {
        type: occurrence.type,
        action: ACTIVITY_ACTION.SKIPPED,
        status: OCCURRENCE_STATUS.SKIPPED,
        occurredAt: actedAt,
        scheduledAt: occurrence.scheduledAt,
        occurrenceId: occurrence.id,
        medicineId: occurrence.medicineId,
        source: ACTIVITY_SOURCE.REMINDER_ACTION,
      },
      db
    );
  });
}

async function recordSnooze(occurrence, actedAt, entry) {
  await withTransaction(async (db) => {
    await updateOccurrenceStatus(occurrence.id, OCCURRENCE_STATUS.SNOOZED, {}, db);

    await createActivity(
      {
        type: occurrence.type,
        action: ACTIVITY_ACTION.SNOOZED,
        status: OCCURRENCE_STATUS.SNOOZED,
        occurredAt: actedAt,
        scheduledAt: occurrence.scheduledAt,
        occurrenceId: occurrence.id,
        medicineId: occurrence.medicineId,
        source: ACTIVITY_SOURCE.REMINDER_ACTION,
      },
      db
    );

    // Native already armed the alarm; this mirrors it into the database using
    // the very same id, so reconciliation recognises it instead of duplicating.
    if (entry.followUpOccurrenceId && entry.followUpAt) {
      await createOccurrence(
        {
          id: entry.followUpOccurrenceId,
          occurrenceKey: `${occurrence.id}:snooze:${entry.followUpAt}`,
          type: occurrence.type,
          scheduledAt: new Date(entry.followUpAt),
          definitionId: occurrence.definitionId,
          medicineId: occurrence.medicineId,
          medicineScheduleId: occurrence.medicineScheduleId,
          parentOccurrenceId: occurrence.id,
          nativeScheduleId: entry.followUpOccurrenceId,
          message: occurrence.message,
          metadata: occurrence.metadata,
        },
        db
      );
    }
  });
}

/** Mirrors the follow-up check native armed after a food/bathroom confirmation. */
async function recordFollowUp(occurrence, entry) {
  if (!entry.followUpOccurrenceId || !entry.followUpAt) return;

  await createOccurrence({
    id: entry.followUpOccurrenceId,
    occurrenceKey: `${occurrence.type.toLowerCase()}:followup:${entry.followUpAt}`,
    type: occurrence.type,
    scheduledAt: new Date(entry.followUpAt),
    definitionId: occurrence.definitionId,
    nativeScheduleId: entry.followUpOccurrenceId,
    message: occurrence.message,
    metadata: occurrence.metadata,
  });
}

async function applyEntry(entry) {
  const occurrence = await getOccurrenceById(entry.occurrenceId);
  if (!occurrence) {
    // The test reminder has no database row, which is expected.
    logger.debug(LOG_CATEGORY.SCHEDULER, `No occurrence for queued ${entry.action}`);
    return false;
  }

  const actedAt = new Date(entry.actedAt);

  if (entry.action === 'DELIVERED') {
    await recordDelivery(occurrence, actedAt);
    return true;
  }

  // A repeated tap on an already-resolved reminder must not write twice.
  if (RESOLVED_STATUSES.has(occurrence.status)) {
    logger.debug(LOG_CATEGORY.SCHEDULER, `Ignored duplicate ${entry.action}`);
    return false;
  }

  switch (entry.action) {
    case 'COMPLETE':
      await recordCompletion(occurrence, actedAt);
      await recordFollowUp(occurrence, entry);
      return true;
    case 'SKIP':
      await recordSkip(occurrence, actedAt);
      return true;
    case 'SNOOZE':
      await recordSnooze(occurrence, actedAt, entry);
      return true;
    default:
      logger.warn(LOG_CATEGORY.SCHEDULER, `Unknown queued action ${entry.action}`);
      return false;
  }
}

export async function drainPendingActions() {
  if (!HerCueReminders.isAvailable()) return { applied: 0, total: 0 };

  const entries = parseQueue(HerCueReminders.pendingActions());
  if (entries.length === 0) return { applied: 0, total: 0 };

  let applied = 0;
  for (const entry of entries) {
    try {
      if (await applyEntry(entry)) applied += 1;
    } catch (error) {
      logger.error(LOG_CATEGORY.SCHEDULER, `Could not apply queued ${entry?.action}`, error);
    }
  }

  HerCueReminders.clearPendingActions();
  logger.info(LOG_CATEGORY.SCHEDULER, `Applied ${applied}/${entries.length} queued action(s)`);
  return { applied, total: entries.length };
}
