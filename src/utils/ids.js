import * as Crypto from 'expo-crypto';

/** Collision-safe local identifier for every persisted row. */
export function createId() {
  return Crypto.randomUUID();
}

/**
 * Deterministic key for a reminder occurrence.
 *
 * Reconciliation relies on this being stable so running it twice can never
 * produce two alarms for the same moment.
 */
export function occurrenceKey(type, ownerId, scheduledIso) {
  return `${type.toLowerCase()}:${ownerId}:${scheduledIso}`;
}

export function snoozeKey(parentOccurrenceId, snoozeUntilIso) {
  return `${parentOccurrenceId}:snooze:${snoozeUntilIso}`;
}
