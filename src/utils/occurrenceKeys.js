/**
 * Deterministic occurrence keys.
 *
 * Kept apart from `ids.js` because that pulls in expo-crypto: the key builders
 * are pure string maths and must stay importable by the domain layer (and its
 * tests) without dragging a native module along.
 *
 * Reconciliation relies on these being stable so running it twice can never
 * produce two alarms for the same moment.
 */

export function occurrenceKey(type, ownerId, scheduledIso) {
  return `${type.toLowerCase()}:${ownerId}:${scheduledIso}`;
}

export function snoozeKey(parentOccurrenceId, snoozeUntilIso) {
  return `${parentOccurrenceId}:snooze:${snoozeUntilIso}`;
}
