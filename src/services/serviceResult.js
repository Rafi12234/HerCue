/**
 * Marks a capability that is deliberately not implemented yet.
 *
 * Adapters return this instead of silently doing nothing, so callers and the UI
 * can tell the difference between "worked" and "not built yet".
 */
export const UNIMPLEMENTED = 'UNIMPLEMENTED';

export function unimplemented(capability, phase) {
  return {
    ok: false,
    reason: UNIMPLEMENTED,
    capability,
    phase,
    message: `${capability} is not implemented yet (planned for ${phase}).`,
  };
}

export function ok(data = null) {
  return { ok: true, reason: null, data };
}

export function failed(message, cause = null) {
  return { ok: false, reason: 'ERROR', message, cause };
}
