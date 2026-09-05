import { buildNativeReminderPayload } from '../src/services/reminder/nativePayload';
import { generatePeriodReminderOccurrences } from '../src/services/reminder/occurrenceGenerator';

/**
 * The JS→Kotlin contract is the one place where a silent rename breaks every
 * reminder, so the field names are asserted literally against `ReminderRecord`.
 */
const NATIVE_FIELDS = [
  'occurrenceId',
  'occurrenceKey',
  'type',
  'title',
  'body',
  'speech',
  'scheduledAt',
  'channelId',
  'actions',
  'vibrate',
  'speak',
  'snoozeMinutes',
  'followUpMinutes',
  'deepLink',
];

const occurrence = (overrides = {}) => ({
  id: 'occ-1',
  occurrenceKey: 'water:def-1:2026-09-06T10:00:00.000Z',
  type: 'WATER',
  scheduledAt: '2026-09-06T10:00:00.000Z',
  message: 'It’s time to drink some water.',
  metadata: { title: 'Water', speech: 'It is time to drink some water.' },
  ...overrides,
});

describe('buildNativeReminderPayload', () => {
  it('emits exactly the fields the native module declares', () => {
    const payload = buildNativeReminderPayload(occurrence());
    expect(Object.keys(payload).sort()).toEqual([...NATIVE_FIELDS].sort());
  });

  it('sends scheduledAt as epoch milliseconds, not an ISO string', () => {
    const payload = buildNativeReminderPayload(occurrence());
    expect(payload.scheduledAt).toBe(Date.parse('2026-09-06T10:00:00.000Z'));
    expect(typeof payload.scheduledAt).toBe('number');
  });

  it('carries the occurrence id so the alarm can be cancelled later', () => {
    expect(buildNativeReminderPayload(occurrence()).occurrenceId).toBe('occ-1');
  });

  it('gives food a follow-up interval so the next check can be armed natively', () => {
    const payload = buildNativeReminderPayload(occurrence({ type: 'FOOD' }), {
      definition: { type: 'FOOD', intervalMinutes: 360 },
    });
    expect(payload.followUpMinutes).toBe(360);
  });

  it('uses the configured bathroom interval rather than a hard-coded one', () => {
    const payload = buildNativeReminderPayload(occurrence({ type: 'BATHROOM' }), {
      definition: { type: 'BATHROOM', intervalMinutes: 90 },
    });
    expect(payload.followUpMinutes).toBe(90);
  });

  it('leaves fixed-grid reminders without a follow-up', () => {
    const payload = buildNativeReminderPayload(occurrence(), {
      definition: { type: 'WATER', intervalMinutes: 120 },
    });
    expect(payload.followUpMinutes).toBeNull();
  });

  it('silences speech when the category has voice switched off', () => {
    const payload = buildNativeReminderPayload(occurrence(), {
      definition: { voiceEnabled: false },
      settings: { voiceEnabled: true },
    });
    expect(payload.speak).toBe(false);
    expect(payload.speech).toBe('');
  });

  it('silences speech when the global setting is off', () => {
    const payload = buildNativeReminderPayload(occurrence(), {
      settings: { voiceEnabled: false },
    });
    expect(payload.speak).toBe(false);
  });

  it('routes each category to a real in-app screen', () => {
    expect(buildNativeReminderPayload(occurrence()).deepLink).toBe('/');
    expect(buildNativeReminderPayload(occurrence({ type: 'MEDICINE' })).deepLink).toBe('/medicine');
    expect(buildNativeReminderPayload(occurrence({ type: 'PERIOD' })).deepLink).toBe('/period');
  });

  it('gives medicine its own snooze default', () => {
    const payload = buildNativeReminderPayload(occurrence({ type: 'MEDICINE' }), {
      settings: { defaultSnoozeMinutes: 30 },
    });
    expect(payload.snoozeMinutes).toBe(10);
  });

  it('prefers the category snooze over the global default', () => {
    const payload = buildNativeReminderPayload(occurrence(), {
      definition: { snoozeMinutes: 20 },
      settings: { defaultSnoozeMinutes: 5 },
    });
    expect(payload.snoozeMinutes).toBe(20);
  });

  it('attaches the actions the category supports', () => {
    expect(buildNativeReminderPayload(occurrence()).actions.map((a) => a.id)).toEqual([
      'COMPLETE',
      'SNOOZE',
    ]);
    expect(
      buildNativeReminderPayload(occurrence({ type: 'MEDICINE' })).actions.map((a) => a.id)
    ).toEqual(['COMPLETE', 'SNOOZE', 'SKIP']);
  });

  it('gives period nudges no actions, because there is nothing to confirm', () => {
    expect(buildNativeReminderPayload(occurrence({ type: 'PERIOD' })).actions).toEqual([]);
  });
});

describe('generatePeriodReminderOccurrences', () => {
  const from = new Date(2026, 8, 1);
  const until = new Date(2026, 8, 30);

  it('produces nothing when the reminders are switched off', () => {
    expect(
      generatePeriodReminderOccurrences({
        estimatedNextDate: '2026-09-20',
        enabled: false,
        from,
        until,
      })
    ).toEqual([]);
  });

  it('produces nothing without an estimate to anchor to', () => {
    expect(
      generatePeriodReminderOccurrences({ estimatedNextDate: null, enabled: true, from, until })
    ).toEqual([]);
  });

  it('nudges three days before, one day before and on the day', () => {
    const result = generatePeriodReminderOccurrences({
      estimatedNextDate: '2026-09-20',
      enabled: true,
      from,
      until,
    });

    expect(result).toHaveLength(3);
    expect(result.map((o) => o.scheduledAt.slice(0, 10)).sort()).toEqual([
      '2026-09-17',
      '2026-09-19',
      '2026-09-20',
    ]);
  });

  it('keeps the wording tentative and never states a date as fact', () => {
    const result = generatePeriodReminderOccurrences({
      estimatedNextDate: '2026-09-20',
      enabled: true,
      from,
      until,
    });

    result.forEach((entry) => {
      expect(entry.message).toMatch(/expected around|expected in around/);
      expect(entry.message).not.toMatch(/will start/);
    });
  });

  it('generates stable keys so reconciliation cannot duplicate them', () => {
    const args = { estimatedNextDate: '2026-09-20', enabled: true, from, until };
    const first = generatePeriodReminderOccurrences(args).map((o) => o.occurrenceKey);
    const second = generatePeriodReminderOccurrences(args).map((o) => o.occurrenceKey);

    expect(first).toEqual(second);
    expect(new Set(first).size).toBe(3);
  });
});
