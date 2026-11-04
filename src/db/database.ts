import * as SQLite from 'expo-sqlite';
import AppConfig from '../constants/config';
import { runMigrations } from './migrations';
import { seedDatabaseIfEmpty } from './seed/seedData';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync(AppConfig.dbName);

      // Enable foreign key enforcement as explicitly required by PRD Section 9
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await db.execAsync('PRAGMA journal_mode = WAL;');

      // Run schema migrations
      await runMigrations(db);

      // Seed initial industrial reference data idempotently
      await seedDatabaseIfEmpty(db);

      dbInstance = db;
      return db;
    } catch (error) {
      console.error('[Database] Failed to initialize SQLite database:', error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Reset database (for controlled testing purposes, gated by confirmation)
 */
export async function resetDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
    initPromise = null;
  }
  await SQLite.deleteDatabaseAsync(AppConfig.dbName);
  await getDatabase();
}
