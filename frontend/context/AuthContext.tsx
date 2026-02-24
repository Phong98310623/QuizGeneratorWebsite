import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { setAuthCallbacks, setAuthUserCookie, getAuthUserCookie, clearAuthUserCookie } from '../services/api';
import { authService } from '../services/api';
import { initTheme } from '../utils/theme';

interface AuthContextType extends AuthState {
  login: (user: User, _accessToken?: string, _refreshToken?: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setTokens?: (accessToken: string, refreshToken: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const logout = useCallback(() => {
    authService.logout();
    clearAuthUserCookie();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    // Re-initialize theme without VIP status on logout
    initTheme(false);
  }, []);

  useEffect(() => {
    const savedUser = getAuthUserCookie();
    if (savedUser) {
      setState({
        user: savedUser,
        isAuthenticated: true,
        isLoading: false,
      });
      // Initialize theme with VIP status
      initTheme(savedUser.role === 'VIP');
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
      initTheme(false);
    }
  }, []);

  useEffect(() => {
    setAuthCallbacks({ onUnauthorized: logout });
  }, [logout]);

  const login = (user: User, _accessToken?: string, _refreshToken?: string) => {
    setAuthUserCookie(user);
    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
    initTheme(user.role === 'VIP');
  };

  const refreshUser = useCallback(async () => {
    try {
      const res = await authService.getMe();
      if (res.success && res.data) {
        setAuthUserCookie(res.data);
        setState({ user: res.data, isAuthenticated: true, isLoading: false });
        initTheme(res.data.role === 'VIP');
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
