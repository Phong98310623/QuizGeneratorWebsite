import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../../types';

interface AdminAuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('admin_auth_user');
    const storedToken = localStorage.getItem('admin_auth_token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } catch {
        localStorage.removeItem('admin_auth_user');
        localStorage.removeItem('admin_auth_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, jwt: string) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('admin_auth_user', JSON.stringify(userData));
    localStorage.setItem('admin_auth_token', jwt);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('admin_auth_user');
    localStorage.removeItem('admin_auth_token');
  };

  const value: AdminAuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token && user.role === 'ADMIN',
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

