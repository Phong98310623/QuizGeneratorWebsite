import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User } from '../../types';
import { setAdminOnUnauthorized, adminApi } from '../services/adminApi';

const ADMIN_USER_COOKIE = 'admin_auth_user';
const COOKIE_MAX_AGE_DAYS = 7;

function getAdminUserCookie(): User | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + ADMIN_USER_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as User;
  } catch {
    return null;
  }
}

function setAdminUserCookie(user: User): void {
  if (typeof document === 'undefined') return;
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${ADMIN_USER_COOKIE}=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearAdminUserCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ADMIN_USER_COOKIE}=; path=/; max-age=0`;
}

interface AdminAuthContextType {
  user: User | null;
  token: null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    adminApi.logout();
    clearAdminUserCookie();
    setUser(null);
  }, []);

  useEffect(() => {
    const stored = getAdminUserCookie();
    if (stored && stored.role === 'ADMIN') {
      setUser(stored);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setAdminOnUnauthorized(logout);
  }, [logout]);

  const login = (userData: User) => {
    setAdminUserCookie(userData);
    setUser(userData);
  };

  const value: AdminAuthContextType = {
    user,
    token: null,
    isAuthenticated: !!user && user.role === 'ADMIN',
    isLoading,
    login,
    logout,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = (): AdminAuthContextType => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
};

