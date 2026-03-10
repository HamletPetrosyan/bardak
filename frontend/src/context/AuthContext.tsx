import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearSessionToken, getSessionToken, saveSessionToken } from '../lib/authStorage';
import { getCurrentSession, loginWithAccountKey, logoutSession, updateDisplayName } from '../lib/api';
import type { PublicUser } from '../types';

type AuthContextValue = {
  user: PublicUser | null;
  token: string | null;
  isLoading: boolean;
  loginError: string | null;
  login: (accountKey: string) => Promise<boolean>;
  logout: () => Promise<void>;
  changeDisplayName: (nextName: string) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = getSessionToken();

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);

    getCurrentSession(storedToken)
      .then((result) => {
        setUser(result.user);
      })
      .catch(() => {
        clearSessionToken();
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  async function login(accountKey: string): Promise<boolean> {
    setLoginError(null);

    try {
      const result = await loginWithAccountKey(accountKey);
      saveSessionToken(result.token);
      setToken(result.token);
      setUser(result.user);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'չկարողացանք բացել';
      setLoginError(message);
      return false;
    }
  }

  async function logout(): Promise<void> {
    if (token) {
      try {
        await logoutSession(token);
      } catch {
        // Clear local session even if backend request fails.
      }
    }

    clearSessionToken();
    setToken(null);
    setUser(null);
    setLoginError(null);
  }

  async function changeDisplayName(nextName: string): Promise<string | null> {
    if (!token) {
      return 'նույնականացումը չստացվեց';
    }

    try {
      const result = await updateDisplayName(token, nextName);
      setUser(result.user);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'փոխելը չստացվեց';
    }
  }

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      loginError,
      login,
      logout,
      changeDisplayName
    }),
    [user, token, isLoading, loginError]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
