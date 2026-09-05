import { migration001 } from './001_initial_schema';

/**
 * Ordered migration list. Append only — never edit or reorder a migration that
 * has already shipped, because installed devices have already applied it.
 */
export const migrations = [migration001];

export const LATEST_SCHEMA_VERSION = migrations.reduce(
  (highest, migration) => Math.max(highest, migration.version),
  0
);
