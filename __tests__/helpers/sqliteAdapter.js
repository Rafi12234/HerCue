const { DatabaseSync } = require('node:sqlite');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

/**
 * Adapts Node's built-in SQLite to the slice of the `expo-sqlite` async API the
 * repositories use, so they can be tested against real SQL and the real
 * migration rather than a hand-written fake.
 *
 * A temp file is used instead of `:memory:` because WAL is unavailable to
 * in-memory databases and `db.js` sets that pragma on open.
 */

function wrap(database) {
  return {
    async execAsync(sql) {
      database.exec(sql);
    },

    async runAsync(sql, params = []) {
      const result = database.prepare(sql).run(...params);
      return {
        changes: Number(result.changes ?? 0),
        lastInsertRowId: Number(result.lastInsertRowid ?? 0),
      };
    },

    async getAllAsync(sql, params = []) {
      return database.prepare(sql).all(...params);
    },

    async getFirstAsync(sql, params = []) {
      return database.prepare(sql).get(...params) ?? null;
    },

    /** Mirrors expo-sqlite: the transaction rolls back if the callback throws. */
    async withTransactionAsync(run) {
      database.exec('BEGIN');
      try {
        await run();
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },

    closeSync() {
      database.close();
    },
  };
}

function createTestDatabase() {
  const directory = mkdtempSync(join(tmpdir(), 'hercue-test-'));
  const database = new DatabaseSync(join(directory, 'hercue.db'));

  return {
    db: wrap(database),
    cleanup() {
      try {
        database.close();
      } catch {
        // Already closed by the test; nothing to recover.
      }
      rmSync(directory, { recursive: true, force: true });
    },
  };
}

module.exports = { createTestDatabase };
