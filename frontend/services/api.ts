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
    const response = await fetch(`${API_BASE_URL}/api/public/sets/by-pin/${encodeURIComponent(normalized)}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answers }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi khi lưu kết quả');
    return data as { success: boolean; data: { attemptId: string; pin: string; completedAt: string } };
  },

  getMyHistory: async (token: string): Promise<AttemptHistoryItem[]> => {
    const response = await fetch(`${API_BASE_URL}/api/users/me/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
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
    const response = await fetch(`${API_BASE_URL}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
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
    const response = await fetch(`${API_BASE_URL}/api/users/me/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi khi tải dữ liệu');
    return (data as { success: boolean; data: FavoritesAndCollectionsData }).data;
  },

  getWithDetails: async (token: string): Promise<FavoritesAndCollectionsWithDetails> => {
    const response = await fetch(`${API_BASE_URL}/api/users/me/favorites?details=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi khi tải dữ liệu');
    return (data as { success: boolean; data: FavoritesAndCollectionsWithDetails }).data;
  },

  toggleFavorite: async (token: string, questionId: string): Promise<{ favorites: string[]; added: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/api/users/me/favorites/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ questionId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi khi cập nhật');
    return (data as { success: boolean; data: { favorites: string[]; added: boolean } }).data;
  },

  createCollection: async (token: string, name: string): Promise<SavedCollection> => {
    const response = await fetch(`${API_BASE_URL}/api/users/me/saved-collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi khi tạo bộ sưu tập');
    return (data as { success: boolean; data: SavedCollection }).data;
  },

  addToCollection: async (token: string, nameid: string, questionId: string): Promise<SavedCollection> => {
    const response = await fetch(`${API_BASE_URL}/api/users/me/saved-collections/${encodeURIComponent(nameid)}/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ questionId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi khi thêm câu hỏi');
    return (data as { success: boolean; data: SavedCollection }).data;
  },

  removeFromCollection: async (token: string, nameid: string, questionId: string): Promise<SavedCollection> => {
    const response = await fetch(`${API_BASE_URL}/api/users/me/saved-collections/${encodeURIComponent(nameid)}/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ questionId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error((data as { message?: string }).message || 'Lỗi khi xóa câu hỏi');
    return (data as { success: boolean; data: SavedCollection }).data;
  },
};

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
