import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userFavoritesApi, SavedQuestionDetail, SavedCollectionWithQuestions } from '../../services/api';
import ConfirmModal from './ConfirmModal';
import QuestionDetailModal from './QuestionDetailModal';

const Collections: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [savedCollectionsWithQuestions, setSavedCollectionsWithQuestions] = useState<SavedCollectionWithQuestions[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [expandedCollectionId, setExpandedCollectionId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ nameid: string; name: string; questionId: string; questionContent: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<SavedQuestionDetail | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavoritesLoading(false);
      return;
    }
    userFavoritesApi.getWithDetails(null as any).then((data) => {
      setSavedCollectionsWithQuestions(data.savedCollectionsWithQuestions || []);
    }).catch(() => {}).finally(() => setFavoritesLoading(false));
  }, [isAuthenticated]);

  const handleRemoveFromCollection = async () => {
    if (!deleteConfirm) return;
    if (!isAuthenticated) return;
    setDeleteLoading(true);
    try {
      await userFavoritesApi.removeFromCollection(null as any, deleteConfirm.nameid, deleteConfirm.questionId);
      setSavedCollectionsWithQuestions((prev) =>
        prev.map((col) =>
          col.nameid === deleteConfirm.nameid
            ? { ...col, questions: col.questions.filter((q) => q.id !== deleteConfirm.questionId) }
            : col
        )
      );
      setDeleteConfirm(null);
    } catch {
      // ignore
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Bộ sưu tập đã lưu</h2>
      {favoritesLoading ? (
        <p className="text-slate-500 text-sm">Đang tải...</p>
      ) : savedCollectionsWithQuestions.length === 0 ? (
        <p className="text-slate-500 text-sm">Các bộ sưu tập bạn tạo khi lưu câu hỏi sẽ hiển thị ở đây.</p>
      ) : (
        <div className="space-y-4">
          {savedCollectionsWithQuestions.map((col) => {
            const isExpanded = expandedCollectionId === col.nameid;
            return (
              <div key={col.nameid} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedCollectionId((id) => (id === col.nameid ? null : col.nameid))}
                  className="w-full px-4 py-3 bg-indigo-50 border-b border-slate-200 flex items-center justify-between gap-3 text-left hover:bg-indigo-100/80 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{col.name}</p>
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
                        <li key={q.id} className="px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-3 group">
                          <button
                            type="button"
                            onClick={() => setSelectedQuestion(q)}
                            className="text-left flex-1 min-w-0 cursor-pointer"
                          >
                            <p className="text-slate-800 font-medium text-sm line-clamp-2">{q.content}</p>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ nameid: col.nameid, name: col.name, questionId: q.id, questionContent: q.content }); }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            title="Xóa khỏi bộ sưu tập"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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

      {selectedQuestion && (
        <QuestionDetailModal
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
        />
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Xóa khỏi bộ sưu tập?"
          message={
            <div>
              <p className="mb-1">Bộ sưu tập: <span className="font-medium">{deleteConfirm.name}</span></p>
              <p className="line-clamp-2">{deleteConfirm.questionContent}</p>
            </div>
          }
          onConfirm={handleRemoveFromCollection}
          onCancel={() => setDeleteConfirm(null)}
          isSaving={deleteLoading}
        />
      )}
    </div>
  );
};

export default Collections;
