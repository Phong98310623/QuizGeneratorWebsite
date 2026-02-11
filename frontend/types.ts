
export interface User {
  id: string;
  email: string;
  fullName: string;
  role?: 'ADMIN' | 'USER' | string;
  status?: 'ACTIVE' | 'INACTIVE' | 'BANNED' | string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
