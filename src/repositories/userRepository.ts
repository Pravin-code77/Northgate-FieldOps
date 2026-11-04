import { getDatabase } from '../db/database';
import { User } from '../models/User';

export async function getPrimaryUser(): Promise<User | null> {
  const db = await getDatabase();
  const user = await db.getFirstAsync<User>(
    'SELECT * FROM users ORDER BY id ASC LIMIT 1;'
  );
  return user ?? null;
}

export async function getUserById(id: number): Promise<User | null> {
  const db = await getDatabase();
  const user = await db.getFirstAsync<User>(
    'SELECT * FROM users WHERE id = ?;',
    id
  );
  return user ?? null;
}

export async function updateBiometricEnrolled(userId: number, enrolled: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE users SET biometric_enrolled = ? WHERE id = ?;',
    enrolled ? 1 : 0,
    userId
  );
}
