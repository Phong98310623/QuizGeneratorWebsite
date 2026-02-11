import { User, ApiResponse } from '../types';

const API_BASE_URL = process.env.API_BASE_URL || "";

/** Map backend user response to frontend User */
const mapBackendUser = (data: Record<string, unknown>): User => ({
  id: String(data.id ?? data._id ?? ''),
  email: String(data.email ?? ''),
  fullName: String(data.username ?? data.email ?? ''),
  role: data.role ? String(data.role) : undefined,
  status: data.status ? String(data.status) : undefined,
  createdAt: data.createdAt ? String(data.createdAt) : new Date().toISOString(),
});

/** Parse response body - tránh lỗi khi server trả HTML thay vì JSON */
const parseResponse = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (response.ok) return null;
    return {
      detail:
        response.status === 404
          ? 'API không tồn tại. Kiểm tra backend đã chạy tại http://127.0.0.1:3000'
          : `Lỗi server ${response.status}`,
    };
  }
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { detail: 'Invalid JSON response' };
  }
};

/** Parse Django/DRF error response to string */
const parseError = (data: unknown): string => {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (obj.detail) return String(obj.detail);
    const messages: string[] = [];
    for (const [, val] of Object.entries(obj)) {
      if (Array.isArray(val)) messages.push(...val.map(String));
      else if (val) messages.push(String(val));
    }
    if (messages.length) return messages.join('. ');
  }
  return 'Đã có lỗi xảy ra';
};

export const authService = {
  register: async (fullName: string, email: string, password: string): Promise<ApiResponse<User>> => {
    try {
      const username = email;
      const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        return { success: false, error: parseError(data) };
      }

      return { success: true, data: mapBackendUser(((data as any)?.data ?? data ?? {}) as Record<string, unknown>) };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Không thể kết nối đến server',
      };
    }
  },

  login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        return { success: false, error: parseError(data) };
      }

      const payload = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
      const rawUser = (payload.data ?? payload.user ?? payload) as Record<string, unknown>;
      const user = mapBackendUser(rawUser);
      const token = String(payload.access ?? payload.token ?? rawUser.token ?? '');

      return { success: true, data: { user, token } };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Không thể kết nối đến server',
      };
    }
  },

  logout: async (): Promise<void> => {
    // JWT không cần gọi API logout - token sẽ hết hạn
  },
};
