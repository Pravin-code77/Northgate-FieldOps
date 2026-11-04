import { getDatabase } from '../db/database';
import { Session } from '../models/Session';
import { getNowIso } from '../utils/dateTime';

export async function createSession(userId: number, expiresAt: string): Promise<Session> {
  const db = await getDatabase();
  const now = getNowIso();

  // Expire any existing active sessions first
  await db.runAsync(
    "UPDATE sessions SET status = 'expired' WHERE status = 'active';"
  );

  const result = await db.runAsync(
    `INSERT INTO sessions (user_id, started_at, last_active_at, expires_at, status)
     VALUES (?, ?, ?, ?, 'active');`,
    userId,
    now,
    now,
    expiresAt
  );

  return {
    id: result.lastInsertRowId,
    user_id: userId,
    started_at: now,
    last_active_at: now,
    expires_at: expiresAt,
    status: 'active',
  };
}

export async function getActiveSession(): Promise<Session | null> {
  const db = await getDatabase();
  const session = await db.getFirstAsync<Session>(
    "SELECT * FROM sessions WHERE status = 'active' ORDER BY id DESC LIMIT 1;"
  );
  return session ?? null;
}

export async function updateLastActive(
  sessionId: number,
  lastActiveAt: string,
  expiresAt: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE sessions SET last_active_at = ?, expires_at = ? WHERE id = ?;',
    lastActiveAt,
    expiresAt,
    sessionId
  );
}

export async function terminateSession(
  sessionId: number,
  status: 'expired' | 'terminated' = 'terminated'
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE sessions SET status = ? WHERE id = ?;',
    status,
    sessionId
  );
}

export async function expireAllActiveSessions(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE sessions SET status = 'expired' WHERE status = 'active';"
  );
}
