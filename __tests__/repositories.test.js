import { createTestDatabase } from './helpers/sqliteAdapter';

/**
 * Repository tests against real SQLite.
 *
 * `expo-sqlite` is swapped for Node's built-in SQLite, so the actual migration
 * runs and the actual SQL is executed — constraints, foreign keys and indexes
 * included. Only the driver is substituted; nothing else is mocked.
 */

let harness;

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: async () => global.__TEST_DB__,
}));

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));

jest.mock('expo-crypto', () => ({
  randomUUID: () => require('node:crypto').randomUUID(),
}));

const loadModules = () => ({
  db: require('../src/database/db'),
  activities: require('../src/database/repositories/activityRepository'),
  medicines: require('../src/database/repositories/medicineRepository'),
  reminders: require('../src/database/repositories/reminderRepository'),
  notifications: require('../src/database/repositories/notificationRepository'),
  periods: require('../src/database/repositories/periodRepository'),
  settings: require('../src/database/repositories/settingsRepository'),
});

let modules;

beforeEach(async () => {
  jest.resetModules();
  harness = createTestDatabase();
  global.__TEST_DB__ = harness.db;

  modules = loadModules();
  await modules.db.initializeDatabase();
});

afterEach(() => {
  harness.cleanup();
  delete global.__TEST_DB__;
});

describe('migrations', () => {
  it('creates every V1 table', async () => {
    const rows = await harness.db.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;"
    );
    const names = rows.map((row) => row.name);

    expect(names).toEqual(
      expect.arrayContaining([
        'activity_logs',
        'app_settings',
        'medicine_schedules',
        'medicines',
        'notification_history',
        'period_cycles',
        'reminder_definitions',
        'reminder_occurrences',
        'schema_migrations',
      ])
    );
  });

  it('is repeat-safe', async () => {
    await modules.db.initializeDatabase();
    const rows = await harness.db.getAllAsync('SELECT version FROM schema_migrations;');
    expect(rows).toHaveLength(1);
  });
});

describe('activityRepository', () => {
  it('round-trips an activity', async () => {
    const created = await modules.activities.createActivity({
      type: 'WATER',
      action: 'DRANK',
      status: 'COMPLETED',
      occurredAt: new Date('2026-09-06T09:00:00.000Z'),
      source: 'MANUAL',
      valueNumeric: 1,
    });

    expect(created.id).toBeTruthy();
    const fetched = await modules.activities.getActivityById(created.id);
    expect(fetched).toMatchObject({ type: 'WATER', action: 'DRANK', valueNumeric: 1 });
  });

  it('returns the latest activity of a type', async () => {
    await modules.activities.createActivity({
      type: 'FOOD',
      action: 'ATE',
      status: 'COMPLETED',
      occurredAt: new Date('2026-09-06T08:00:00.000Z'),
    });
    await modules.activities.createActivity({
      type: 'FOOD',
      action: 'ATE',
      status: 'COMPLETED',
      occurredAt: new Date('2026-09-06T14:00:00.000Z'),
    });

    const latest = await modules.activities.getLatestActivityByType('FOOD', { action: 'ATE' });
    expect(latest.occurredAt).toBe('2026-09-06T14:00:00.000Z');
  });

  it('filters by range and excludes rows outside it', async () => {
    await modules.activities.createActivity({
      type: 'WATER',
      action: 'DRANK',
      status: 'COMPLETED',
      occurredAt: new Date('2026-09-06T09:00:00.000Z'),
    });
    await modules.activities.createActivity({
      type: 'WATER',
      action: 'DRANK',
      status: 'COMPLETED',
      occurredAt: new Date('2026-09-01T09:00:00.000Z'),
    });

    const rows = await modules.activities.getActivitiesForRange(
      new Date('2026-09-06T00:00:00.000Z'),
      new Date('2026-09-06T23:59:59.000Z')
    );
    expect(rows).toHaveLength(1);
  });

  it('counts by type and action', async () => {
    for (const hour of ['08', '10', '12']) {
      await modules.activities.createActivity({
        type: 'WATER',
        action: 'DRANK',
        status: 'COMPLETED',
        occurredAt: new Date(`2026-09-06T${hour}:00:00.000Z`),
      });
    }
    expect(await modules.activities.countActivities({ type: 'WATER', action: 'DRANK' })).toBe(3);
  });
});

describe('periodRepository', () => {
  it('stores and reads cycles oldest first', async () => {
    await modules.periods.createPeriodCycle({ startDate: '2026-08-12' });
    await modules.periods.createPeriodCycle({ startDate: '2026-09-09' });

    const cycles = await modules.periods.getPeriodCycles();
    expect(cycles.map((c) => c.startDate)).toEqual(['2026-08-12', '2026-09-09']);
  });

  it('rejects a duplicate start date at the database level', async () => {
    await modules.periods.createPeriodCycle({ startDate: '2026-08-12' });
    await expect(
      modules.periods.createPeriodCycle({ startDate: '2026-08-12' })
    ).rejects.toThrow();
  });

  it('rejects an end date before the start date', async () => {
    await expect(
      modules.periods.createPeriodCycle({ startDate: '2026-08-12', endDate: '2026-08-10' })
    ).rejects.toThrow();
  });

  it('updates and deletes a cycle', async () => {
    const cycle = await modules.periods.createPeriodCycle({ startDate: '2026-08-12' });
    const updated = await modules.periods.updateCycle(cycle.id, { endDate: '2026-08-16' });
    expect(updated.endDate).toBe('2026-08-16');

    expect(await modules.periods.deleteCycle(cycle.id)).toBe(true);
    expect(await modules.periods.getPeriodCycles()).toHaveLength(0);
  });
});

describe('medicineRepository', () => {
  it('creates a medicine with schedules and reads them back together', async () => {
    const medicine = await modules.medicines.createMedicine({ name: 'Napa', dosage: '1 tablet' });
    await modules.medicines.createMedicineSchedule({
      medicineId: medicine.id,
      timeOfDay: '09:00',
    });
    await modules.medicines.createMedicineSchedule({
      medicineId: medicine.id,
      timeOfDay: '21:00',
    });

    const [withSchedules] = await modules.medicines.getActiveMedicinesWithSchedules();
    expect(withSchedules.name).toBe('Napa');
    expect(withSchedules.schedules.map((s) => s.timeOfDay)).toEqual(['09:00', '21:00']);
  });

  it('cascades schedule deletion when the medicine row goes', async () => {
    const medicine = await modules.medicines.createMedicine({ name: 'Iron' });
    await modules.medicines.createMedicineSchedule({
      medicineId: medicine.id,
      timeOfDay: '09:00',
    });

    await harness.db.runAsync('DELETE FROM medicines WHERE id = ?;', [medicine.id]);
    expect(await modules.medicines.getMedicineSchedules(medicine.id)).toHaveLength(0);
  });

  it('archives without deleting, so history keeps its meaning', async () => {
    const medicine = await modules.medicines.createMedicine({ name: 'Vitamin D' });
    await modules.medicines.archiveMedicine(medicine.id);

    expect(await modules.medicines.getActiveMedicines()).toHaveLength(0);
    expect(await modules.medicines.getMedicine(medicine.id)).toBeTruthy();
  });

  it('rejects an end date before the start date', async () => {
    await expect(
      modules.medicines.createMedicine({
        name: 'Bad',
        startDate: '2026-09-10',
        endDate: '2026-09-01',
      })
    ).rejects.toThrow();
  });
});

describe('reminderRepository', () => {
  const occurrence = (overrides = {}) => ({
    occurrenceKey: 'water:def-1:2026-09-06T08:00:00.000Z',
    type: 'WATER',
    scheduledAt: new Date('2026-09-06T08:00:00.000Z'),
    ...overrides,
  });

  it('never creates two rows for the same occurrence key', async () => {
    const first = await modules.reminders.createOccurrence(occurrence());
    const second = await modules.reminders.createOccurrence(occurrence());

    expect(second.id).toBe(first.id);
    const rows = await harness.db.getAllAsync('SELECT id FROM reminder_occurrences;');
    expect(rows).toHaveLength(1);
  });

  it('moves an occurrence through its lifecycle', async () => {
    const created = await modules.reminders.createOccurrence(occurrence());
    expect(created.status).toBe('PENDING');

    const completed = await modules.reminders.markOccurrenceCompleted(
      created.id,
      new Date('2026-09-06T08:05:00.000Z')
    );
    expect(completed.status).toBe('COMPLETED');
    expect(completed.completedAt).toBe('2026-09-06T08:05:00.000Z');
  });

  it('links a snooze child to its parent', async () => {
    const parent = await modules.reminders.createOccurrence(occurrence());
    const child = await modules.reminders.createOccurrence(
      occurrence({
        occurrenceKey: `${parent.id}:snooze:1`,
        parentOccurrenceId: parent.id,
        scheduledAt: new Date('2026-09-06T08:15:00.000Z'),
      })
    );

    expect(child.parentOccurrenceId).toBe(parent.id);
  });

  it('returns only open occurrences as pending', async () => {
    const a = await modules.reminders.createOccurrence(occurrence());
    await modules.reminders.createOccurrence(
      occurrence({
        occurrenceKey: 'water:def-1:2026-09-06T10:00:00.000Z',
        scheduledAt: new Date('2026-09-06T10:00:00.000Z'),
      })
    );
    await modules.reminders.markOccurrenceCompleted(a.id, new Date());

    const pending = await modules.reminders.getPendingOccurrences();
    expect(pending).toHaveLength(1);
  });

  it('seeds a reminder definition only once', async () => {
    await modules.reminders.ensureReminderDefinition({ type: 'WATER', intervalMinutes: 120 });
    await modules.reminders.ensureReminderDefinition({ type: 'WATER', intervalMinutes: 999 });

    const definition = await modules.reminders.getReminderDefinitionByType('WATER');
    expect(definition.intervalMinutes).toBe(120);
  });
});

describe('notificationRepository', () => {
  const entry = (overrides = {}) => ({
    type: 'WATER',
    title: 'Water',
    body: 'Time to drink some water.',
    deliveredAt: '2026-09-06T08:00:00.000Z',
    ...overrides,
  });

  it('tracks unread count and marks all read', async () => {
    await modules.notifications.createNotificationHistory(entry());
    await modules.notifications.createNotificationHistory(entry({ type: 'FOOD', title: 'Food' }));

    expect(await modules.notifications.getUnreadCount()).toBe(2);
    await modules.notifications.markAllRead();
    expect(await modules.notifications.getUnreadCount()).toBe(0);
  });

  it('deleting an inbox record leaves activity history untouched', async () => {
    const activity = await modules.activities.createActivity({
      type: 'WATER',
      action: 'DRANK',
      status: 'COMPLETED',
      occurredAt: new Date(),
    });
    const record = await modules.notifications.createNotificationHistory(entry());

    await modules.notifications.deleteInboxRecord(record.id);

    expect(await modules.notifications.getNotificationHistory()).toHaveLength(0);
    expect(await modules.activities.getActivityById(activity.id)).toBeTruthy();
  });
});

describe('settingsRepository', () => {
  it('round-trips typed values', async () => {
    await modules.settings.setSetting('voice_enabled', true);
    await modules.settings.setSetting('default_snooze_minutes', 15);

    expect(await modules.settings.getSetting('voice_enabled')).toBe(true);
    expect(await modules.settings.getSetting('default_snooze_minutes')).toBe(15);
  });

  it('overwrites rather than duplicating a key', async () => {
    await modules.settings.setSetting('water_daily_goal', 8);
    await modules.settings.setSetting('water_daily_goal', 10);

    expect(await modules.settings.getSetting('water_daily_goal')).toBe(10);
    const rows = await harness.db.getAllAsync(
      "SELECT key FROM app_settings WHERE key = 'water_daily_goal';"
    );
    expect(rows).toHaveLength(1);
  });

  it('falls back when a key was never stored', async () => {
    expect(await modules.settings.getSetting('missing_key', 'fallback')).toBe('fallback');
  });
});

describe('transactions', () => {
  it('rolls back every write when one fails', async () => {
    await expect(
      modules.db.withTransaction(async (db) => {
        await modules.activities.createActivity(
          { type: 'WATER', action: 'DRANK', status: 'COMPLETED', occurredAt: new Date() },
          db
        );
        await modules.periods.createPeriodCycle({ startDate: 'not-a-date-!!' }, db);
        // Violates the end_date CHECK, so the whole transaction must unwind.
        await modules.periods.createPeriodCycle(
          { startDate: '2026-01-01', endDate: '2025-01-01' },
          db
        );
      })
    ).rejects.toThrow();

    expect(await modules.activities.getActivitiesForRange(new Date(0), new Date())).toHaveLength(0);
  });
});
