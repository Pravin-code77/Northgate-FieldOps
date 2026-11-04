import { Session } from '../models/Session';
import { addAuditLog } from '../repositories/logRepository';
import {
  createSession,
  expireAllActiveSessions,
  getActiveSession,
  terminateSession,
  updateLastActive,
} from '../repositories/sessionRepository';
import { getSetting } from '../repositories/settingsRepository';
import AppConfig from '../constants/config';
import { getNowIso } from '../utils/dateTime';

export async function startNewSession(userId: number): Promise<Session> {
  const timeoutStr = await getSetting(
    'session_timeout_minutes',
    AppConfig.defaultSessionTimeoutMinutes.toString()
  );
  const timeoutMinutes = parseInt(timeoutStr, 10) || AppConfig.defaultSessionTimeoutMinutes;

  const now = new Date();
  const expiresDate = new Date(now.getTime() + timeoutMinutes * 60 * 1000);
  const expiresAt = expiresDate.toISOString();

  const session = await createSession(userId, expiresAt);
  await addAuditLog({
    user_id: userId,
    event_type: 'session_started',
    detail: `Session created. Timeout set to ${timeoutMinutes} minutes.`,
  });

  return session;
}

export async function getCurrentActiveSession(): Promise<Session | null> {
  const session = await getActiveSession();
  if (!session) return null;

  // Check if already expired
  const now = new Date().getTime();
  const expiresTime = new Date(session.expires_at).getTime();

  if (now > expiresTime) {
    await terminateSession(session.id, 'expired');
    await addAuditLog({
      user_id: session.user_id,
      event_type: 'session_timeout',
      detail: 'Session expired due to inactivity timeout.',
    });
    return null;
  }

  return session;
}

export async function touchSession(sessionId: number): Promise<void> {
  try {
    const timeoutStr = await getSetting(
      'session_timeout_minutes',
      AppConfig.defaultSessionTimeoutMinutes.toString()
    );
    const timeoutMinutes = parseInt(timeoutStr, 10) || AppConfig.defaultSessionTimeoutMinutes;

    const now = new Date();
    const lastActiveAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + timeoutMinutes * 60 * 1000).toISOString();

    await updateLastActive(sessionId, lastActiveAt, expiresAt);
  } catch (err) {
    console.warn('[SessionService] Failed to touch session:', err);
  }
}

export async function logoutEngineer(sessionId?: number): Promise<void> {
  if (sessionId) {
    await terminateSession(sessionId, 'terminated');
  } else {
    await expireAllActiveSessions();
  }

  await addAuditLog({
    user_id: 1,
    event_type: 'logout',
    detail: 'Engineer signed out. Local operational records preserved.',
  });
}
