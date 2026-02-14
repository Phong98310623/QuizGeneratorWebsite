import { User, ApiResponse } from '../types';

const API_BASE_URL = process.env.API_BASE_URL || "";

const AUTH_USER_COOKIE = "auth_user";
const COOKIE_MAX_AGE_DAYS = 30;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getAuthUserCookie(): User | null {
  const raw = getCookie(AUTH_USER_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setAuthUserCookie(user: User): void {
  if (typeof document === "undefined") return;
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${AUTH_USER_COOKIE}=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearAuthUserCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_USER_COOKIE}=; path=/; max-age=0`;
}

/** Giữ cho tương thích khi backend vẫn trả token trong body (đọc được từ cookie). */
export function getStoredAccessToken(): string | null {
  return null;
}
export function getStoredRefreshToken(): string | null {
  return null;
}
export function setStoredTokens(_access: string, _refresh: string) {
  /* tokens lưu HttpOnly cookie, không lưu frontend */
}

let onUnauthorized: (() => void) | null = null;
export function setAuthCallbacks(cbs: { onUnauthorized: () => void; onTokensRefreshed?: (access: string, refresh: string) => void }) {
  onUnauthorized = cbs.onUnauthorized;
}

const defaultCredentials: RequestCredentials = "include";

/** Gọi API với cookie (credentials: include); 401 thì thử refresh (cookie) rồi gửi lại. */
async function fetchWithAuth(url: string, options: RequestInit, _token?: string | null): Promise<Response> {
  let res = await fetch(url, {
    ...options,
    credentials: defaultCredentials,
    headers: options?.headers,
  });
  if (res.status !== 401) return res;

  const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: defaultCredentials,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!refreshRes.ok) {
    onUnauthorized?.();
    return res;
  }
  return fetch(url, { ...options, credentials: defaultCredentials, headers: options?.headers });
}

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
    if (obj.message) return String(obj.message);
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
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        credentials: 'include',
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

  login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string; accessToken: string; refreshToken: string }>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
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
      const accessToken = String((rawUser as any).accessToken ?? payload.access ?? payload.accessToken ?? '');
      const refreshToken = String((rawUser as any).refreshToken ?? payload.refreshToken ?? '');

      return { success: true, data: { user, token: accessToken, accessToken, refreshToken } };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Không thể kết nối đến server',
      };
    }
  },

  logout: async (): Promise<void> => {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
  },

  updateProfile: async (token: string, data: { username?: string; avatar?: string | null }): Promise<ApiResponse<User>> => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/auth/me`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
        token
      );
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
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/auth/me/password`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        },
        token
      );
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
    const response = await fetch(url, { credentials: 'include' });
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi tải danh sách');
    return data as { data: QuestionSetMeta[]; total: number };
  },

  getSetByPin: async (pin: string) => {
    const normalized = String(pin).trim().toUpperCase();
    const response = await fetch(`${API_BASE_URL}/api/public/sets/by-pin/${encodeURIComponent(normalized)}`, { credentials: 'include' });
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Mã PIN không đúng hoặc bộ câu hỏi không tồn tại');
    return (data as { data: QuestionSetMeta }).data;
  },

  getQuestionsByPin: async (pin: string) => {
    const normalized = String(pin).trim().toUpperCase();
    const response = await fetch(`${API_BASE_URL}/api/public/sets/by-pin/${encodeURIComponent(normalized)}/questions`, { credentials: 'include' });
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi tải câu hỏi');
    return (data as { data: PlayQuestion[] }).data;
  },
};

export interface AttemptHistoryDetail {
  questionId: string;
  content: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface AttemptHistoryItem {
  attemptId: string;
  pin: string;
  setTitle: string;
  completedAt: string;
  correctCount: number;
  totalCount: number;
  details: AttemptHistoryDetail[];
}

export const attemptsApi = {
  submit: async (token: string, pin: string, answers: Array<{ questionId: string; selectedAnswer: string }>) => {
    const normalized = String(pin).trim().toUpperCase();
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/public/sets/by-pin/${encodeURIComponent(normalized)}/submit`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      },
      token
    );
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi khi lưu kết quả');
    return data as { success: boolean; data: { attemptId: string; pin: string; completedAt: string } };
  },

  getMyHistory: async (token: string): Promise<AttemptHistoryItem[]> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/users/me/history`,
      { headers: {} },
      token
    );
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi khi tải lịch sử');
    return (data as { success: boolean; data: AttemptHistoryItem[] }).data;
  },
};

/** Body gửi lên backend để AI sinh câu hỏi (key AI chỉ ở backend). */
export interface AiGeneratePayload {
  topic: string;
  count: number;
  difficulty: string;
  type: string;
}

/** Câu hỏi do AI trả về (backend /api/ai/generate). */
export interface GeneratedQuestionFromApi {
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface AiGenerateResult {
  data: GeneratedQuestionFromApi[];
  fromCache?: boolean;
  existingPin?: string | null;
}

export const aiApi = {
  generate: async (token: string, payload: AiGeneratePayload): Promise<AiGenerateResult> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/ai/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      token
    );
    const json = await response.json();
    if (!response.ok) throw new Error((json as { message?: string }).message || 'Lỗi khi tạo câu hỏi bằng AI');
    const body = json as { success: boolean; data: GeneratedQuestionFromApi[]; fromCache?: boolean; existingPin?: string | null };
    return {
      data: body.data,
      fromCache: body.fromCache,
      existingPin: body.existingPin ?? null,
    };
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
  /** Để cache prompt trong question_sets (trùng thì không gọi AI lại). */
  generatorTopic?: string;
  generatorCount?: number;
  generatorDifficulty?: string;
  generatorType?: string;
}

export interface CreateReportPayload {
  reporterName: string;
  reporterEmail: string;
  reportedEntityType: 'USER' | 'QUIZ' | 'CONTENT' | 'OTHER';
  reportedEntityId: string;
  reportedEntityTitle: string;
  reason: string;
  description?: string;
}

export const reportApi = {
  create: async (payload: CreateReportPayload): Promise<{ success: boolean; data?: { id: string; status: string } }> => {
    const response = await fetch(`${API_BASE_URL}/api/reports`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as { success?: boolean; data?: { id: string; status: string }; message?: string };
    if (!response.ok) {
      throw new Error(data.message || 'Không thể gửi báo cáo');
    }
    return { success: data.success ?? true, data: data.data };
  },
};

export interface SavedCollection {
  nameid: string;
  name: string;
  questionIds: string[];
}

export interface FavoritesAndCollectionsData {
  favorites: string[];
  savedCollections: SavedCollection[];
}

export interface SavedQuestionDetail {
  id: string;
  content: string;
  options?: { text: string; isCorrect?: boolean }[];
  correctAnswer?: string;
  explanation?: string;
  difficulty?: string;
}

export interface SavedCollectionWithQuestions extends SavedCollection {
  questions: SavedQuestionDetail[];
}

export interface FavoritesAndCollectionsWithDetails extends FavoritesAndCollectionsData {
  favoriteQuestions: SavedQuestionDetail[];
  savedCollectionsWithQuestions: SavedCollectionWithQuestions[];
}

export const userFavoritesApi = {
  get: async (token: string): Promise<FavoritesAndCollectionsData> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/users/me/favorites`, { headers: {} }, token);
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi khi tải dữ liệu');
    return (data as { success: boolean; data: FavoritesAndCollectionsData }).data;
  },

  getWithDetails: async (token: string): Promise<FavoritesAndCollectionsWithDetails> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/users/me/favorites?details=1`, { headers: {} }, token);
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi khi tải dữ liệu');
    return (data as { success: boolean; data: FavoritesAndCollectionsWithDetails }).data;
  },

  toggleFavorite: async (token: string, questionId: string): Promise<{ favorites: string[]; added: boolean }> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/users/me/favorites/toggle`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      },
      token
    );
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi khi cập nhật');
    return (data as { success: boolean; data: { favorites: string[]; added: boolean } }).data;
  },

  createCollection: async (token: string, name: string): Promise<SavedCollection> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/users/me/saved-collections`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      },
      token
    );
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi khi tạo bộ sưu tập');
    return (data as { success: boolean; data: SavedCollection }).data;
  },

  addToCollection: async (token: string, nameid: string, questionId: string): Promise<SavedCollection> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/users/me/saved-collections/${encodeURIComponent(nameid)}/add`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      },
      token
    );
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi khi thêm câu hỏi');
    return (data as { success: boolean; data: SavedCollection }).data;
  },

  removeFromCollection: async (token: string, nameid: string, questionId: string): Promise<SavedCollection> => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/users/me/saved-collections/${encodeURIComponent(nameid)}/remove`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      },
      token
    );
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi khi xóa câu hỏi');
    return (data as { success: boolean; data: SavedCollection }).data;
  },
};

export const setsApi = {
  create: async (token: string, payload: CreateSetPayload) => {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/sets`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      token
    );
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi khi lưu bộ câu hỏi');
    return (data as { data: QuestionSetMeta }).data;
  },
};
