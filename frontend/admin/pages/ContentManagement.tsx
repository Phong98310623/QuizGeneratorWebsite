import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  FileText,
  Plus,
  Search,
  Filter,
  Layers,
  Loader2,
  AlertCircle,
  Eye,
  Check,
  X,
  MessageCircle,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminApi } from '../services/adminApi';

interface QuestionSet {
  id: string;
  title: string;
  description: string;
  type: string;
  count: number;
  verified: boolean;
}

interface Question {
  id: string;
  content: string;
  tags: string[];
  difficulty: string;
  usedCount: number;
  verified?: boolean;
  archived?: boolean;
}

const ContentManagement: React.FC = () => {
  const { token } = useAdminAuth();
  const [stats, setStats] = useState({ totalQuestions: 0, totalSets: 0, verifiedSets: 0 });
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'sets' | 'questions'>('sets');
  const [previewMode, setPreviewMode] = useState<'set' | 'question' | null>(null);
  const [selectedSet, setSelectedSet] = useState<QuestionSet | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [suggestionText, setSuggestionText] = useState('');
  const [setQuestionsInSet, setSetQuestionsInSet] = useState<Question[]>([]);
  const [setQuestionsLoading, setSetQuestionsLoading] = useState(false);
  const [setQuestionsError, setSetQuestionsError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) {
      setError('Yêu cầu đăng nhập');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [statsData, setsData, questionsData] = await Promise.all([
        adminApi.getContentStats(token),
        adminApi.getQuestionSets(token),
        adminApi.getQuestions(token),
      ]);
      setStats(statsData);
      setQuestionSets(Array.isArray(setsData) ? setsData : []);
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openSetPreview = async (set: QuestionSet) => {
    setSelectedSet(set);
    setSelectedQuestion(null);
    setPreviewMode('set');
    setSuggestionText('');

    if (!token) return;
    try {
      setSetQuestionsLoading(true);
      setSetQuestionsError(null);
      const data = await adminApi.getQuestionsBySet(set.id, token);
      setSetQuestionsInSet(Array.isArray(data) ? data : []);
    } catch (err) {
      setSetQuestionsInSet([]);
      setSetQuestionsError(
        err instanceof Error ? err.message : 'Không thể tải danh sách câu hỏi trong bộ.'
      );
    } finally {
      setSetQuestionsLoading(false);
    }
  };

  const openQuestionPreview = (q: Question) => {
    setSelectedQuestion(q);
    setSelectedSet(null);
    setPreviewMode('question');
    setSuggestionText('');
  };

  const closePreview = () => {
    setPreviewMode(null);
    setSelectedSet(null);
    setSelectedQuestion(null);
    setSuggestionText('');
    setSetQuestionsInSet([]);
    setSetQuestionsError(null);
  };

  const toggleVerifySet = async (setId: string, value: boolean) => {
    if (!token) {
      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    // Optimistic update
    const prevSets = questionSets;
    const prevSelected = selectedSet;

    setQuestionSets((prev) =>
      prev.map((s) => (s.id === setId ? { ...s, verified: value } : s))
    );
    if (selectedSet && selectedSet.id === setId) {
      setSelectedSet({ ...selectedSet, verified: value });
    }

    try {
      await adminApi.verifyQuestionSet(setId, value, token);
      // cập nhật lại stats verifySets đơn giản bằng fetch lại
      const statsData = await adminApi.getContentStats(token);
      setStats(statsData);
    } catch (err) {
      // rollback nếu lỗi
      setQuestionSets(prevSets);
      if (prevSelected) {
        setSelectedSet(prevSelected);
      }
      alert(
        err instanceof Error
          ? err.message
          : 'Không thể cập nhật trạng thái verify cho question set.'
      );
    }
  };

  const handleSaveSuggestion = () => {
    if (!suggestionText.trim()) {
      alert('Vui lòng nhập nội dung đề xuất.');
      return;
    }
    // Hiện tại chỉ log ra console – cần kết nối API sau này
    console.log('Admin suggestion:', {
      targetType: previewMode,
      setId: selectedSet?.id,
      questionId: selectedQuestion?.id,
      content: suggestionText.trim(),
    });
    alert('Đề xuất đã được ghi nhận (chưa gửi về server).');
    setSuggestionText('');
  };

  const filteredSets = useMemo(() => {
    if (!searchTerm.trim()) return questionSets;
    const q = searchTerm.toLowerCase();
    return questionSets.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.type && s.type.toLowerCase().includes(q))
    );
  }, [questionSets, searchTerm]);

  const filteredQuestions = useMemo(() => {
    if (!searchTerm.trim()) return questions;
    const q = searchTerm.toLowerCase();
    return questions.filter(
      (x) =>
        x.content.toLowerCase().includes(q) ||
        (x.tags && x.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [questions, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Manager</h1>
          <p className="text-slate-500 mt-1">
            Curate questions, sets, and educational material.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
          <Plus size={20} />
          Create New Set
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            onClick={() => { setError(null); fetchData(); }}
            className="ml-auto text-sm underline hover:no-underline"
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Questions</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.totalQuestions}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Question Sets</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.totalSets}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-orange-50 p-3 rounded-xl text-orange-600">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Verified Sets</p>
            <h3 className="text-2xl font-bold text-slate-900">{stats.verifiedSets}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('sets')}
              className={`px-4 py-2 text-sm font-medium rounded-lg border ${
                activeTab === 'sets'
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                  : 'text-slate-600 hover:bg-slate-50 border-transparent'
              }`}
            >
              Question Sets
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 text-sm font-medium rounded-lg border ${
                activeTab === 'questions'
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                  : 'text-slate-600 hover:bg-slate-50 border-transparent'
              }`}
            >
              Individual Questions
            </button>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-initial">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'sets' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSets.length === 0 ? (
                <p className="col-span-full text-center py-12 text-slate-500">
                  {searchTerm ? 'Không có question set nào khớp tìm kiếm.' : 'Chưa có question set.'}
                </p>
              ) : (
                filteredSets.map((set, i) => (
                  <div
                    key={set.id}
                    className="group p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => openSetPreview(set)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                        {set.type || 'Other'}
                      </span>
                      <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                        <FileText size={12} />
                        {set.count} Qs
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {set.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{set.description || '—'}</p>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {set.verified ? '✓ Verified' : 'Chưa verify'}
                      </span>
                      <button
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          openSetPreview(set);
                        }}
                      >
                        <Eye size={12} />
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <p className="text-center py-12 text-slate-500">
                  {searchTerm ? 'Không có câu hỏi nào khớp tìm kiếm.' : 'Chưa có câu hỏi.'}
                </p>
              ) : (
                filteredQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-slate-900 line-clamp-2 flex-1">{q.content}</p>
                      <button
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                        onClick={() => openQuestionPreview(q)}
                      >
                        <Eye size={14} />
                        Xem
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {q.tags?.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs"
                        >
                          {t}
                        </span>
                      ))}
                      <span className="text-xs text-slate-400 ml-auto">
                        {q.difficulty} · {q.usedCount} used
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      {previewMode && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl mx-4 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {previewMode === 'set' ? (
                  <Layers size={18} className="text-indigo-500" />
                ) : (
                  <FileText size={18} className="text-indigo-500" />
                )}
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                    {previewMode === 'set' ? 'Question Set Preview' : 'Question Preview'}
                  </p>
                  <p className="text-sm text-slate-500">
                    Xem chi tiết nội dung để verify hoặc đề xuất chỉnh sửa.
                  </p>
                </div>
              </div>
              <button
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
                onClick={closePreview}
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {previewMode === 'set' && selectedSet && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Tiêu đề bộ câu hỏi
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{selectedSet.title}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-500 font-medium">Loại</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedSet.type || 'Khác'}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-500 font-medium">Số lượng câu hỏi</p>
                      <p className="mt-1 font-semibold text-slate-900">{selectedSet.count}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-500 font-medium">Trạng thái</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {selectedSet.verified ? '✓ ĐÃ VERIFY' : 'Chưa verify'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Mô tả
                    </p>
                    <p className="mt-1 text-sm text-slate-700 whitespace-pre-line">
                      {selectedSet.description || '—'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <button
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      onClick={() =>
                        selectedSet &&
                        toggleVerifySet(selectedSet.id, true)
                      }
                    >
                      <Check size={14} />
                      Đánh dấu đã duyệt
                    </button>
                    <button
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100"
                      onClick={() =>
                        selectedSet &&
                        toggleVerifySet(selectedSet.id, false)
                      }
                    >
                      <X size={14} />
                      Đánh dấu cần xem lại
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Các câu hỏi trong bộ
                    </p>
                    {setQuestionsLoading && (
                      <p className="text-xs text-slate-400">Đang tải danh sách câu hỏi...</p>
                    )}
                    {setQuestionsError && (
                      <p className="text-xs text-rose-500">{setQuestionsError}</p>
                    )}
                    {!setQuestionsLoading && !setQuestionsError && setQuestionsInSet.length === 0 && (
                      <p className="text-xs text-slate-400">Bộ này chưa có câu hỏi nào.</p>
                    )}
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {setQuestionsInSet.map((q) => (
                        <div
                          key={q.id}
                          className="rounded-lg border border-slate-100 px-3 py-2 text-xs flex flex-col gap-1 bg-slate-50/60"
                        >
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 text-[10px] text-slate-400 shrink-0">
                              Q
                            </span>
                            <p className="text-slate-800">{q.content}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            {q.tags?.map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded"
                              >
                                {t}
                              </span>
                            ))}
                            <span className="ml-auto text-[11px] text-slate-400">
                              {q.difficulty} · {q.usedCount} used
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 mt-1">
                            <button
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              onClick={async () => {
                                if (!token) {
                                  alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                                  return;
                                }
                                try {
                                  await adminApi.reviewQuestion(q.id, 'GOOD', token);
                                  setSetQuestionsInSet((prev) =>
                                    prev.map((item) =>
                                      item.id === q.id ? { ...item, verified: true, archived: false } : item
                                    )
                                  );
                                } catch (err) {
                                  alert(
                                    err instanceof Error
                                      ? err.message
                                      : 'Không thể đánh dấu câu hỏi là tốt.'
                                  );
                                }
                              }}
                            >
                              <Check size={11} />
                              Tốt
                            </button>
                            <button
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100"
                              onClick={async () => {
                                if (!token) {
                                  alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                                  return;
                                }
                                try {
                                  await adminApi.reviewQuestion(q.id, 'HIDE', token);
                                  setSetQuestionsInSet((prev) =>
                                    prev.map((item) =>
                                      item.id === q.id ? { ...item, archived: true } : item
                                    )
                                  );
                                } catch (err) {
                                  alert(
                                    err instanceof Error
                                      ? err.message
                                      : 'Không thể ẩn / loại bỏ câu hỏi.'
                                  );
                                }
                              }}
                            >
                              <X size={11} />
                              Ẩn
                            </button>
                            {q.verified && !q.archived && (
                              <span className="text-[10px] text-emerald-600 font-semibold">
                                ✓ Đã duyệt
                              </span>
                            )}
                            {q.archived && (
                              <span className="text-[10px] text-rose-500 font-semibold">
                                Đã ẩn
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {previewMode === 'question' && selectedQuestion && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Nội dung câu hỏi
                    </p>
                    <p className="mt-1 text-sm text-slate-900 whitespace-pre-line">
                      {selectedQuestion.content}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {selectedQuestion.tags?.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
                      >
                        {t}
                      </span>
                    ))}
                    <span className="ml-auto text-slate-400">
                      {selectedQuestion.difficulty} · {selectedQuestion.usedCount} lần sử dụng
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <button
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      onClick={async () => {
                        if (!token || !selectedQuestion) {
                          alert('Phiên đăng nhập đã hết hạn hoặc câu hỏi không hợp lệ.');
                          return;
                        }
                        try {
                          await adminApi.reviewQuestion(selectedQuestion.id, 'GOOD', token);
                          alert('Đã đánh dấu câu hỏi là tốt.');
                        } catch (err) {
                          alert(
                            err instanceof Error
                              ? err.message
                              : 'Không thể cập nhật trạng thái câu hỏi.'
                          );
                        }
                      }}
                    >
                      <Check size={14} />
                      Câu hỏi tốt
                    </button>
                    <button
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100"
                      onClick={async () => {
                        if (!token || !selectedQuestion) {
                          alert('Phiên đăng nhập đã hết hạn hoặc câu hỏi không hợp lệ.');
                          return;
                        }
                        try {
                          await adminApi.reviewQuestion(selectedQuestion.id, 'HIDE', token);
                          alert('Đã ẩn / loại bỏ câu hỏi khỏi nội dung hiển thị.');
                        } catch (err) {
                          alert(
                            err instanceof Error
                              ? err.message
                              : 'Không thể cập nhật trạng thái câu hỏi.'
                          );
                        }
                      }}
                    >
                      <X size={14} />
                      Ẩn / loại bỏ
                    </button>
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <MessageCircle size={14} className="text-indigo-500" />
                  Thêm ghi chú / đề xuất cho ban nội dung
                </div>
                <textarea
                  className="w-full min-h-[80px] text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập đề xuất chỉnh sửa, nội dung cần bổ sung, lưu ý cho bộ câu hỏi/câu hỏi này..."
                  value={suggestionText}
                  onChange={(e) => setSuggestionText(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100"
                    onClick={closePreview}
                  >
                    Đóng
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                    onClick={handleSaveSuggestion}
                  >
                    Lưu đề xuất (local)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;
