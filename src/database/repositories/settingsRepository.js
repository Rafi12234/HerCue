import { getDatabase } from '../db';
import { nowIso } from '../../utils/dates';

/**
 * Key/value access to `app_settings`.
 *
 * Values are stored JSON-encoded so booleans, numbers and small objects all
 * round-trip without a per-setting column.
 */

export async function getSetting(key, fallback = null) {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT value FROM app_settings WHERE key = ?;', [key]);
  if (!row || row.value == null) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return fallback;
  }
}

export async function getAllSettings() {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT key, value FROM app_settings;');
  return rows.reduce((accumulator, row) => {
    try {
      accumulator[row.key] = JSON.parse(row.value);
    } catch {
      accumulator[row.key] = null;
    }
    return accumulator;
  }, {});
}

export async function setSetting(key, value) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    [key, JSON.stringify(value ?? null), nowIso()]
  );
}

export async function setSettings(entries) {
  const db = await getDatabase();
  const timestamp = nowIso();
  await db.withTransactionAsync(async () => {
    for (const [key, value] of Object.entries(entries)) {
      await db.runAsync(
        `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
        [key, JSON.stringify(value ?? null), timestamp]
      );
    }
  });
}
