import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  EyeOff,
  ExternalLink,
  User,
  Calendar,
  Pencil,
  Save,
  X,
  FileText,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { adminApi } from '../../services/adminApi';

interface UsedByAttempt {
  answer: string;
  attemptedAt: string | null;
  isCorrect: boolean;
}

interface UsedByUser {
  id: string;
  email: string;
  fullName: string;
  totalAttempts: number;
  correctAttempts: number;
  ratio: string;
  attempts?: UsedByAttempt[];
}

interface Creator {
  id: string;
  email: string;
  fullName: string;
}

interface QuestionSetRef {
  id: string;
  title: string;
}

interface QuestionOption {
  text: string;
  isCorrect?: boolean;
}

interface QuestionData {
  id?: string;
  content?: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  tags?: string[];
  difficulty?: string;
  explanation?: string;
  verified?: boolean;
  archived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  usedCount?: number;
  usedByUsers?: UsedByUser[];
  creator?: Creator | null;
  questionSet?: QuestionSetRef | null;
}

const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'] as const;

const getDifficultyStyles = (d: string) => {
  switch (d?.toLowerCase()) {
    case 'easy':
      return 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100';
    case 'hard':
      return 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100';
    default:
      return 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100';
  }
};

interface EditableFieldProps {
  label: string;
  value: string;
  multiline?: boolean;
  editing: boolean;
  onEdit: () => void;
  onChange: (v: string) => void;
  onBlur?: () => void;
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

const QuestionPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QuestionData | null>(null);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editOptions, setEditOptions] = useState<QuestionOption[]>([]);
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('');
  const [editExplanation, setEditExplanation] = useState('');
  const [popoverUserId, setPopoverUserId] = useState<string | null>(null);
  const [triggerRect, setTriggerRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const popoverUser = (data?.usedByUsers ?? []).find((u) => u.id === popoverUserId);

  const fetchData = useCallback(async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      setError(null);
      const q = await adminApi.getQuestionById(id, token);
      setData(q as QuestionData);
      const opts = (q as QuestionData).options || [];
      setEditContent((q as QuestionData).content ?? '');
      setEditOptions(opts.length > 0 ? opts.map((o) => ({ text: o.text, isCorrect: !!o.isCorrect })) : []);
      setEditCorrectAnswer((q as QuestionData).correctAnswer ?? '');
      setEditDifficulty((q as QuestionData).difficulty ?? 'medium');
      setEditExplanation((q as QuestionData).explanation ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerify = async () => {
    if (!token || !id || !data) return;
    const newVerified = !data.verified;
    setUpdating(true);
    try {
      await adminApi.verifyQuestion(id, newVerified, token);
      setData((prev) => (prev ? { ...prev, verified: newVerified } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi verify');
    } finally {
      setUpdating(false);
    }
  };

  const handleArchive = async () => {
    if (!token || !id || !data) return;
    const newArchived = !data.archived;
    setUpdating(true);
    try {
      await adminApi.archiveQuestion(id, newArchived, token);
      setData((prev) => (prev ? { ...prev, archived: newArchived } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi cập nhật');
    } finally {
      setUpdating(false);
    }
  };

  const handleSave = async () => {
    if (!token || !id) return;
    setUpdating(true);
    try {
      const options =
        editOptions.length > 0
          ? editOptions.map((o) => ({ text: o.text.trim(), isCorrect: !!o.isCorrect })).filter((o) => o.text)
          : undefined;
      const correctAnswer = editOptions.length > 0 ? editOptions.find((o) => o.isCorrect)?.text ?? '' : editCorrectAnswer;
      await adminApi.updateQuestion(
        id,
        {
          content: editContent.trim(),
          options: options && options.length > 0 ? options : undefined,
          correctAnswer: correctAnswer.trim(),
          difficulty: editDifficulty,
          explanation: editExplanation.trim() || undefined,
        },
        token
      );
      setData((prev) =>
        prev
          ? {
              ...prev,
              content: editContent,
              options: editOptions,
              correctAnswer,
              difficulty: editDifficulty,
              explanation: editExplanation,
            }
          : null
      );
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu');
    } finally {
      setUpdating(false);
    }
  };

  const handleOptionChange = (index: number, text: string) => {
    setEditOptions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], text };
      return next;
    });
  };

  const handleOptionCorrect = (index: number) => {
    setEditOptions((prev) =>
      prev.map((o, i) => ({ ...o, isCorrect: i === index }))
    );
  };

  const addOption = () => {
    setEditOptions((prev) => [...prev, { text: '', isCorrect: prev.length === 0 }]);
  };

  const removeOption = (index: number) => {
    setEditOptions((prev) => prev.filter((_, i) => i !== index));
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

  const usedByUsers = data.usedByUsers || [];
  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString('vi-VN') : '—');

  // Tổng tỉ lệ đúng từ tất cả user (cho footer)
  const totalStats = usedByUsers.reduce(
    (acc, u) => ({
      correct: acc.correct + (u.correctAttempts ?? 0),
      total: acc.total + (u.totalAttempts ?? 0),
    }),
    { correct: 0, total: 0 }
  );
  const totalCorrectRate =
    totalStats.total > 0 ? Math.round((totalStats.correct / totalStats.total) * 100) : null;

  // Đề xuất độ khó theo % đúng (chỉ đề xuất, không tự sửa)
  const getSuggestedDifficultyByRate = (rate: number | null): 'easy' | 'medium' | 'hard' | null => {
    if (rate === null) return null;
    if (rate >= 70) return 'easy';
    if (rate >= 40) return 'medium';
    return 'hard';
  };
  const suggestedDifficulty = getSuggestedDifficultyByRate(totalCorrectRate);
  const currentDifficulty = (data.difficulty ?? (editDifficulty || 'medium')).toLowerCase();
  const shouldSuggestChange =
    suggestedDifficulty != null &&
    currentDifficulty !== suggestedDifficulty &&
    ['easy', 'medium', 'hard'].includes(currentDifficulty);

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 rounded-xl">
            <MessageSquare size={24} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Chi tiết Câu hỏi</h1>
            <p className="text-sm text-slate-500">ID: {String(data.id ?? id)}</p>
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
          <button
            onClick={handleArchive}
            disabled={updating}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              data.archived
                ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            } disabled:opacity-50`}
          >
            <EyeOff size={16} />
            {data.archived ? 'Bỏ ẩn' : 'Ẩn'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <EditableField
          label="Nội dung"
          value={editContent}
          multiline
          editing={editMode}
          onEdit={() => setEditMode(true)}
          onChange={setEditContent}
        />

        {/* Đáp án */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Đáp án</p>
          {editMode ? (
            <div className="space-y-2">
              {editOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleOptionCorrect(i)}
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      opt.isCorrect ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {opt.isCorrect && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Đáp án ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addOption}
                className="text-sm text-indigo-600 hover:underline"
              >
                + Thêm đáp án
              </button>
            </div>
          ) : (
            <div
              onClick={() => setEditMode(true)}
              className="group relative cursor-pointer py-2 px-3 -mx-3 -my-1 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            >
              {editOptions.length > 0 ? (
                <ul className="space-y-1 pr-8">
                  {editOptions.map((opt, i) => (
                    <li
                      key={i}
                      className={`flex items-center gap-2 text-sm ${opt.isCorrect ? 'text-emerald-600 font-medium' : 'text-slate-600'}`}
                    >
                      <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0">
                        {opt.isCorrect && <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                      </span>
                      {opt.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-400">Chưa có đáp án — bấm để thêm</span>
              )}
              <span className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil size={14} className="text-indigo-500" />
              </span>
            </div>
          )}
        </div>

        {/* Đáp án đúng - chỉ khi không có options (fill-in) */}
        {editOptions.length === 0 && (
          <EditableField
            label="Đáp án đúng"
            value={editCorrectAnswer}
            editing={editMode}
            onEdit={() => setEditMode(true)}
            onChange={setEditCorrectAnswer}
          />
        )}

        {/* Độ khó */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Độ khó</p>
          {editMode ? (
            <select
              value={editDifficulty}
              onChange={(e) => setEditDifficulty(e.target.value)}
              className={`w-full max-w-[140px] px-3 py-2 rounded-lg text-sm font-medium border-2 focus:ring-2 focus:ring-offset-0 focus:ring-indigo-500 ${getDifficultyStyles(editDifficulty)}`}
            >
              {DIFFICULTY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          ) : (
            <div
              onClick={() => setEditMode(true)}
              className={`group cursor-pointer py-2 px-4 rounded-lg border-2 w-fit inline-flex items-center transition-colors ${getDifficultyStyles(editDifficulty)}`}
            >
              <span className="font-medium">{editDifficulty || '—'}</span>
              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil size={14} className="text-current opacity-70" />
              </span>
            </div>
          )}
        </div>

        {(data.tags?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tags</p>
            <div className="flex flex-wrap gap-1">
              {data.tags!.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-slate-500">Đã làm: </span>
            <span className="font-medium text-slate-700">{Number(data.usedCount ?? 0)} lần</span>
          </div>
          <div>
            <span className="text-slate-500">Verified: </span>
            <span className={data.verified ? 'text-emerald-600 font-medium' : 'text-slate-500'}>{data.verified ? 'Có' : 'Chưa'}</span>
          </div>
          <div>
            <span className="text-slate-500">Archived: </span>
            <span className={data.archived ? 'text-rose-600 font-medium' : 'text-slate-500'}>{data.archived ? 'Có' : 'Không'}</span>
          </div>
        </div>

        <EditableField
          label="Giải thích"
          value={editExplanation}
          multiline
          editing={editMode}
          onEdit={() => setEditMode(true)}
          onChange={setEditExplanation}
        />

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

        {data.questionSet && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Bộ câu hỏi</p>
            <a
              href={`${window.location.origin}${window.location.pathname}#/admin/preview/set/${data.questionSet.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <FileText size={16} />
              <span className="font-medium">{data.questionSet.title}</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {data.creator && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Người tạo</p>
            <a
              href={`${window.location.origin}${window.location.pathname}#/admin/preview/user/${data.creator.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <User size={16} />
              <span className="font-medium">{data.creator.fullName}</span>
              <span className="text-indigo-500 text-xs">({data.creator.email})</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {usedByUsers.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">User đã làm (tỉ lệ đúng)</p>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">User</th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">Email</th>
                    <th className="px-4 py-2 text-center font-medium text-slate-600">Tỉ lệ đúng</th>
                    <th className="px-4 py-2 text-center font-medium text-slate-600">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usedByUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-slate-900">{u.fullName}</td>
                      <td className="px-4 py-2 text-slate-600">{u.email}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            const el = e.currentTarget as HTMLElement;
                            const rect = el.getBoundingClientRect();
                            if (popoverUserId === u.id) {
                              setPopoverUserId(null);
                              setTriggerRect(null);
                            } else {
                              setTriggerRect({ top: rect.top, left: rect.left, width: rect.width });
                              setPopoverUserId(u.id);
                            }
                          }}
                          className={`font-medium underline decoration-dotted cursor-pointer hover:opacity-80 ${
                            u.totalAttempts > 0 && u.correctAttempts === u.totalAttempts
                              ? 'text-emerald-600'
                              : u.correctAttempts > 0
                                ? 'text-amber-600'
                                : 'text-slate-500'
                          }`}
                          title="Xem danh sách đáp án đã chọn"
                        >
                          {u.ratio}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <a
                          href={`${window.location.origin}${window.location.pathname}#/admin/preview/user/${u.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                        >
                          Xem <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                        <span className="font-medium text-slate-700">
                          Tổng tỉ lệ đúng:{' '}
                          {totalCorrectRate != null ? (
                            <span
                              className={
                                totalCorrectRate >= 70
                                  ? 'text-emerald-600'
                                  : totalCorrectRate >= 40
                                    ? 'text-amber-600'
                                    : 'text-rose-600'
                              }
                            >
                              {totalCorrectRate}%
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                          {totalStats.total > 0 && (
                            <span className="text-slate-500 font-normal ml-1">
                              ({totalStats.correct}/{totalStats.total} lần)
                            </span>
                          )}
                        </span>
                        {shouldSuggestChange && suggestedDifficulty && (
                          <span className="text-amber-700 text-xs sm:text-sm bg-amber-50 px-2 py-1 rounded border border-amber-200">
                            Đề xuất độ khó: <strong>{suggestedDifficulty}</strong> (hiện tại: {currentDifficulty})
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

      {typeof document !== 'undefined' &&
        popoverUserId &&
        popoverUser &&
        triggerRect &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[100]"
              aria-hidden
              onClick={() => {
                setPopoverUserId(null);
                setTriggerRect(null);
              }}
            />
            <div
              className="fixed z-[110] min-w-[240px] max-w-[360px] bg-white border border-slate-200 rounded-xl shadow-lg py-2 max-h-[280px] overflow-y-auto"
              style={{
                bottom: window.innerHeight - triggerRect.top + 8,
                left: triggerRect.left + triggerRect.width / 2,
                transform: 'translateX(-50%)',
              }}
            >
              <p className="px-3 py-1.5 text-xs font-semibold text-slate-500 border-b border-slate-100 sticky top-0 bg-white">
                Đáp án đã chọn{popoverUser.attempts?.length ? ` (${popoverUser.attempts.length} lần)` : ''}
              </p>
              {(popoverUser.attempts?.length ?? 0) > 0 ? (
                <ul className="px-2 py-1">
                  {popoverUser.attempts!.map((a, i) => (
                    <li
                      key={i}
                      className="px-2 py-2 rounded-lg border-b border-slate-50 last:border-0 text-left"
                    >
                      <span
                        className={`text-sm ${a.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}
                      >
                        {a.answer || '—'}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">
                        {a.attemptedAt
                          ? new Date(a.attemptedAt).toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </span>
                      <span
                        className={`block mt-0.5 text-xs font-medium ${a.isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}
                      >
                        {a.isCorrect ? 'Đúng' : 'Sai'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-3 text-sm text-slate-500">Không có dữ liệu từng lần làm.</p>
              )}
            </div>
          </>,
          document.body
        )}
      </div>
    </div>
  );
};

export default QuestionPreviewPage;
