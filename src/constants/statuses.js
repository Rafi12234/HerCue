/** Normalised occurrence states. UI labels are separate and friendlier. */
export const OCCURRENCE_STATUS = {
  PENDING: 'PENDING',
  TRIGGERED: 'TRIGGERED',
  COMPLETED: 'COMPLETED',
  SNOOZED: 'SNOOZED',
  SKIPPED: 'SKIPPED',
  MISSED: 'MISSED',
  CANCELLED: 'CANCELLED',
};

export const STATUS_LABELS = {
  PENDING: 'Upcoming',
  TRIGGERED: 'Waiting for you',
  COMPLETED: 'Done',
  SNOOZED: 'Snoozed',
  SKIPPED: 'Skipped',
  MISSED: 'Missed',
  CANCELLED: 'Cancelled',
};

/** How an activity row came to exist. */
export const ACTIVITY_SOURCE = {
  REMINDER_ACTION: 'REMINDER_ACTION',
  MANUAL: 'MANUAL',
  SYSTEM: 'SYSTEM',
};

/** What the user actually did, per category. */
export const ACTIVITY_ACTION = {
  DRANK: 'DRANK',
  TAKEN: 'TAKEN',
  ATE: 'ATE',
  WENT: 'WENT',
  STARTED: 'STARTED',
  ENDED: 'ENDED',
  SNOOZED: 'SNOOZED',
  SKIPPED: 'SKIPPED',
  MISSED: 'MISSED',
};

/** Friendly labels for the activity timeline. */
export const ACTIVITY_ACTION_LABELS = {
  DRANK: 'Drank',
  TAKEN: 'Taken',
  ATE: 'Ate',
  WENT: 'Went',
  STARTED: 'Period started',
  ENDED: 'Period ended',
  SNOOZED: 'Snoozed',
  SKIPPED: 'Skipped',
  MISSED: 'Missed',
};
