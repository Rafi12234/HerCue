import * as Crypto from 'expo-crypto';

/** Collision-safe local identifier for every persisted row. */
export function createId() {
  return Crypto.randomUUID();
}

export { occurrenceKey, snoozeKey } from './occurrenceKeys';
