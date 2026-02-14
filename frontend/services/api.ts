import { User, ApiResponse } from '../types';

const API_BASE_URL = process.env.API_BASE_URL || "";

/** Map backend user response to frontend User */
const mapBackendUser = (data: Record<string, unknown>): User => ({
  id: String(data.id ?? data._id ?? ''),
  email: String(data.email ?? ''),
  fullName: String(data.username ?? data.email ?? ''),
  avatar: data.avatar != null ? String(data.avatar) : undefined,
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

  updateProfile: async (token: string, data: { username?: string; avatar?: string | null }): Promise<ApiResponse<User>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await parseResponse(response);
      if (!response.ok) {
        return { success: false, error: parseError(result) };
      }
      const raw = (result as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
      return { success: true, data: mapBackendUser(raw ?? {}) };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Không thể kết nối đến server',
      };
    }
  },

  changePassword: async (
    token: string,
    data: { currentPassword: string; newPassword: string }
  ): Promise<ApiResponse<null>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await parseResponse(response);
      if (!response.ok) {
        return { success: false, error: parseError(result) };
      }
      return { success: true, data: null };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Không thể kết nối đến server',
      };
    }
  },
};

export interface QuestionSetMeta {
  id: string;
  pin: string | null;
  title: string;
  description: string;
  type: string;
  count: number;
}

export interface PlayQuestion {
  id: string;
  content: string;
  options: { text: string; isCorrect?: boolean }[];
  correctAnswer?: string;
  difficulty: string;
  explanation?: string;
}

export const publicApi = {
  listSets: async (params?: { type?: string; q?: string; limit?: number; offset?: number }) => {
    const sp = new URLSearchParams();
    if (params?.type) sp.set('type', params.type);
    if (params?.q) sp.set('q', params.q);
    if (params?.limit != null) sp.set('limit', String(params.limit));
    if (params?.offset != null) sp.set('offset', String(params.offset));
    const url = `${API_BASE_URL}/api/public/sets${sp.toString() ? `?${sp}` : ''}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi tải danh sách');
    return data as { data: QuestionSetMeta[]; total: number };
  },

  getSetByPin: async (pin: string) => {
    const normalized = String(pin).trim().toUpperCase();
    const response = await fetch(`${API_BASE_URL}/api/public/sets/by-pin/${encodeURIComponent(normalized)}`);
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Mã PIN không đúng hoặc bộ câu hỏi không tồn tại');
    return (data as { data: QuestionSetMeta }).data;
  },

  getQuestionsByPin: async (pin: string) => {
    const normalized = String(pin).trim().toUpperCase();
    const response = await fetch(`${API_BASE_URL}/api/public/sets/by-pin/${encodeURIComponent(normalized)}/questions`);
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi tải câu hỏi');
    return (data as { data: PlayQuestion[] }).data;
  },
};

export interface CreateSetPayload {
  title: string;
  description?: string;
  type?: string;
  questions: Array<{
    content?: string;
    question?: string;
    options?: string[] | { text: string; isCorrect?: boolean }[];
    correctAnswer?: string;
    difficulty?: string;
    explanation?: string;
  }>;
}

export const setsApi = {
  create: async (token: string, payload: CreateSetPayload) => {
    const response = await fetch(`${API_BASE_URL}/api/sets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi khi lưu bộ câu hỏi');
    return (data as { data: QuestionSetMeta }).data;
  },
};
