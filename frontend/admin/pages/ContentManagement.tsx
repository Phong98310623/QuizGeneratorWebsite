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
  X,
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
  const { isAuthenticated } = useAdminAuth();
  const [stats, setStats] = useState({ totalQuestions: 0, totalSets: 0, verifiedSets: 0 });
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'sets' | 'questions'>('sets');
  const [previewIframe, setPreviewIframe] = useState<{ type: 'set' | 'question'; id: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Yêu cầu đăng nhập');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [statsData, setsData, questionsData] = await Promise.all([
        adminApi.getContentStats(),
        adminApi.getQuestionSets(),
        adminApi.getQuestions(),
      ]);
      setStats(statsData);
      setQuestionSets(Array.isArray(setsData) ? setsData : []);
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openSetPreview = (set: QuestionSet) => {
    setPreviewIframe({ type: 'set', id: set.id });
  };

  const openQuestionPreview = (q: Question) => {
    setPreviewIframe({ type: 'question', id: q.id });
  };

  const closePreview = () => {
    setPreviewIframe(null);
    fetchData();
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
                    className="group p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => openQuestionPreview(q)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-slate-900 line-clamp-2 flex-1 group-hover:text-indigo-600 transition-colors">{q.content}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye size={14} />
                        Xem chi tiết
                      </span>
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
      {previewIframe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {previewIframe.type === 'set' ? 'Chi tiết Bộ câu hỏi' : 'Chi tiết Câu hỏi'}
              </h3>
              <button
                onClick={closePreview}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <iframe
                src={
                  previewIframe.type === 'set'
                    ? `${window.location.origin}${window.location.pathname}#/admin/preview/set/${encodeURIComponent(previewIframe.id)}`
                    : `${window.location.origin}${window.location.pathname}#/admin/preview/question/${encodeURIComponent(previewIframe.id)}`
                }
                title={previewIframe.type === 'set' ? 'Chi tiết bộ câu hỏi' : 'Chi tiết câu hỏi'}
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

export default ContentManagement;
