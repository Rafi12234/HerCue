import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

import { nowIso } from '../utils/dates';
import { LOG_CATEGORY, logger } from '../utils/logger';
import { LATEST_SCHEMA_VERSION, migrations } from './migrations';

const DATABASE_NAME = 'hercue.db';

let databasePromise = null;

export class DatabaseError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'DatabaseError';
    this.cause = cause;
  }
}

async function applyPragmas(db) {
  // WAL keeps reads responsive while a reminder action writes; foreign keys are
  // off by default in SQLite and the schema relies on them.
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
}

async function ensureMigrationsTable(db) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY NOT NULL,
      name       TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
}

async function appliedVersions(db) {
  const rows = await db.getAllAsync('SELECT version FROM schema_migrations;');
  return new Set(rows.map((row) => row.version));
}

async function runMigrations(db) {
  await ensureMigrationsTable(db);
  const applied = await appliedVersions(db);

  const pending = migrations
    .filter((migration) => !applied.has(migration.version))
    .sort((a, b) => a.version - b.version);

  if (pending.length === 0) {
    logger.debug(LOG_CATEGORY.DB, `Schema up to date at v${LATEST_SCHEMA_VERSION}`);
    return { appliedCount: 0, version: LATEST_SCHEMA_VERSION };
  }

  for (const migration of pending) {
    // Each migration is its own transaction so a later failure cannot leave an
    // earlier one half-applied.
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.runAsync(
        'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?);',
        [migration.version, migration.name, nowIso()]
      );
    });
  }

  return { appliedCount: pending.length, version: LATEST_SCHEMA_VERSION };
}

async function open() {
  if (Platform.OS === 'web') {
    throw new DatabaseError('HerCue storage is only available on a device build.');
  }

  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await applyPragmas(db);
  return db;
}

/** Opens (once) and returns the shared connection. */
export function getDatabase() {
  if (!databasePromise) {
    databasePromise = open().catch((error) => {
      databasePromise = null;
      throw new DatabaseError('Could not open the local database.', error);
    });
  }
  return databasePromise;
}

/**
 * SQLite has no nested transactions, so repository functions take an optional
 * executor: passed one, they join the caller's transaction; passed nothing,
 * they run standalone on the shared connection.
 */
export async function resolveExecutor(executor) {
  return executor ?? (await getDatabase());
}

/** Called once during app bootstrap, before any repository is used. */
export async function initializeDatabase() {
  const db = await getDatabase();
  const result = await runMigrations(db);
  logger.info(
    LOG_CATEGORY.DB,
    `Database ready (v${result.version}, ${result.appliedCount} migration(s) applied)`
  );
  return result;
}

/** Wraps multi-step writes so an occurrence and its activity row stay consistent. */
export async function withTransaction(run) {
  const db = await getDatabase();
  let result;
  await db.withTransactionAsync(async () => {
    result = await run(db);
  });
  return result;
}

/**
 * Drops all user data. Callers must cancel scheduled alarms first — see
 * `docs/06_DATABASE_AND_DATA_MODEL.md` §10.
 */
export async function resetDatabase() {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DELETE FROM activity_logs;
      DELETE FROM notification_history;
      DELETE FROM reminder_occurrences;
      DELETE FROM medicine_schedules;
      DELETE FROM medicines;
      DELETE FROM period_cycles;
      DELETE FROM reminder_definitions;
      DELETE FROM app_settings;
    `);
  });
  logger.warn(LOG_CATEGORY.DB, 'All local data cleared');
}
