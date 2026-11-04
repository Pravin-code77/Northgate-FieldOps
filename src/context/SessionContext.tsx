import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Session } from '../models/Session';
import { User } from '../models/User';
import {
  authenticateEngineer,
  checkAuthStatus,
  enrollEngineer,
} from '../services/authService';
import {
  getCurrentActiveSession,
  logoutEngineer,
  startNewSession,
  touchSession,
} from '../services/sessionService';

interface SessionContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresEnrollment: boolean;
  login: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  enroll: () => Promise<boolean>;
  refreshSession: () => Promise<void>;
  touch: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [requiresEnrollment, setRequiresEnrollment] = useState<boolean>(false);

  const appState = useRef<AppStateStatus>((AppState.currentState || 'active') as AppStateStatus);

  // Initialize and check status on mount
  const checkStatus = async () => {
    try {
      setIsLoading(true);
      const authStatus = await checkAuthStatus();
      setUser(authStatus.primaryEngineer);

      if (!authStatus.isAppEnrolled) {
        setRequiresEnrollment(true);
        setIsAuthenticated(false);
        setSession(null);
        return;
      }

      setRequiresEnrollment(false);
      // Check if there is already an active, non-expired session
      const active = await getCurrentActiveSession();
      if (active) {
        setSession(active);
        setIsAuthenticated(true);
      } else {
        setSession(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('[SessionContext] Error checking auth status:', err);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // AppState listener for background / foreground lifecycle security
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has returned to the foreground: verify session validity
        const active = await getCurrentActiveSession();
        if (!active) {
          // Timeout occurred while in background: lock application
          setSession(null);
          setIsAuthenticated(false);
        } else {
          setSession(active);
          await touchSession(active.id);
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // Entering background: record last active
        if (session) {
          await touchSession(session.id);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [session]);

  const login = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await authenticateEngineer();
      if (result.success && user) {
        const newSession = await startNewSession(user.id);
        setSession(newSession);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutEngineer(session?.id);
      setSession(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const enroll = async (): Promise<boolean> => {
    if (!user) return false;
    setIsLoading(true);
    try {
      const success = await enrollEngineer(user.id);
      if (success) {
        setRequiresEnrollment(false);
        await checkStatus();
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async () => {
    await checkStatus();
  };

  const touch = () => {
    if (session) {
      touchSession(session.id);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        user,
        session,
        isAuthenticated,
        isLoading,
        requiresEnrollment,
        login,
        logout,
        enroll,
        refreshSession,
        touch,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
