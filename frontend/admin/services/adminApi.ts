import { User } from '../../types';

const API_BASE_URL = process.env.API_BASE_URL || '';

const parseJson = async (response: Response): Promise<any> => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const adminApi = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await parseJson(response);

    if (!response.ok) {
      const message =
        (data && (data.message || data.detail)) ||
        'Đăng nhập admin thất bại';
      throw new Error(message);
    }

    const payload = data && typeof data === 'object' ? (data as Record<string, any>) : {};
    const rawUser = (payload.data ?? payload.user ?? payload) as Record<string, any>;

    const user: User = {
      id: String(rawUser.id ?? rawUser._id ?? ''),
      email: String(rawUser.email ?? ''),
      fullName: String(rawUser.username ?? rawUser.email ?? ''),
      role: rawUser.role ?? 'USER',
      status: rawUser.status,
      createdAt: rawUser.createdAt,
    };

    if (user.role !== 'ADMIN') {
      throw new Error('Tài khoản này không phải ADMIN');
    }

    const token = String(payload.token ?? rawUser.token ?? '');

    if (!token) {
      throw new Error('Token không hợp lệ từ server');
    }

    return { user, token };
  },

  getUser: async (id: string, token: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = await parseJson(response);
    if (!response.ok) throw new Error(data?.message || data?.detail || 'Không thể tải thông tin user');
    const u = data?.data ?? data;
    return {
      id: String(u.id ?? u._id ?? ''),
      email: String(u.email ?? ''),
      fullName: String(u.username ?? u.email ?? ''),
      role: u.role ?? 'USER',
      status: u.status,
      createdAt: u.createdAt,
    };
  },

  /** Chi tiết đầy đủ user (cho trang preview admin): username, favorites, savedCollections, avatar, ... */
  getFullUser: async (id: string, token: string): Promise<Record<string, any>> => {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = await parseJson(response);
    if (!response.ok) throw new Error(data?.message || data?.detail || 'Không thể tải thông tin user');
    return (data?.data ?? data) as Record<string, any>;
  },

  getAllUsers: async (token: string): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await parseJson(response);

    if (!response.ok) {
      const message =
        (data && (data.message || data.detail)) ||
        'Không thể tải danh sách người dùng';
      throw new Error(message);
    }

    const list = Array.isArray(data) ? data : (data?.data ?? data?.users ?? []);
    return (list as any[]).map((u) => ({
      id: String(u.id ?? u._id ?? ''),
      email: String(u.email ?? ''),
      fullName: String(u.username ?? u.email ?? ''),
      role: u.role ?? 'USER',
      status: u.status,
      createdAt: u.createdAt,
    }));
  },

  updateUserStatus: async (id: string, status: string, token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}/status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    const data = await parseJson(response);

    if (!response.ok) {
      const message =
        (data && (data.message || data.detail)) ||
        'Không thể cập nhật trạng thái người dùng';
      throw new Error(message);
    }
  },

  getReports: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/reports`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await parseJson(response);

    if (!response.ok) {
      const message =
        (data && (data.message || data.detail)) ||
        'Không thể tải danh sách report';
      throw new Error(message);
    }

    return Array.isArray(data) ? data : data?.data ?? [];
  },

  resolveReport: async (id: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/reports/${id}/resolve`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await parseJson(response);

    if (!response.ok) {
      const message =
        (data && (data.message || data.detail)) ||
        'Không thể resolve report';
      throw new Error(message);
    }

    return data?.data ?? data;
  },

  dismissReport: async (id: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/reports/${id}/dismiss`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await parseJson(response);

    if (!response.ok) {
      const message =
        (data && (data.message || data.detail)) ||
        'Không thể dismiss report';
      throw new Error(message);
    }

    return data?.data ?? data;
  },

  getContentStats: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/content/stats`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await parseJson(response);

    if (!response.ok) {
      const message =
        (data && (data.message || data.detail)) ||
        'Không thể tải thống kê content';
      throw new Error(message);
    }

    return {
      totalQuestions: data?.totalQuestions ?? 0,
      totalSets: data?.totalSets ?? 0,
      verifiedSets: data?.verifiedSets ?? 0,
    };
  },

  getQuestionSets: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/content/sets`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await parseJson(response);

    if (!response.ok) {
      const message =
        (data && (data.message || data.detail)) ||
        'Không thể tải danh sách question sets';
      throw new Error(message);
    }

    return Array.isArray(data) ? data : data?.data ?? [];
  },

  getQuestions: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/content/questions`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await parseJson(response);

    if (!response.ok) {
      const message =
        (data && (data.message || data.detail)) ||
        'Không thể tải danh sách câu hỏi';
      throw new Error(message);
    }

    return Array.isArray(data) ? data : data?.data ?? [];
  },

  getQuestionsBySet: async (setId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/content/sets/${setId}/questions`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await parseJson(response);

    if (!response.ok) {
      const message =
        (data && (data.message || data.detail)) ||
        'Không thể tải danh sách câu hỏi trong bộ';
      throw new Error(message);
    }

    return Array.isArray(data) ? data : data?.data ?? [];
  },

  verifyQuestionSet: async (id: string, verified: boolean, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/content/sets/${id}/verify`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ verified }),
    });

    const data = await parseJson(response);

    if (!response.ok) {
      const message =
        (data && (data.message || data.detail)) ||
        'Không thể cập nhật trạng thái verify cho question set';
      throw new Error(message);
    }

    return data?.data ?? data;
  },

  getSetById: async (setId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/content/sets/${setId}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = await parseJson(response);
    if (!response.ok) throw new Error(data?.message || data?.detail || 'Không thể tải thông tin bộ câu hỏi');
    return data?.data ?? data;
  },

  getQuestionById: async (questionId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/content/questions/${questionId}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = await parseJson(response);
    if (!response.ok) throw new Error(data?.message || data?.detail || 'Không thể tải thông tin câu hỏi');
    return data?.data ?? data;
  },

  updateQuestion: async (
    id: string,
    payload: { content?: string; options?: Array<{ text: string; isCorrect?: boolean }>; correctAnswer?: string; difficulty?: string; explanation?: string },
    token: string
  ) => {
    const response = await fetch(`${API_BASE_URL}/api/content/questions/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await parseJson(response);
    if (!response.ok) throw new Error(data?.message || data?.detail || 'Không thể cập nhật câu hỏi');
    return data?.data ?? data;
  },

  verifyQuestion: async (id: string, verified: boolean, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/content/questions/${id}/verify`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ verified }),
    });
    const data = await parseJson(response);
    if (!response.ok) throw new Error(data?.message || data?.detail || 'Không thể cập nhật verify');
    return data?.data ?? data;
  },

  archiveQuestion: async (id: string, archived: boolean, token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/content/questions/${id}/archive`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ archived }),
    });
    const data = await parseJson(response);
    if (!response.ok) throw new Error(data?.message || data?.detail || 'Không thể cập nhật archive');
    return data?.data ?? data;
  },

  reviewQuestion: async (id: string, action: 'GOOD' | 'HIDE', token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/content/questions/${id}/review`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    });

    const data = await parseJson(response);

    if (!response.ok) {
      const message =
        (data && (data.message || data.detail)) ||
        'Không thể cập nhật trạng thái câu hỏi';
      throw new Error(message);
    }

    return data?.data ?? data;
  },
};

