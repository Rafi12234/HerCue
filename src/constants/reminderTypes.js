/**
 * Reminder category identifiers. These strings are persisted in SQLite and used
 * as native alarm key prefixes, so they must never be renamed casually.
 */
export const REMINDER_TYPES = {
  WATER: 'WATER',
  MEDICINE: 'MEDICINE',
  BATHROOM: 'BATHROOM',
  FOOD: 'FOOD',
  PERIOD: 'PERIOD',
};

export const REMINDER_TYPE_LIST = [
  REMINDER_TYPES.WATER,
  REMINDER_TYPES.MEDICINE,
  REMINDER_TYPES.BATHROOM,
  REMINDER_TYPES.FOOD,
  REMINDER_TYPES.PERIOD,
];

/** Display metadata. Copy stays gentle and never medical. */
export const REMINDER_TYPE_META = {
  [REMINDER_TYPES.WATER]: {
    label: 'Water',
    quickActionLabel: 'Drank',
    confirmedLabel: 'Noted',
  },
  [REMINDER_TYPES.MEDICINE]: {
    label: 'Medicine',
    quickActionLabel: 'Taken',
    confirmedLabel: 'Taken',
  },
  [REMINDER_TYPES.BATHROOM]: {
    label: 'Bathroom',
    quickActionLabel: 'I went',
    confirmedLabel: 'Noted',
  },
  [REMINDER_TYPES.FOOD]: {
    label: 'Food',
    quickActionLabel: 'I ate',
    confirmedLabel: 'Noted',
  },
  [REMINDER_TYPES.PERIOD]: {
    label: 'Period',
    quickActionLabel: 'Started today',
    confirmedLabel: 'Logged',
  },
};
