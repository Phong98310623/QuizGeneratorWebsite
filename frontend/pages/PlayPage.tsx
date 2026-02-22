import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Flag, X, Frown, Heart, Bookmark, Copy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { publicApi, attemptsApi, reportApi, userFavoritesApi, PlayQuestion, QuestionSetMeta, SavedCollection } from '../services/api';

const CONFETTI_COLORS = ['var(--primary-500)', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444'];
const CONFETTI_COUNT = 60;

function ConfettiEffect() {
  const pieces = useMemo(() =>
    Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2.2 + Math.random() * 1.2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      isRect: Math.random() > 0.5,
    })),
    []
  );
  return (
    <>
      <style>{`
        @keyframes play-confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0.6; }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden" aria-hidden>
        {pieces.map((p) => (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.left}%`,
              top: '-2%',
              width: p.isRect ? p.size : p.size * 1.6,
              height: p.isRect ? p.size * 1.6 : p.size,
              backgroundColor: p.color,
              borderRadius: p.isRect ? 2 : '50%',
              animation: `play-confetti-fall ${p.duration}s ease-in forwards`,
              animationDelay: `${p.delay}s`,
              transformOrigin: 'center',
            }}
          />
        ))}
      </div>
    </>
  );
}

const SAD_FACE_COUNT = 28;

function SadFacesEffect() {
  const faces = useMemo(() =>
    Array.from({ length: SAD_FACE_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.8,
      duration: 3 + Math.random() * 2,
      size: 22 + Math.random() * 20,
    })),
    []
  );
  return (
    <>
      <style>{`
        @keyframes play-sad-fall {
          0% { transform: translateY(-30px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(180deg); opacity: 0.7; }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden" aria-hidden>
        {faces.map((f) => (
          <span
            key={f.id}
            className="absolute flex items-center justify-center text-amber-600/90"
            style={{
              left: `${f.left}%`,
              top: '-5%',
              width: f.size,
              height: f.size,
              animation: `play-sad-fall ${f.duration}s linear forwards`,
              animationDelay: `${f.delay}s`,
            }}
          >
            <Frown size={Math.round(f.size * 0.9)} strokeWidth={1.5} />
          </span>
        ))}
      </div>
    </>
  );
}

const REPORT_REASONS = [
  'Sai đáp án',
  'Câu hỏi không rõ ràng',
  'Nội dung không phù hợp',
  'Trùng lặp câu hỏi',
  'Lỗi chính tả / ngữ pháp',
  'Khác',
] as const;

const PlayPage: React.FC = () => {
  const { pin } = useParams<{ pin: string }>();
  const navigate = useNavigate();
  const [meta, setMeta] = useState<QuestionSetMeta | null>(null);
  const [questions, setQuestions] = useState<PlayQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const hasSavedToServer = useRef(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ reporterName: '', reporterEmail: '', reason: '', description: '' });
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [savedCollections, setSavedCollections] = useState<SavedCollection[]>([]);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showAddCollectionInput, setShowAddCollectionInput] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [collectionActionLoading, setCollectionActionLoading] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);

  const normalizedPin = pin ? decodeURIComponent(pin).trim().toUpperCase() : '';
  const playLink = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#/play/${encodeURIComponent(normalizedPin)}`
    : '';

  useEffect(() => {
    if (!normalizedPin) {
      setError('Mã PIN không hợp lệ');
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [setRes, questionsRes] = await Promise.all([
          publicApi.getSetByPin(normalizedPin),
          publicApi.getQuestionsByPin(normalizedPin),
        ]);
        setMeta(setRes);
        setQuestions(questionsRes);
        if (questionsRes.length === 0) setError('Bộ câu hỏi trống.');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Không tải được bộ câu hỏi.');
      } finally {
        setLoading(false);
      }
    })();
  }, [normalizedPin]);

  const { isAuthenticated } = useAuth();
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const data = await userFavoritesApi.get(null as any);
        setFavorites(data.favorites || []);
        setSavedCollections(data.savedCollections || []);
      } catch {
        // User might not have favorites yet
      }
    })();
  }, [isAuthenticated]);

  const current = questions[index];
  const isFavorite = current && isAuthenticated ? favorites.includes(current.id) : false;

  const handleToggleFavorite = async () => {
    if (!isAuthenticated || !current) return;
    setFavoritesLoading(true);
    try {
      const res = await userFavoritesApi.toggleFavorite(null as any, current.id);
      setFavorites(res.favorites);
    } catch {
      // ignore
    } finally {
      setFavoritesLoading(false);
    }
  };

  const handleOpenBookmarkModal = () => {
    if (!isAuthenticated || !current) return;
    setShowAddCollectionInput(false);
    setNewCollectionName('');
    setShowBookmarkModal(true);
  };

  const handleAddToCollection = async (nameid: string) => {
    if (!isAuthenticated || !current) return;
    setCollectionActionLoading(nameid);
    try {
      const updated = await userFavoritesApi.addToCollection(null as any, nameid, current.id);
      setSavedCollections((prev) =>
        prev.map((c) => (c.nameid === nameid ? updated : c))
      );
    } catch {
      // ignore
    } finally {
      setCollectionActionLoading(null);
    }
  };

  const handleCreateCollection = async () => {
    if (!isAuthenticated || !newCollectionName.trim()) return;
    setCollectionActionLoading('create');
    try {
      const created = await userFavoritesApi.createCollection(null as any, newCollectionName.trim());
      setSavedCollections((prev) => [...prev, created]);
      setNewCollectionName('');
      setShowAddCollectionInput(false);
      await handleAddToCollection(created.nameid);
    } catch {
      // ignore
    } finally {
      setCollectionActionLoading(null);
    }
  };
  const isLast = index >= questions.length - 1;
  const isCorrect = current && selected !== null && (current.options?.find((o) => o.text === selected)?.isCorrect ?? current.correctAnswer === selected);

  const handleNext = () => {
    if (isLast) return;
    setIndex((i) => i + 1);
    setSelected(null);
    setSubmitted(false);
  };

  const handleSubmit = () => {
    if (selected === null || !current) return;
    setSubmitted(true);
    setAnswers((prev) => ({ ...prev, [current.id]: selected }));
    if (isCorrect) setCorrectCount((c) => c + 1);
  };

  const handleFinish = async () => {
    setIndex(questions.length);
    if (meta && normalizedPin && questions.length > 0 && !hasSavedToServer.current && isAuthenticated) {
      hasSavedToServer.current = true;
      const allAnswers = questions.map((q) => ({
        questionId: q.id,
        selectedAnswer: answers[q.id] ?? (current && q.id === current.id ? selected ?? '' : ''),
      }));
      try {
        await attemptsApi.submit(null as any, normalizedPin, allAnswers);
      } catch {
        hasSavedToServer.current = false;
      }
    }
  };

  const handlePlayAgain = () => {
    setIndex(0);
    setSelected(null);
    setSubmitted(false);
    setCorrectCount(0);
    setAnswers({});
    hasSavedToServer.current = false;
  };

  const openReportModal = () => {
    setReportForm({ reporterName: '', reporterEmail: '', reason: '', description: '' });
    setReportSuccess(false);
    setReportError('');
    setShowReportModal(true);
  };

  const handleReportSubmit = async () => {
    if (!current || !reportForm.reporterName || !reportForm.reporterEmail || !reportForm.reason) {
      setReportError('Vui lòng điền đầy đủ tên, email và lý do báo cáo.');
      return;
    }
    setReportSubmitting(true);
    setReportError('');
    try {
      await reportApi.create({
        reporterName: reportForm.reporterName.trim(),
        reporterEmail: reportForm.reporterEmail.trim(),
        reportedEntityType: 'CONTENT',
        reportedEntityId: current.id,
        reportedEntityTitle: current.content.substring(0, 200),
        reason: reportForm.reason.trim(),
        description: reportForm.description?.trim() || undefined,
      });
      setReportSuccess(true);
      setTimeout(() => setShowReportModal(false), 1500);
    } catch (e) {
      setReportError(e instanceof Error ? e.message : 'Không thể gửi báo cáo');
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !meta) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error || 'Bộ câu hỏi không tồn tại.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Bộ câu hỏi trống.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-sm w-full text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">{meta?.title}</h2>
          <p className="text-slate-500 text-sm mb-6">{questions.length} câu hỏi</p>
          <div className="flex justify-center mb-6">
            <QRCodeSVG value={playLink} size={180} level="M" className="rounded-lg border border-slate-200 p-2 bg-white" />
          </div>
          <p className="text-slate-600 text-sm mb-1">Mã PIN</p>
          <div className="flex items-center justify-center gap-2 mb-6">
            <p className="text-2xl font-bold font-mono text-indigo-600">{normalizedPin}</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(normalizedPin);
                setPinCopied(true);
                setTimeout(() => setPinCopied(false), 1500);
              }}
              className={`p-2 rounded-lg transition-colors ${pinCopied ? 'text-green-600 bg-green-50' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
              title="Sao chép mã PIN"
            >
              <Copy size={20} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-6">Quét QR để chia sẻ link làm bài</p>
          <button
            type="button"
            onClick={() => setGameStarted(true)}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700"
          >
            Bắt đầu
          </button>
        </div>
      </div>
    );
  }

  const finished = index >= questions.length;
  if (finished) {
    const total = questions.length;
    const correct = correctCount;
    const passed = total > 0 && correct / total > 0.5;
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
        {passed ? <ConfettiEffect /> : <SadFacesEffect />}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center relative z-10">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Kết quả</h2>
          <p className="text-3xl font-bold text-indigo-600 mb-1">{correct} / {total}</p>
          <p className="text-slate-500 mb-6">câu đúng</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              Về trang chủ
            </button>
            <button
              onClick={handlePlayAgain}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
            >
              Làm lại
            </button>
            <button
              onClick={() => navigate('/explore')}
              className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 text-sm font-medium"
            >
              Khám phá thêm
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = current;
  const options = q.options?.length ? q.options : (q.correctAnswer ? [{ text: q.correctAnswer, isCorrect: true }] : []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 py-3 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-slate-500 hover:text-slate-700 text-sm"
          >
            Thoát
          </button>
          <span className="text-sm font-medium text-slate-600">{meta.title}</span>
          <span className="text-sm text-slate-400">{index + 1} / {questions.length}</span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 flex-1">{q.content}</h2>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isAuthenticated && (
                <>
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    disabled={favoritesLoading}
                    className={`p-2 rounded-lg transition-colors ${
                      isFavorite
                        ? 'text-rose-500 hover:bg-rose-50'
                        : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                    }`}
                    title={isFavorite ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
                  >
                    <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenBookmarkModal}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Lưu vào bộ sưu tập"
                  >
                    <Bookmark size={18} />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={openReportModal}
                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="Báo cáo câu hỏi"
              >
                <Flag size={18} />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {options.map((opt) => {
              const isChosen = selected === opt.text;
              const showRight = submitted && opt.isCorrect;
              const showWrong = submitted && isChosen && !opt.isCorrect;
              return (
                <button
                  key={opt.text}
                  type="button"
                  disabled={submitted}
                  onClick={() => !submitted && setSelected(opt.text)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    showRight ? 'border-green-500 bg-green-50 text-green-800' :
                    showWrong ? 'border-red-500 bg-red-50 text-red-800' :
                    isChosen ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>
          {q.explanation && submitted && (
            <p className="mt-4 text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">{q.explanation}</p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            {!submitted ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={selected === null}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Xác nhận
              </button>
            ) : isLast ? (
              <button
                type="button"
                onClick={handleFinish}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Xem kết quả
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Câu tiếp
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Modal báo cáo câu hỏi */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !reportSubmitting && setShowReportModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Báo cáo câu hỏi</h3>
              <button type="button" onClick={() => !reportSubmitting && setShowReportModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded">
                <X size={20} />
              </button>
            </div>
            {reportSuccess ? (
              <p className="text-green-600 py-4">Đã gửi báo cáo. Cảm ơn bạn!</p>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-4">Bạn phát hiện vấn đề với câu hỏi này? Gửi báo cáo để chúng tôi xem xét.</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Họ tên *"
                    value={reportForm.reporterName}
                    onChange={(e) => setReportForm((f) => ({ ...f, reporterName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={reportForm.reporterEmail}
                    onChange={(e) => setReportForm((f) => ({ ...f, reporterEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <select
                    value={reportForm.reason}
                    onChange={(e) => setReportForm((f) => ({ ...f, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Chọn lý do báo cáo *</option>
                    {REPORT_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <textarea
                    placeholder="Mô tả thêm (tùy chọn)"
                    value={reportForm.description}
                    onChange={(e) => setReportForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                </div>
                {reportError && <p className="text-sm text-red-600 mt-2">{reportError}</p>}
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => !reportSubmitting && setShowReportModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleReportSubmit}
                    disabled={reportSubmitting}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                  >
                    {reportSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Lưu vào bộ sưu tập */}
      {showBookmarkModal && isAuthenticated && current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowBookmarkModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Lưu vào bộ sưu tập</h3>
              <button
                type="button"
                onClick={() => setShowBookmarkModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {savedCollections.map((col) => {
                const hasQuestion = col.questionIds.includes(current.id);
                return (
                  <button
                    key={col.nameid}
                    type="button"
                    disabled={hasQuestion || collectionActionLoading === col.nameid}
                    onClick={() => handleAddToCollection(col.nameid)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      hasQuestion
                        ? 'border-green-500 bg-green-50 text-green-700 cursor-default'
                        : 'border-slate-200 hover:border-indigo-500 hover:bg-indigo-50'
                    }`}
                  >
                    <span className="font-medium">{col.name}</span>
                    {hasQuestion && <span className="ml-2 text-sm">(đã lưu)</span>}
                    {collectionActionLoading === col.nameid && <span className="ml-2 text-sm">...</span>}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              {showAddCollectionInput ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tên bộ sưu tập mới"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateCollection}
                    disabled={!newCollectionName.trim() || collectionActionLoading === 'create'}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                  >
                    Tạo
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddCollectionInput(false); setNewCollectionName(''); }}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddCollectionInput(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors"
                >
                  <span className="text-xl leading-none">+</span>
                  <span className="font-medium">Tạo bộ sưu tập mới</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayPage;
