import {
  generateDynamicOccurrence,
  generateMedicineOccurrences,
  generateWaterOccurrences,
} from '../src/services/reminder/occurrenceGenerator';
import { buildReminderMessage, sanitiseForSpeech } from '../src/services/reminder/reminderMessages';

const at = (iso) => new Date(iso);

const waterDefinition = {
  id: 'water-def',
  type: 'WATER',
  enabled: true,
  intervalMinutes: 120,
  activeStartTime: '08:00',
  activeEndTime: '22:00',
};

describe('generateWaterOccurrences', () => {
  it('lays slots on the interval grid inside the active window', () => {
    const result = generateWaterOccurrences({
      definition: waterDefinition,
      from: at('2026-09-06T07:00:00'),
      until: at('2026-09-06T23:00:00'),
    });

    const times = result.map((o) => new Date(o.scheduledAt).getHours());
    expect(times).toEqual([8, 10, 12, 14, 16, 18, 20, 22]);
  });

  it('never generates anything before the window opens', () => {
    const result = generateWaterOccurrences({
      definition: waterDefinition,
      from: at('2026-09-06T13:10:00'),
      until: at('2026-09-06T23:00:00'),
    });
    expect(new Date(result[0].scheduledAt).getHours()).toBe(14);
  });

  it('drops slots that fall inside quiet hours', () => {
    const result = generateWaterOccurrences({
      definition: { ...waterDefinition, activeEndTime: '23:59' },
      from: at('2026-09-06T07:00:00'),
      until: at('2026-09-06T23:59:00'),
      quietHours: { enabled: true, start: '22:00', end: '07:30' },
    });
    expect(result.every((o) => new Date(o.scheduledAt).getHours() < 22)).toBe(true);
  });

  it('produces nothing when the reminder is switched off', () => {
    const result = generateWaterOccurrences({
      definition: { ...waterDefinition, enabled: false },
      from: at('2026-09-06T07:00:00'),
      until: at('2026-09-06T23:00:00'),
    });
    expect(result).toEqual([]);
  });

  it('generates keys that are stable across runs, so reconciliation cannot duplicate', () => {
    const args = {
      definition: waterDefinition,
      from: at('2026-09-06T07:00:00'),
      until: at('2026-09-06T23:00:00'),
    };
    const first = generateWaterOccurrences(args).map((o) => o.occurrenceKey);
    const second = generateWaterOccurrences(args).map((o) => o.occurrenceKey);

    expect(first).toEqual(second);
    expect(new Set(first).size).toBe(first.length);
  });
});

const medicine = (overrides = {}) => ({
  id: 'med-1',
  name: 'Napa',
  dosage: '1 tablet',
  instructions: 'After food',
  active: true,
  archivedAt: null,
  startDate: null,
  endDate: null,
  schedules: [{ id: 'sched-1', timeOfDay: '09:00', repeatType: 'DAILY', enabled: true }],
  ...overrides,
});

describe('generateMedicineOccurrences', () => {
  it('creates one occurrence per day for a daily schedule', () => {
    const result = generateMedicineOccurrences({
      medicines: [medicine()],
      from: at('2026-09-06T00:00:00'),
      until: at('2026-09-08T23:59:00'),
    });
    expect(result).toHaveLength(3);
  });

  it('handles several times a day', () => {
    const result = generateMedicineOccurrences({
      medicines: [
        medicine({
          schedules: [
            { id: 's1', timeOfDay: '09:00', repeatType: 'DAILY', enabled: true },
            { id: 's2', timeOfDay: '21:00', repeatType: 'DAILY', enabled: true },
          ],
        }),
      ],
      from: at('2026-09-06T00:00:00'),
      until: at('2026-09-06T23:59:00'),
    });
    expect(result.map((o) => new Date(o.scheduledAt).getHours()).sort((a, b) => a - b)).toEqual([
      9, 21,
    ]);
  });

  it('respects selected weekdays', () => {
    // 2026-09-07 is a Monday.
    const result = generateMedicineOccurrences({
      medicines: [
        medicine({
          schedules: [
            { id: 's1', timeOfDay: '09:00', repeatType: 'DAYS_OF_WEEK', daysOfWeek: [1], enabled: true },
          ],
        }),
      ],
      from: at('2026-09-06T00:00:00'),
      until: at('2026-09-09T23:59:00'),
    });
    expect(result).toHaveLength(1);
    expect(new Date(result[0].scheduledAt).getDay()).toBe(1);
  });

  it('honours start and end dates', () => {
    const result = generateMedicineOccurrences({
      medicines: [medicine({ startDate: '2026-09-07', endDate: '2026-09-08' })],
      from: at('2026-09-06T00:00:00'),
      until: at('2026-09-10T23:59:00'),
    });
    expect(result).toHaveLength(2);
  });

  it('ignores inactive and archived medicines', () => {
    const result = generateMedicineOccurrences({
      medicines: [medicine({ active: false }), medicine({ id: 'm2', archivedAt: '2026-09-01' })],
      from: at('2026-09-06T00:00:00'),
      until: at('2026-09-08T23:59:00'),
    });
    expect(result).toEqual([]);
  });

  it('ignores disabled schedules', () => {
    const result = generateMedicineOccurrences({
      medicines: [
        medicine({
          schedules: [{ id: 's1', timeOfDay: '09:00', repeatType: 'DAILY', enabled: false }],
        }),
      ],
      from: at('2026-09-06T00:00:00'),
      until: at('2026-09-08T23:59:00'),
    });
    expect(result).toEqual([]);
  });
});

describe('generateDynamicOccurrence', () => {
  const foodDefinition = {
    id: 'food-def',
    type: 'FOOD',
    enabled: true,
    intervalMinutes: 360,
  };

  it('anchors the next food check to the confirmed meal', () => {
    const [occurrence] = generateDynamicOccurrence({
      definition: foodDefinition,
      lastCompletedAt: '2026-09-06T08:15:00.000Z',
      now: at('2026-09-06T08:20:00.000Z'),
    });
    expect(new Date(occurrence.scheduledAt).toISOString()).toBe('2026-09-06T14:15:00.000Z');
  });

  it('generates nothing without a confirmation to anchor to', () => {
    expect(
      generateDynamicOccurrence({
        definition: foodDefinition,
        lastCompletedAt: null,
        now: at('2026-09-06T08:00:00.000Z'),
      })
    ).toEqual([]);
  });

  it('does not schedule a check whose time already passed', () => {
    expect(
      generateDynamicOccurrence({
        definition: foodDefinition,
        lastCompletedAt: '2026-09-05T08:00:00.000Z',
        now: at('2026-09-06T08:00:00.000Z'),
      })
    ).toEqual([]);
  });

  it('applies the bathroom interval independently', () => {
    const [occurrence] = generateDynamicOccurrence({
      definition: { id: 'b', type: 'BATHROOM', enabled: true, intervalMinutes: 180 },
      lastCompletedAt: '2026-09-06T10:00:00.000Z',
      now: at('2026-09-06T10:05:00.000Z'),
    });
    expect(new Date(occurrence.scheduledAt).toISOString()).toBe('2026-09-06T13:00:00.000Z');
  });
});

describe('reminder copy', () => {
  it('names the medicine and reads its instruction', () => {
    const message = buildReminderMessage('MEDICINE', {
      name: 'Napa',
      dosage: '1 tablet',
      instruction: 'After food',
    });
    expect(message.speech).toBe("It's time to take your Napa. After food");
  });

  it('falls back to the dose when there is no instruction', () => {
    const message = buildReminderMessage('MEDICINE', { name: 'Napa', dosage: '1 tablet' });
    expect(message.speech).toBe("It's time to take your Napa, 1 tablet.");
  });

  it('speaks only the name when nothing else was entered', () => {
    expect(buildReminderMessage('MEDICINE', { name: 'Napa' }).speech).toBe(
      "It's time to take your Napa."
    );
  });

  it('uses the documented sentence for each category', () => {
    expect(buildReminderMessage('WATER').speech).toBe('It is time to drink some water.');
    expect(buildReminderMessage('FOOD').speech).toContain('six hours');
    expect(buildReminderMessage('BATHROOM').speech).toBe(
      'A little reminder to take a bathroom break.'
    );
  });

  it('strips identifiers and markup so they are never read aloud', () => {
    expect(sanitiseForSpeech('Napa `*` 3f2504e0-4f89-11d3-9a0c-0305e82c3301')).toBe('Napa');
  });
});
