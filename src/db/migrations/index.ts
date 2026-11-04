import { SQLiteDatabase } from 'expo-sqlite';
import { SCHEMA_SQL } from '../schema';

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < 1) {
    // Migration v1: Initial 12-table schema and indexes
    await db.execAsync(SCHEMA_SQL);
    await db.execAsync('PRAGMA user_version = 1;');
  }
}
