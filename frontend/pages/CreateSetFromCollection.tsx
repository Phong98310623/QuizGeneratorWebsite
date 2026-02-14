import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userFavoritesApi, setsApi, SavedCollectionWithQuestions, SavedQuestionDetail } from '../services/api';
import { Input } from '../components/quiz/Input';

const CreateSetFromCollection: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [collections, setCollections] = useState<SavedCollectionWithQuestions[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPin, setSavedPin] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    userFavoritesApi
      .getWithDetails(null as any)
      .then((data) => setCollections(data.savedCollectionsWithQuestions || []))
      .catch(() => setCollections([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const toggleQuestion = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllInCollection = (col: SavedCollectionWithQuestions) => {
    const ids = col.questions.map((q) => q.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const getSelectedQuestions = (): SavedQuestionDetail[] => {
    const list: SavedQuestionDetail[] = [];
    for (const col of collections) {
      for (const q of col.questions) {
        if (selectedIds.has(q.id)) list.push(q);
      }
    }
    return list;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề bộ câu hỏi.');
      return;
    }

    const selected = getSelectedQuestions();
    if (selected.length === 0) {
      setError('Vui lòng chọn ít nhất một câu hỏi.');
      return;
    }

    if (!isAuthenticated) {
      setError('Bạn cần đăng nhập.');
      return;
    }

    setSaving(true);
    try {
      const result = await setsApi.create(null as any, {
        title: title.trim(),
        description: description.trim() || undefined,
        type: 'custom',
        questions: selected.map((q) => ({
          content: q.content,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty || 'medium',
        })),
      });
      setSavedPin(result.pin || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPlayLink = () => {
    if (!savedPin) return;
    const url = `${window.location.origin}${window.location.pathname}#/play/${encodeURIComponent(savedPin)}`;
    navigator.clipboard.writeText(url);
    alert('Đã sao chép link chơi!');
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại Hồ sơ
        </Link>

        <h1 className="text-2xl font-bold text-slate-800 mb-2">Tạo set câu hỏi từ bộ sưu tập</h1>
        <p className="text-slate-600 mb-6">Chọn các câu hỏi từ bộ sưu tập của bạn để tạo bộ câu hỏi mới.</p>

        {loading ? (
          <p className="text-slate-500">Đang tải...</p>
        ) : collections.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
            <p className="text-slate-500 mb-4">Chưa có bộ sưu tập nào. Hãy lưu câu hỏi vào bộ sưu tập trước.</p>
            <Link to="/profile" className="text-indigo-600 hover:underline font-medium">
              Về Hồ sơ
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <Input
                label="Tiêu đề bộ câu hỏi *"
                placeholder="Ví dụ: Ôn tập chương 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mô tả (tùy chọn)</label>
                <textarea
                  placeholder="Mô tả ngắn gọn..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-semibold text-slate-800 mb-4">Chọn câu hỏi từ bộ sưu tập</h2>
              <div className="space-y-6">
                {collections.map((col) => (
                  <div key={col.nameid} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-indigo-50 border-b border-slate-200 flex items-center justify-between">
                      <p className="font-semibold text-slate-800">{col.name}</p>
                      <button
                        type="button"
                        onClick={() => selectAllInCollection(col)}
                        className="text-sm text-indigo-600 hover:underline"
                      >
                        {col.questions.every((q) => selectedIds.has(q.id)) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                      </button>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {col.questions.map((q) => (
                        <li key={q.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
                          <button
                            type="button"
                            onClick={() => toggleQuestion(q.id)}
                            className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                              selectedIds.has(q.id) ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                            }`}
                          >
                            {selectedIds.has(q.id) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                          <p className="text-slate-800 text-sm flex-1 line-clamp-2">{q.content}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500 mt-4">Đã chọn: {selectedIds.size} câu hỏi</p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {savedPin ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-800 font-medium mb-2">Đã tạo thành công!</p>
                <p className="text-sm text-green-700 mb-3">
                  Mã PIN: <span className="font-mono font-bold">{savedPin}</span>
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCopyPlayLink}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    Sao chép link chơi
                  </button>
                  <Link
                    to={`/play/${encodeURIComponent(savedPin)}`}
                    className="px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 text-sm font-medium"
                  >
                    Làm bài ngay
                  </Link>
                  <Link to="/profile" className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">
                    Về Hồ sơ
                  </Link>
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={saving || selectedIds.size === 0}
                className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Đang tạo...' : 'Tạo bộ câu hỏi'}
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateSetFromCollection;
