import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userFavoritesApi, SavedQuestionDetail } from '../../services/api';
import ConfirmModal from './ConfirmModal';
import QuestionDetailModal from './QuestionDetailModal';

const FavoriteQuestions: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [favoriteQuestions, setFavoriteQuestions] = useState<SavedQuestionDetail[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoriteDeleteConfirm, setFavoriteDeleteConfirm] = useState<{ questionId: string; questionContent: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<SavedQuestionDetail | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavoritesLoading(false);
      return;
    }
    userFavoritesApi.getWithDetails(null as any).then((data) => {
      setFavoriteQuestions(data.favoriteQuestions || []);
    }).catch(() => {}).finally(() => setFavoritesLoading(false));
  }, [isAuthenticated]);

  const handleRemoveFromFavorite = async () => {
    if (!favoriteDeleteConfirm) return;
    if (!isAuthenticated) return;
    setDeleteLoading(true);
    try {
      await userFavoritesApi.toggleFavorite(null as any, favoriteDeleteConfirm.questionId);
      setFavoriteQuestions((prev) => prev.filter((q) => q.id !== favoriteDeleteConfirm.questionId));
      setFavoriteDeleteConfirm(null);
    } catch {
      // ignore
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Câu yêu thích</h2>
      {favoritesLoading ? (
        <p className="text-slate-500 text-sm">Đang tải...</p>
      ) : favoriteQuestions.length === 0 ? (
        <p className="text-slate-500 text-sm">Các câu hỏi bạn đánh dấu yêu thích khi làm bài sẽ hiển thị ở đây.</p>
      ) : (
        <ul className="space-y-3">
          {favoriteQuestions.map((q) => (
            <li key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedQuestion(q)}
                className="text-left flex-1 min-w-0 cursor-pointer"
              >
                <p className="text-slate-800 font-medium line-clamp-2">{q.content}</p>
                <p className="text-xs text-slate-500 mt-1">Độ khó: {q.difficulty || 'medium'}</p>
              </button>
              <button
                type="button"
                onClick={() => setFavoriteDeleteConfirm({ questionId: q.id, questionContent: q.content })}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                title="Xóa khỏi yêu thích"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedQuestion && (
        <QuestionDetailModal
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
        />
      )}

      {favoriteDeleteConfirm && (
        <ConfirmModal
          title="Xóa khỏi yêu thích?"
          message={favoriteDeleteConfirm.questionContent}
          onConfirm={handleRemoveFromFavorite}
          onCancel={() => setFavoriteDeleteConfirm(null)}
          isSaving={deleteLoading}
        />
      )}
    </div>
  );
};

export default FavoriteQuestions;
