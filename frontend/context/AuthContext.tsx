import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { setAuthCallbacks, setAuthUserCookie, getAuthUserCookie, clearAuthUserCookie } from '../services/api';
import { authService } from '../services/api';

interface AuthContextType extends AuthState {
  login: (user: User, _accessToken?: string, _refreshToken?: string) => void;
  logout: () => void;
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
  }, []);

  useEffect(() => {
    const savedUser = getAuthUserCookie();
    if (savedUser) {
      setState({
        user: savedUser,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
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
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
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
