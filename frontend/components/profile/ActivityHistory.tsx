import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { attemptsApi, AttemptHistoryItem } from '../../services/api';

const ActivityHistory: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [history, setHistory] = useState<AttemptHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setHistoryLoading(false);
      return;
    }
    attemptsApi.getMyHistory(null as any).then((data) => {
      setHistory(data);
    }).catch(() => setHistory([])).finally(() => setHistoryLoading(false));
  }, [isAuthenticated]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Hoạt động gần đây</h2>
      {historyLoading ? (
        <p className="text-slate-500 text-sm">Đang tải...</p>
      ) : history.length === 0 ? (
        <p className="text-slate-500 text-sm">Các bộ câu hỏi bạn đã làm sẽ hiển thị ở đây.</p>
      ) : (
        <ul className="space-y-4">
          {history.map((item) => (
            <li key={item.attemptId} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between gap-3 p-4 bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 truncate">{item.setTitle}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.correctCount}/{item.totalCount} câu đúng · {new Date(item.completedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <Link
                  to={`/play/${encodeURIComponent(item.pin)}`}
                  className="shrink-0 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg"
                >
                  Làm lại
                </Link>
              </div>
              <div className="border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setExpandedAttemptId((id) => (id === item.attemptId ? null : item.attemptId))}
                  className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center justify-between"
                >
                  Xem chi tiết từng câu
                  <svg className={`w-4 h-4 transition-transform ${expandedAttemptId === item.attemptId ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedAttemptId === item.attemptId && item.details.length > 0 && (
                  <ul className="px-4 pb-4 space-y-2">
                    {item.details.map((d, i) => (
                      <li key={d.questionId} className="text-sm p-3 rounded-lg border border-slate-100 bg-white">
                        <p className="font-medium text-slate-800 mb-1">{d.content}</p>
                        <p className="text-slate-600">
                          Bạn chọn: <span className={d.isCorrect ? 'text-green-600 font-medium' : 'text-red-600'}>{d.userAnswer || '—'}</span>
                          {!d.isCorrect && d.correctAnswer && (
                            <span className="block mt-0.5 text-slate-500">Đáp án đúng: {d.correctAnswer}</span>
                          )}
                        </p>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium mt-1 ${d.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {d.isCorrect ? '✓ Đúng' : '✗ Sai'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ActivityHistory;
