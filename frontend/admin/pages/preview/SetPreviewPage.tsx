import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { adminApi } from '../../services/adminApi';

interface SetData {
  id?: string;
  title?: string;
  description?: string;
  type?: string;
  pin?: string | null;
  count?: number;
  questions?: Array<{ id: string; content: string }>;
}

const SetPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SetData | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !id) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [s, questions] = await Promise.all([
          adminApi.getSetById(id),
          adminApi.getQuestionsBySet(id),
        ]);
        setData({ ...(s as SetData), questions: questions || [] });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, id]);

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

  const questions = data.questions || [];
  const pin = data.pin;

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 rounded-xl">
          <FileText size={24} className="text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Chi tiết Bộ câu hỏi</h1>
          <p className="text-sm text-slate-500">ID: {String(data.id ?? id)} {pin && `• PIN: ${pin}`}</p>
        </div>
      </div>
      <div className="space-y-4 bg-white border border-slate-200 rounded-xl p-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tiêu đề</p>
          <p className="font-medium text-slate-900">{String(data.title ?? '—')}</p>
        </div>
        {data.description && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Mô tả</p>
            <p className="text-sm text-slate-600">{data.description}</p>
          </div>
        )}
        <div className="flex gap-2 text-xs text-slate-500 flex-wrap">
          <span>Loại: {String(data.type ?? '—')}</span>
          <span>•</span>
          <span>Số câu: {Number(data.count ?? questions.length ?? 0)}</span>
          {pin && (
            <>
              <span>•</span>
              <a
                href={`${window.location.origin}${window.location.pathname}#/play/${encodeURIComponent(pin)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                Mở Play (PIN: {pin})
              </a>
            </>
          )}
        </div>
        {questions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Danh sách câu hỏi</p>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {questions.map((q, i) => (
                <li key={q.id} className="text-sm text-slate-700 p-2 bg-slate-50 rounded-lg line-clamp-2">
                  {i + 1}. {q.content}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetPreviewPage;
