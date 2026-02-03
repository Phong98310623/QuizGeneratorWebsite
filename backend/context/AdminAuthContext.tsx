import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'MOD';
  status: string;
  total_score: number;
  created_at: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, userData: AdminUser) => void;
  logout: () => void;
  verifyToken: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load từ localStorage khi component mount
  useEffect(() => {
    console.log('[AdminAuthContext] Loading from localStorage...');
    const storedToken = localStorage.getItem('admin_access_token');
    const storedUser = localStorage.getItem('admin_user');

    console.log('[AdminAuthContext] Stored token exists:', !!storedToken);
    console.log('[AdminAuthContext] Stored user exists:', !!storedUser);

    if (storedToken && storedUser) {
      console.log('[AdminAuthContext] Found stored token and user, setting state...');
      setToken(storedToken);
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('[AdminAuthContext] Parsed user:', parsedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('[AdminAuthContext] Error parsing stored user:', e);
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
      }
    } else {
      console.log('[AdminAuthContext] No stored token or user found');
    }
    setIsLoading(false);
    console.log('[AdminAuthContext] Initial load complete');
  }, []);

  const verifyToken = async (): Promise<boolean> => {
    console.log('[AdminAuthContext] verifyToken called');
    
    // Lấy token từ localStorage nếu chưa có trong state
    const currentToken = token || localStorage.getItem('admin_access_token');
    console.log('[AdminAuthContext] Token from state:', token ? 'exists' : 'null');
    console.log('[AdminAuthContext] Token from localStorage:', currentToken ? `${currentToken.substring(0, 20)}...` : 'null');
    
    if (!currentToken) {
      console.warn('[AdminAuthContext] No token found, logging out');
      logout();
      return false;
    }

    // Decode token để xem payload
    try {
      const tokenParts = currentToken.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('[AdminAuthContext] Token payload:', payload);
        console.log('[AdminAuthContext] Token payload keys:', Object.keys(payload));
        console.log('[AdminAuthContext] Token user_id:', payload.user_id);
      }
    } catch (e) {
      console.warn('[AdminAuthContext] Could not decode token:', e);
    }

    try {
      console.log('[AdminAuthContext] Sending verify request to:', 'http://localhost:8000/api/accounts/admin/verify-token/');
      const response = await fetch('http://localhost:8000/api/accounts/admin/verify-token/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[AdminAuthContext] Response status:', response.status);
      console.log('[AdminAuthContext] Response ok:', response.ok);

      // Nếu token không hợp lệ, clear và return false
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AdminAuthContext] ${response.status} Error - Response:`, errorText);
        
        // Nếu là 401, token không hợp lệ hoặc hết hạn
        if (response.status === 401) {
          try {
            const errorJson = JSON.parse(errorText);
            console.error('[AdminAuthContext] 401 Error details:', errorJson);
          } catch (e) {
            console.error('[AdminAuthContext] Could not parse error response');
          }
          console.warn('[AdminAuthContext] Token verification failed: Unauthorized');
          logout();
          return false;
        }
        
        // Nếu là 500, server error
        if (response.status === 500) {
          try {
            const errorJson = JSON.parse(errorText);
            console.error('[AdminAuthContext] 500 Server Error details:', errorJson);
          } catch (e) {
            console.error('[AdminAuthContext] 500 Server Error - Raw response:', errorText);
          }
          // Không logout ngay, có thể là server issue tạm thời
          console.warn('[AdminAuthContext] Server error during token verification');
          return false;
        }
        
        // Các lỗi khác
        try {
          const errorData = JSON.parse(errorText);
          console.error('[AdminAuthContext] Token verification error:', errorData);
        } catch (e) {
          console.error('[AdminAuthContext] Could not parse error response');
        }
        logout();
        return false;
      }

      const data = await response.json();
      console.log('[AdminAuthContext] Verify response data:', data);
      
      if (data.valid && data.user) {
        console.log('[AdminAuthContext] Token is valid, user:', data.user);
        // Cập nhật user data nếu có thay đổi
        setUser(data.user);
        setToken(currentToken);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        localStorage.setItem('admin_access_token', currentToken);
        return true;
      }

      console.warn('[AdminAuthContext] Token verification returned invalid or no user');
      logout();
      return false;
    } catch (error) {
      console.error('[AdminAuthContext] Token verification failed with exception:', error);
      logout();
      return false;
    }
  };

  const login = (accessToken: string, refreshToken: string, userData: AdminUser) => {
    console.log('[AdminAuthContext] login called');
    console.log('[AdminAuthContext] accessToken:', accessToken ? `${accessToken.substring(0, 20)}...` : 'null');
    console.log('[AdminAuthContext] userData:', userData);
    
    localStorage.setItem('admin_access_token', accessToken);
    localStorage.setItem('admin_refresh_token', refreshToken);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    
    console.log('[AdminAuthContext] Token saved to localStorage');
    console.log('[AdminAuthContext] User saved to localStorage');
    
    setToken(accessToken);
    setUser(userData);
    
    console.log('[AdminAuthContext] State updated');
  };

  const logout = () => {
    console.log('[AdminAuthContext] logout called');
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
    console.log('[AdminAuthContext] Logged out, cleared localStorage and state');
  };

  const value: AdminAuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token && (user.role === 'ADMIN' || user.role === 'MOD'),
    isLoading,
    login,
    logout,
    verifyToken,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};
