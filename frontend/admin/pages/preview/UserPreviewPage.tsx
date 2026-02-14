import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Mail,
  Lock,
  Shield,
  Heart,
  FolderOpen,
  Ban,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { adminApi } from '../../services/adminApi';

interface FavoriteQuestionDetail {
  id: string;
  content?: string;
  difficulty?: string;
  options?: Array<{ text: string; isCorrect?: boolean }>;
  correctAnswer?: string;
  explanation?: string;
}

interface SavedCollection {
  name?: string;
  nameid?: string;
  questionIds?: string[];
}

interface SavedCollectionWithQuestions extends SavedCollection {
  questions: FavoriteQuestionDetail[];
}

interface FullUserData {
  id?: string;
  _id?: string;
  username?: string;
  email?: string;
  password?: string;
  role?: string;
  status?: string;
  avatar?: string | null;
  favorites?: string[];
  savedCollections?: SavedCollection[];
  createdAt?: string | { $date?: string };
  updatedAt?: string | { $date?: string };
  __v?: number;
}

const formatDate = (d?: string | { $date?: string }) => {
  if (!d) return '—';
  const str = typeof d === 'string' ? d : d?.$date;
  return str ? new Date(str).toLocaleString('vi-VN') : '—';
};

const UserPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FullUserData | null>(null);
  const [updating, setUpdating] = useState(false);
  const [favoriteQuestions, setFavoriteQuestions] = useState<FavoriteQuestionDetail[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [savedCollectionsWithQuestions, setSavedCollectionsWithQuestions] = useState<SavedCollectionWithQuestions[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [expandedCollectionKey, setExpandedCollectionKey] = useState<string | null>(null);
  const [iframeQuestionId, setIframeQuestionId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !id) return;
    try {
      setLoading(true);
      setError(null);
      const raw = await adminApi.getFullUser(id);
      setData({
        ...raw,
        id: String(raw.id ?? raw._id ?? id),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isAuthenticated || !data?.favorites || !Array.isArray(data.favorites) || data.favorites.length === 0) {
      setFavoriteQuestions([]);
      setFavoritesLoading(false);
      return;
    }
    const ids = data.favorites.map((id) => String(id));
    setFavoritesLoading(true);
    Promise.all(
      ids.map((questionId) =>
        adminApi.getQuestionById(questionId).then(
          (q: Record<string, unknown>) =>
            ({
              id: String(q.id ?? q._id ?? questionId),
              content: typeof q.content === 'string' ? q.content : undefined,
              difficulty: typeof q.difficulty === 'string' ? q.difficulty : undefined,
              options: Array.isArray(q.options) ? (q.options as FavoriteQuestionDetail['options']) : undefined,
              correctAnswer: typeof q.correctAnswer === 'string' ? q.correctAnswer : undefined,
              explanation: typeof q.explanation === 'string' ? q.explanation : undefined,
            }) as FavoriteQuestionDetail
        ).catch(() => ({ id: questionId, content: '— Không tải được —' } as FavoriteQuestionDetail))
      )
    )
      .then(setFavoriteQuestions)
      .finally(() => setFavoritesLoading(false));
  }, [isAuthenticated, data?.favorites]);

  useEffect(() => {
    if (!isAuthenticated || !data?.savedCollections || !Array.isArray(data.savedCollections) || data.savedCollections.length === 0) {
      setSavedCollectionsWithQuestions([]);
      setCollectionsLoading(false);
      return;
    }
    setCollectionsLoading(true);
    const collections = data.savedCollections;
    Promise.all(
      collections.map((col) => {
        const ids = Array.isArray(col.questionIds) ? col.questionIds.map((id) => String(id)) : [];
        const questionsPromise =
          ids.length === 0
            ? Promise.resolve([] as FavoriteQuestionDetail[])
            : Promise.all(
                ids.map((questionId) =>
                  adminApi.getQuestionById(questionId).then(
                    (q: Record<string, unknown>) =>
                      ({
                        id: String(q.id ?? q._id ?? questionId),
                        content: typeof q.content === 'string' ? q.content : undefined,
                        difficulty: typeof q.difficulty === 'string' ? q.difficulty : undefined,
                        options: Array.isArray(q.options) ? (q.options as FavoriteQuestionDetail['options']) : undefined,
                        correctAnswer: typeof q.correctAnswer === 'string' ? q.correctAnswer : undefined,
                        explanation: typeof q.explanation === 'string' ? q.explanation : undefined,
                      }) as FavoriteQuestionDetail
                  ).catch(() => ({ id: questionId, content: '— Không tải được —' } as FavoriteQuestionDetail))
                )
              );
        return questionsPromise.then((questions) => ({
          ...col,
          questions,
        })) as Promise<SavedCollectionWithQuestions>;
      })
    )
      .then(setSavedCollectionsWithQuestions)
      .finally(() => setCollectionsLoading(false));
  }, [isAuthenticated, data?.savedCollections]);

  const handleUpdateStatus = async () => {
    if (!isAuthenticated || !id || !data) return;
    const newStatus = data.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
    setUpdating(true);
    try {
      await adminApi.updateUserStatus(id, newStatus);
      setData((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
          <AlertCircle size={20} />
          <span>{error || 'Không tìm thấy dữ liệu'}</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
      </div>
    );
  }

  const userId = String(data.id ?? data._id ?? id);
  const isBanned = data.status === 'BANNED';

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <User size={24} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Chi tiết User</h1>
            <p className="text-sm text-slate-500">ID: {userId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleUpdateStatus}
            disabled={updating}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              isBanned
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-rose-600 text-white hover:bg-rose-700'
            }`}
          >
            {isBanned ? (
              <>
                <ShieldCheck size={16} />
                Bỏ khóa tài khoản
              </>
            ) : (
              <>
                <Ban size={16} />
                Khóa tài khoản
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        {/* Avatar */}
        {data.avatar && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Avatar</p>
            <div className="flex items-start gap-4">
              <img
                src={data.avatar}
                alt="Avatar"
                className="w-20 h-20 rounded-xl object-cover border border-slate-200"
              />
              <p className="text-xs text-slate-500 mt-1">
                (Base64 hoặc URL — chỉ xem, không sửa)
              </p>
            </div>
          </div>
        )}

        {/* Username */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tên hiển thị (username)</p>
          <p className="font-medium text-slate-900 py-1">{data.username ?? '—'}</p>
        </div>

        {/* Email */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Mail size={14} />
            Email
          </p>
          <p className="text-slate-700 py-1">{data.email ?? '—'}</p>
        </div>

        {/* Password - chỉ hiển thị 6 chấm tròn */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Lock size={14} />
            Mật khẩu
          </p>
          <p className="text-slate-600 text-sm py-1">
            {data.password ? '••••••' : '—'}
          </p>
        </div>

        {/* Role & Status */}
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Shield size={14} />
              Vai trò
            </p>
            <span className="inline-flex px-2 py-1 rounded-lg text-sm font-medium bg-slate-100 text-slate-700">
              {data.role ?? '—'}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Trạng thái</p>
            <span
              className={`inline-flex px-2 py-1 rounded-lg text-sm font-medium ${
                data.status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-700'
                  : data.status === 'BANNED'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-100 text-slate-600'
              }`}
            >
              {data.status ?? '—'}
            </span>
          </div>
        </div>

        {/* Favorites - gọi API lấy chi tiết câu hỏi giống ProfilePage */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Heart size={14} />
            Câu hỏi yêu thích ({Array.isArray(data.favorites) ? data.favorites.length : 0})
          </p>
          {favoritesLoading ? (
            <p className="text-slate-500 text-sm py-2 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Đang tải...
            </p>
          ) : favoriteQuestions.length === 0 ? (
            <p className="text-slate-500 text-sm py-1">
              {Array.isArray(data.favorites) && data.favorites.length > 0 ? 'Không tải được danh sách câu hỏi.' : 'Không có'}
            </p>
          ) : (
            <ul className="space-y-3 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              {favoriteQuestions.map((q) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => setIframeQuestionId(q.id)}
                    className="w-full p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-800 font-medium line-clamp-2">{q.content || '—'}</p>
                      <p className="text-xs text-slate-500 mt-1">Độ khó: {q.difficulty || 'medium'}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Saved collections - gọi API lấy chi tiết câu hỏi giống ProfilePage */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <FolderOpen size={14} />
            Bộ sưu tập đã lưu ({Array.isArray(data.savedCollections) ? data.savedCollections.length : 0})
          </p>
          {collectionsLoading ? (
            <p className="text-slate-500 text-sm py-2 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Đang tải...
            </p>
          ) : savedCollectionsWithQuestions.length === 0 ? (
            <p className="text-slate-500 text-sm py-1">
              {Array.isArray(data.savedCollections) && data.savedCollections.length > 0
                ? 'Không tải được bộ sưu tập.'
                : 'Không có'}
            </p>
          ) : (
            <div className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
              {savedCollectionsWithQuestions.map((col, i) => {
                const collectionKey = col.nameid ?? col.name ?? `col-${i}`;
                const isExpanded = expandedCollectionKey === collectionKey;
                return (
                  <div key={collectionKey} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => setExpandedCollectionKey((k) => (k === collectionKey ? null : collectionKey))}
                      className="w-full px-4 py-3 bg-indigo-50 border-b border-slate-200 flex items-center justify-between gap-3 text-left hover:bg-indigo-100/80 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{col.name ?? col.nameid ?? '—'}</p>
                        <p className="text-xs text-slate-500">{col.questions.length} câu hỏi</p>
                      </div>
                      <svg
                        className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {isExpanded && (
                      <ul className="divide-y divide-slate-100">
                        {col.questions.length === 0 ? (
                          <li className="px-4 py-3 text-sm text-slate-500">Chưa có câu hỏi</li>
                        ) : (
                          col.questions.map((q) => (
                            <li key={q.id}>
                              <button
                                type="button"
                                onClick={() => setIframeQuestionId(q.id)}
                                className="w-full px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-left"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-slate-800 font-medium text-sm line-clamp-2">{q.content || '—'}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">Độ khó: {q.difficulty || 'medium'}</p>
                                </div>
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="flex flex-wrap gap-6 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            Tạo: {formatDate(data.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            Cập nhật: {formatDate(data.updatedAt)}
          </span>
        </div>

        {typeof data.__v === 'number' && (
          <p className="text-xs text-slate-400">__v: {data.__v}</p>
        )}
      </div>

      {/* Modal iframe xem chi tiết câu hỏi */}
      {iframeQuestionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Chi tiết câu hỏi</h3>
              <button
                onClick={() => setIframeQuestionId(null)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <iframe
                src={`${window.location.origin}${window.location.pathname}#/admin/preview/question/${encodeURIComponent(iframeQuestionId)}`}
                title="Chi tiết câu hỏi"
                className="w-full h-full border-0 rounded-b-2xl"
                sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPreviewPage;
