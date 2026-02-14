import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Pencil,
  Save,
  X,
  Calendar,
  User,
  ExternalLink,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { adminApi } from '../../services/adminApi';

interface CreatorRef {
  id: string;
  email: string;
  fullName: string;
}

interface SetData {
  id?: string;
  title?: string;
  description?: string;
  type?: string;
  pin?: string | null;
  count?: number;
  questionIds?: string[];
  verified?: boolean;
  createdBy?: CreatorRef | null;
  createdAt?: string;
  updatedAt?: string;
  generatorTopic?: string;
  generatorCount?: number | null;
  generatorDifficulty?: string;
  generatorType?: string;
  questions?: Array<{ id: string; content: string }>;
}

interface EditableFieldProps {
  label: string;
  value: string;
  multiline?: boolean;
  editing: boolean;
  onEdit: () => void;
  onChange: (v: string) => void;
  placeholder?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  multiline,
  editing,
  onEdit,
  onChange,
  placeholder = '—',
}) => (
  <div className="group relative">
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
    {editing ? (
      multiline ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y min-h-[80px]"
          rows={3}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder={placeholder}
        />
      )
    ) : (
      <div
        onClick={onEdit}
        className="relative cursor-pointer py-2 px-3 -mx-3 -my-1 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 min-h-[2rem]"
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>{value || placeholder}</span>
        <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil size={14} className="text-indigo-500" />
        </span>
      </div>
    )}
  </div>
);

const SetPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SetData | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !id) return;
    try {
      setLoading(true);
      setError(null);
      const [s, questions] = await Promise.all([
        adminApi.getSetById(id),
        adminApi.getQuestionsBySet(id),
      ]);
      const setDataRaw = s as SetData;
      setData({ ...setDataRaw, questions: questions || [] });
      setEditTitle(setDataRaw.title ?? '');
      setEditDescription(setDataRaw.description ?? '');
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

  const handleVerify = async () => {
    if (!isAuthenticated || !id || !data) return;
    const newVerified = !data.verified;
    setUpdating(true);
    try {
      await adminApi.verifyQuestionSet(id, newVerified);
      setData((prev) => (prev ? { ...prev, verified: newVerified } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi verify');
    } finally {
      setUpdating(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated || !id) return;
    setUpdating(true);
    try {
      const updated = await adminApi.updateSet(id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      setData((prev) => (prev ? { ...prev, ...updated } : null));
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString('vi-VN') : '—');

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
  const questionIds = data.questionIds || [];
  const pin = data.pin;

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-xl">
            <FileText size={24} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Chi tiết Bộ câu hỏi</h1>
            <p className="text-sm text-slate-500">
              ID: {String(data.id ?? id)}
              {pin && ` • PIN: ${pin}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                disabled={updating}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
                <Save size={16} />
                Lưu
              </button>
              <button
                onClick={() => setEditMode(false)}
                disabled={updating}
                className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium"
              >
                <X size={16} />
                Hủy
              </button>
            </>
          ) : null}
          <button
            onClick={handleVerify}
            disabled={updating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              data.verified
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            } disabled:opacity-50`}
          >
            <CheckCircle size={16} />
            {data.verified ? 'Bỏ Verified' : 'Verified'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <EditableField
          label="Tiêu đề"
          value={editTitle}
          editing={editMode}
          onEdit={() => setEditMode(true)}
          onChange={setEditTitle}
        />
        <EditableField
          label="Mô tả"
          value={editDescription}
          multiline
          editing={editMode}
          onEdit={() => setEditMode(true)}
          onChange={setEditDescription}
        />

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Loại (type)</p>
          <p className="text-slate-900 py-1">{data.type || '—'}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">PIN</p>
          <p className="text-slate-900 py-1">{data.pin ?? '—'}</p>
        </div>

        {pin && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Link chơi (Play)</p>
            <a
              href={`${window.location.origin}${window.location.pathname}#/play/${encodeURIComponent(pin)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-indigo-600 hover:underline"
            >
              Mở Play (PIN: {pin}) <ExternalLink size={14} />
            </a>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Số câu</p>
          <p className="text-slate-900">{Number(data.count ?? questions.length ?? questionIds.length ?? 0)}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Generator Topic (chủ đề tạo)</p>
          <p className="text-slate-900 py-1">{data.generatorTopic || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Generator Count</p>
          <p className="text-slate-900 py-1">{data.generatorCount != null ? data.generatorCount : '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Generator Difficulty</p>
          <p className="text-slate-900 py-1">{data.generatorDifficulty || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Generator Type</p>
          <p className="text-slate-900 py-1">{data.generatorType || '—'}</p>
        </div>

        <div className="flex gap-4 text-sm">
          <span className="text-slate-500">Verified: </span>
          <span className={data.verified ? 'text-emerald-600 font-medium' : 'text-slate-500'}>
            {data.verified ? 'Có' : 'Chưa'}
          </span>
        </div>

        <div className="flex gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            Tạo: {formatDate(data.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            Cập nhật: {formatDate(data.updatedAt)}
          </span>
        </div>

        {data.createdBy && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Người tạo</p>
            <a
              href={`${window.location.origin}${window.location.pathname}#/admin/preview/user/${data.createdBy.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <User size={16} />
              <span className="font-medium">{data.createdBy.fullName}</span>
              <span className="text-indigo-500 text-xs">({data.createdBy.email})</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {(questionIds.length > 0 || questions.length > 0) && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Danh sách câu hỏi</p>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {(questions.length > 0 ? questions : questionIds.map((qid) => ({ id: qid, content: '' }))).map(
                (q, i) => (
                  <li key={q.id} className="text-sm text-slate-700 p-2 bg-slate-50 rounded-lg flex items-center gap-2">
                    <span className="flex-shrink-0">{i + 1}.</span>
                    {q.content ? (
                      <span className="line-clamp-2 flex-1">{q.content}</span>
                    ) : null}
                    <a
                      href={`${window.location.origin}${window.location.pathname}#/admin/preview/question/${q.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-indigo-600 hover:underline inline-flex items-center gap-1"
                    >
                      Xem <ExternalLink size={12} />
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetPreviewPage;
