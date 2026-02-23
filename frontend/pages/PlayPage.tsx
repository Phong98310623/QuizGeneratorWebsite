import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Flag, X, Frown, Heart, Bookmark, Copy, Sparkles, Star, ChevronDown, Compass, Plus, LogOut, User as UserIcon, Facebook, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import { publicApi, attemptsApi, reportApi, userFavoritesApi, PlayQuestion, QuestionSetMeta, SavedCollection } from '../services/api';

const CONFETTI_COLORS = ['var(--primary-500)', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444'];
const CONFETTI_COUNT = 60;

function DecorativeBackground() {
  const { user } = useAuth();
  const isVip = user?.role === 'VIP';

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-30">
      {/* Dynamic Gradients */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-primary-200 animate-pulse"
        style={{ animationDuration: '8s' }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-primary-300 animate-pulse"
        style={{ animationDuration: '12s', animationDelay: '2s' }}
      />
      
      {/* VIP Specific floating elements */}
      {isVip && (
        <>
          <Star className="absolute top-[15%] left-[10%] text-primary-400 animate-bounce" size={24} style={{ animationDuration: '4s' }} />
          <Sparkles className="absolute top-[40%] right-[15%] text-primary-300 animate-pulse" size={32} style={{ animationDuration: '6s' }} />
          <Star className="absolute bottom-[20%] left-[20%] text-primary-400 animate-bounce" size={20} style={{ animationDuration: '5s' }} />
          <Sparkles className="absolute bottom-[40%] left-[5%] text-primary-200 animate-pulse" size={28} style={{ animationDuration: '7s' }} />
        </>
      )}

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--primary-200)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
    </div>
  );
}

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
  const [shareCopied, setShareCopied] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  const { user, isAuthenticated, logout } = useAuth();
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

  // Update OG Meta Tags dynamically for social sharing
  useEffect(() => {
    if (!meta) return;

    const title = `${meta.title} (${questions.length} câu hỏi) - Quick Quiz AI`;
    const topicText = meta.topic ? `Chủ đề: ${meta.topic}. ` : '';
    const description = `Tham gia giải bộ câu hỏi trắc nghiệm "${meta.title}". ${topicText}${questions.length} câu hỏi đang chờ bạn. Thử thách bản thân ngay!`;
    
    // Set document title
    document.title = title;

    // Helper to update meta tags
    const setMetaTag = (attr, value, content) => {
      let tag = document.querySelector(`meta[${attr}="${value}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, value);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // Open Graph meta tags (Facebook, etc.)
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', playLink);
    setMetaTag('property', 'og:type', 'website');
    // We could add og:image if we have a thumbnail for the set
    
    // Twitter Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
  }, [meta, questions.length, playLink]);

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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <DecorativeBackground />
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          <p className="text-primary-600 font-medium animate-pulse">Đang tải câu hỏi...</p>
        </div>
      </div>
    );
  }

  if (error || !meta) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <DecorativeBackground />
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-xl border border-red-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} />
          </div>
          <p className="text-red-600 font-semibold mb-4 text-lg">{error || 'Bộ câu hỏi không tồn tại.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium shadow-md shadow-primary-200"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <DecorativeBackground />
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl border border-neutral-200 max-w-sm">
          <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Frown size={32} />
          </div>
          <p className="text-neutral-600 mb-6 font-medium">Bộ câu hỏi này hiện đang trống.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col relative overflow-hidden">
        <DecorativeBackground />
        
        {/* Navbar Layer */}
        <nav className="bg-white/70 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="flex items-center gap-2 group transition-all">
                <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-200 group-hover:scale-105 group-hover:rotate-3 transition-all">
                  Q
                </div>
                <span className="text-xl font-black tracking-tight text-neutral-800 hidden sm:inline">Quick Quiz AI</span>
              </Link>
              
              <div className="hidden md:flex items-center gap-1">
                <Link
                  to="/explore"
                  className="px-3 py-2 text-sm font-bold text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl flex items-center gap-2 transition-all"
                >
                  <Compass size={18} />
                  <span>Khám phá</span>
                </Link>
                <Link
                  to="/create"
                  className="px-3 py-2 text-sm font-bold text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl flex items-center gap-2 transition-all"
                >
                  <Plus size={18} />
                  <span>Tạo câu hỏi</span>
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAuthenticated && user && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2.5 rounded-2xl hover:bg-neutral-100 p-1.5 transition-all border border-transparent hover:border-neutral-200"
                  >
                    <UserAvatar user={user} size="sm" />
                    <span className="text-sm font-bold text-neutral-700 hidden sm:inline max-w-[120px] truncate">
                      {user.fullName || user.email.split('@')[0]}
                    </span>
                    <ChevronDown size={16} className={`text-neutral-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-56 py-2 bg-white rounded-2xl border border-neutral-200 shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-4 py-3 mb-1 border-b border-neutral-50">
                          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Tài khoản</p>
                          <p className="text-sm font-bold text-neutral-800 truncate">{user.fullName || user.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-neutral-600 hover:text-primary-600 hover:bg-primary-50 transition-all"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <UserIcon size={18} />
                          <span>Hồ sơ cá nhân</span>
                          {user.role === 'VIP' && (
                            <span className="ml-auto text-[8px] bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                              VIP
                            </span>
                          )}
                        </Link>
                        <hr className="border-neutral-100 my-1 mx-2" />
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                            navigate('/login');
                          }}
                          className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all"
                        >
                          <LogOut size={18} />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center p-2 sm:p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-primary-100 p-6 sm:p-8 max-w-sm w-full text-center relative overflow-hidden animate-in zoom-in-95 duration-500">
            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-full -z-0 opacity-40" />
            
            <div className="relative z-10">
              <h2 className="text-xl font-black text-neutral-800 mb-1 leading-tight">{meta?.title}</h2>
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary-100 text-primary-700 rounded-full text-xs font-black mb-6 border border-primary-200">
                <Sparkles size={12} />
                <span className="uppercase tracking-wider">{questions.length} CÂU HỎI</span>
              </div>
              
              <div className="flex justify-center mb-6">
                <div className="p-3 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-primary-50 transform hover:scale-105 transition-all duration-500">
                  <QRCodeSVG value={playLink} size={160} level="H" includeMargin={true} />
                </div>
              </div>
              
              <div className="bg-neutral-50 rounded-[2rem] p-4 mb-6 border border-neutral-100 shadow-inner">
                <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Mã PIN tham gia</p>
                <div className="flex items-center justify-center gap-4">
                  <p className="text-3xl font-black font-mono text-primary-600 tracking-tighter">{normalizedPin}</p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(normalizedPin);
                      setPinCopied(true);
                      setTimeout(() => setPinCopied(false), 1500);
                    }}
                    className={`p-2.5 rounded-2xl transition-all ${pinCopied ? 'text-green-600 bg-green-50 scale-95 shadow-inner' : 'text-neutral-400 hover:text-primary-600 hover:bg-white hover:shadow-md'}`}
                    title="Sao chép mã PIN"
                  >
                    <Copy size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const shareText = `🎯 Thử thách ngay: "${meta?.title}"
📚 Chủ đề: ${meta?.topic || 'Tổng hợp'}
❓ Số câu hỏi: ${questions.length} câu
🔗 Chơi ngay tại: ${playLink}
#QuickQuizAI #Learning #Quiz`;
                      
                      // Copy to clipboard
                      navigator.clipboard.writeText(shareText);
                      setShareCopied(true);
                      setTimeout(() => setShareCopied(false), 2000);

                      // Open Facebook Sharer
                      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(playLink)}`;
                      window.open(shareUrl, '_blank', 'width=600,height=400');
                    }}
                    className="p-2.5 rounded-2xl transition-all text-[#1877F2] hover:bg-white hover:shadow-md relative flex items-center justify-center"
                    title="Chia sẻ lên Facebook và sao chép lời mời"
                  >
                    <Facebook size={22} />
                    {shareCopied && (
                      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                        Đã sao chép nội dung!
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const shareText = `🎯 Thử thách ngay: "${meta?.title}"
📚 Chủ đề: ${meta?.topic || 'Tổng hợp'}
❓ Số câu hỏi: ${questions.length} câu
🔗 Chơi ngay tại: ${playLink}
#QuickQuizAI #Learning #Quiz`;
                      navigator.clipboard.writeText(shareText);
                      setShareCopied(true);
                      setTimeout(() => setShareCopied(false), 2000);
                    }}
                    className={`p-2.5 rounded-2xl transition-all relative flex items-center justify-center ${shareCopied ? 'text-green-600 bg-green-50' : 'text-primary-600 hover:bg-white hover:shadow-md'}`}
                    title="Sao chép nội dung mời tham gia"
                  >
                    <Share2 size={22} />
                    {shareCopied && (
                      <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                        Đã sao chép nội dung!
                      </span>
                    )}
                  </button>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setGameStarted(true)}
                className="w-full py-4 px-8 bg-primary-600 text-white font-black rounded-[1.5rem] hover:bg-primary-700 hover:shadow-2xl hover:shadow-primary-300 transition-all active:scale-[0.97] text-lg uppercase tracking-wider"
              >
                BẮT ĐẦU NGAY
              </button>
              <p className="text-[10px] text-neutral-400 mt-4 italic font-bold">Quét mã QR hoặc nhập PIN để bắt đầu làm bài</p>
            </div>
          </div>
        </div>
        
        {/* Footer for extra polish */}
        <div className="py-4 text-center">
          <p className="text-xs font-bold text-neutral-400">© {new Date().getFullYear()} Quick Quiz AI</p>
        </div>
      </div>
    );
  }

  const finished = index >= questions.length;
  if (finished) {
    const total = questions.length;
    const correct = correctCount;
    const percent = total > 0 ? (correct / total) * 100 : 0;
    const passed = percent >= 50;

    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 relative overflow-hidden">
        <DecorativeBackground />
        {passed ? <ConfettiEffect /> : <SadFacesEffect />}
        <div className="bg-white rounded-3xl shadow-2xl border border-primary-100 p-8 max-w-md w-full text-center relative z-10 overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-2 ${passed ? 'bg-green-500' : 'bg-amber-500'}`} />
          
          <h2 className="text-2xl font-black text-neutral-800 mb-6 uppercase tracking-tight">KẾT QUẢ CỦA BẠN</h2>
          
          <div className="relative inline-block mb-6">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-neutral-100"
              />
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={364.4}
                strokeDashoffset={364.4 - (364.4 * percent) / 100}
                strokeLinecap="round"
                className={`${passed ? 'text-green-500' : 'text-amber-500'} transition-all duration-1000 ease-out`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-neutral-800">{correct}/{total}</span>
              <span className="text-[10px] font-bold text-neutral-500 uppercase">Câu đúng</span>
            </div>
          </div>

          <div className={`mb-8 p-4 rounded-2xl ${passed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'} font-bold`}>
            {passed ? 'Chúc mừng! Bạn đã hoàn thành tốt.' : 'Cố gắng lên! Hãy thử lại nhé.'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold transition-all shadow-md shadow-primary-100"
            >
              Trang chủ
            </button>
            <button
              onClick={handlePlayAgain}
              className="px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-xl hover:bg-primary-50 font-bold transition-all"
            >
              Làm lại
            </button>
            <button
              onClick={() => navigate('/explore')}
              className="sm:col-span-2 px-6 py-3 bg-neutral-800 text-white rounded-xl hover:bg-neutral-900 font-bold transition-all"
            >
              Khám phá thêm bộ câu hỏi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = current;
  const options = q.options?.length ? q.options : (q.correctAnswer ? [{ text: q.correctAnswer, isCorrect: true }] : []);

  return (
    <div className="min-h-screen bg-neutral-50 relative">
      <DecorativeBackground />
      <header className="bg-white/80 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-30 py-3 px-4 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-neutral-400 hover:text-red-500 transition-colors font-bold text-xs uppercase tracking-widest flex items-center gap-1"
          >
            <X size={16} /> Thoát
          </button>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-tighter mb-0.5">Đang làm bài</span>
            <span className="text-sm font-black text-primary-600 truncate max-w-[150px] sm:max-w-none">{meta.title}</span>
          </div>
          <div className="bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
            <span className="text-xs font-black text-primary-700">{index + 1} / {questions.length}</span>
          </div>
        </div>
      </header>
      
      <main className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xl overflow-hidden">
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-neutral-100">
            <div 
              className="h-full bg-primary-500 transition-all duration-300 ease-out"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>

          <div className="p-6 sm:p-10">
            <div className="flex items-start justify-between gap-4 mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-800 leading-tight">{q.content}</h2>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isAuthenticated && (
                  <>
                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      disabled={favoritesLoading}
                      className={`p-2.5 rounded-xl transition-all shadow-sm ${
                        isFavorite
                          ? 'bg-rose-50 text-rose-500 border border-rose-100'
                          : 'bg-neutral-50 text-neutral-400 border border-neutral-100 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100'
                      }`}
                      title={isFavorite ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
                    >
                      <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenBookmarkModal}
                      className="p-2.5 bg-neutral-50 text-neutral-400 border border-neutral-100 hover:text-primary-600 hover:bg-primary-50 hover:border-primary-100 rounded-xl transition-all shadow-sm"
                      title="Lưu vào bộ sưu tập"
                    >
                      <Bookmark size={20} />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={openReportModal}
                  className="p-2.5 bg-neutral-50 text-neutral-400 border border-neutral-100 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-100 rounded-xl transition-all shadow-sm"
                  title="Báo cáo câu hỏi"
                >
                  <Flag size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {options.map((opt, i) => {
                const isChosen = selected === opt.text;
                const showRight = submitted && opt.isCorrect;
                const showWrong = submitted && isChosen && !opt.isCorrect;
                
                // Color variants for options
                const colors = [
                  'border-blue-200 bg-blue-50/30 text-blue-900 hover:bg-blue-50',
                  'border-purple-200 bg-purple-50/30 text-purple-900 hover:bg-purple-50',
                  'border-amber-200 bg-amber-50/30 text-amber-900 hover:bg-amber-50',
                  'border-emerald-200 bg-emerald-50/30 text-emerald-900 hover:bg-emerald-50'
                ];
                const baseColor = colors[i % colors.length];

                return (
                  <button
                    key={opt.text}
                    type="button"
                    disabled={submitted}
                    onClick={() => !submitted && setSelected(opt.text)}
                    className={`group relative w-full text-left px-6 py-4 rounded-2xl border-2 transition-all duration-200 ${
                      showRight ? 'border-green-500 bg-green-50 text-green-800 shadow-md shadow-green-100 ring-2 ring-green-200' :
                      showWrong ? 'border-red-500 bg-red-50 text-red-800 shadow-md shadow-red-100' :
                      isChosen ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200 shadow-md' : 
                      `border-transparent bg-neutral-50 hover:border-neutral-200 hover:bg-neutral-100/50`
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-colors ${
                        showRight ? 'bg-green-500 text-white' :
                        showWrong ? 'bg-red-500 text-white' :
                        isChosen ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-500 group-hover:bg-neutral-300'
                      }`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="font-semibold text-lg">{opt.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {q.explanation && submitted && (
              <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-5 bg-primary-50 rounded-2xl border border-primary-100 flex gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 text-primary-600">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary-800 text-sm uppercase tracking-wider mb-1">Giải thích</h4>
                    <p className="text-primary-900/80 leading-relaxed">{q.explanation}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-10 flex justify-end">
              {!submitted ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={selected === null}
                  className="group px-8 py-4 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 disabled:opacity-50 disabled:grayscale transition-all font-bold text-lg shadow-lg shadow-primary-200 active:scale-95 flex items-center gap-2"
                >
                  XÁC NHẬN
                </button>
              ) : isLast ? (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-8 py-4 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-bold text-lg shadow-lg shadow-primary-200 active:scale-95"
                >
                  XEM KẾT QUẢ
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-8 py-4 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all font-bold text-lg shadow-lg shadow-primary-200 active:scale-95 flex items-center gap-2"
                >
                  CÂU TIẾP THEO
                </button>
              )}
            </div>
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
