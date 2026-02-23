import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Search, PlusCircle, BookOpen, HelpCircle, ChevronDown, ArrowRight, Zap } from 'lucide-react';
import { publicApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isVip = user?.role === 'VIP';
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalSets, setTotalSets] = useState<number | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    publicApi.listSets({ limit: 1, offset: 0 }).then((res) => setTotalSets(res.total)).catch(() => setTotalSets(null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = pin.trim().toUpperCase();
    if (!trimmed) {
      setError('Vui lòng nhập mã PIN.');
      return;
    }
    setLoading(true);
    try {
      await publicApi.getSetByPin(trimmed);
      navigate(`/play/${encodeURIComponent(trimmed)}`);
    } catch {
      setError('Mã PIN không đúng hoặc bộ câu hỏi không tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Hero Header Section */}
      <div className="relative overflow-hidden bg-white border-b border-neutral-200">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[100%] rounded-full blur-[100px] bg-primary-200 animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[100%] rounded-full blur-[100px] bg-primary-100 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
          {isVip && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 text-primary-700 rounded-full border border-primary-100 shadow-sm mb-6 animate-bounce">
              <Zap size={14} className="fill-current" />
              <span className="text-xs font-black uppercase tracking-widest">Tài khoản VIP PRO</span>
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl font-black text-neutral-900 mb-4 tracking-tight">
            Sẵn sàng <span className="text-primary-600">khám phá</span> kiến thức?
          </h1>
          <p className="text-neutral-500 text-lg max-w-xl mx-auto mb-10 leading-relaxed font-medium">
            Nhập mã PIN để tham gia thử thách hoặc tạo bộ câu hỏi của riêng bạn chỉ trong vài giây.
          </p>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto relative group">
            <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white rounded-2xl shadow-2xl border border-neutral-200 group-focus-within:border-primary-400 group-focus-within:ring-4 group-focus-within:ring-primary-100 transition-all">
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                placeholder="Nhập mã PIN (ví dụ: ABC123)"
                className="flex-1 px-4 py-3 text-lg font-bold rounded-xl border-none focus:ring-0 placeholder:text-neutral-300"
                maxLength={12}
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-200 active:scale-95"
              >
                {loading ? '...' : (
                  <>
                    VÀO LÀM BÀI <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
            {error && (
              <div className="absolute -bottom-8 left-0 w-full animate-in fade-in slide-in-from-top-2">
                <p className="text-sm text-red-600 font-bold">{error}</p>
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            to="/explore"
            className="group relative block p-8 bg-white rounded-3xl border border-neutral-200 shadow-xl hover:border-primary-300 hover:shadow-2xl hover:shadow-primary-100 transition-all overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-full -z-0 translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-600 group-hover:text-white transition-colors shadow-inner">
                <Search size={28} />
              </div>
              <h2 className="text-xl font-bold text-neutral-800 mb-2">Khám phá bộ câu hỏi</h2>
              <p className="text-neutral-500 text-sm font-medium leading-relaxed">
                Hàng ngàn bộ câu hỏi chất lượng từ cộng đồng đang chờ bạn chinh phục.
              </p>
              <div className="mt-6 flex items-center gap-2 text-primary-600 font-bold text-sm">
                XEM NGAY <ArrowRight size={14} />
              </div>
            </div>
          </Link>

          <Link
            to="/create"
            className="group relative block p-8 bg-white rounded-3xl border border-neutral-200 shadow-xl hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-100 transition-all overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-inner">
                <Sparkles size={28} />
              </div>
              <h2 className="text-xl font-bold text-neutral-800 mb-2">Tạo bằng AI</h2>
              <p className="text-neutral-500 text-sm font-medium leading-relaxed">
                Dùng trí tuệ nhân tạo để tạo bộ câu hỏi từ văn bản hoặc chủ đề bất kỳ.
              </p>
              <div className="mt-6 flex items-center gap-2 text-emerald-600 font-bold text-sm">
                TẠO NGAY <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        </div>

        {totalSets !== null && (
          <div className="mt-12 text-center animate-in fade-in duration-1000">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-2xl border border-neutral-200 shadow-sm text-neutral-500 font-medium text-sm">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-primary-${i}00 flex items-center justify-center text-[10px] text-white font-black`}>VIP</div>
                ))}
              </div>
              <span>Đã có <strong className="text-neutral-800">{totalSets.toLocaleString()}</strong> bộ câu hỏi được tạo</span>
            </div>
          </div>
        )}

        <div className="mt-12 bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setGuideOpen((o) => !o)}
            className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors hover:bg-neutral-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-100 text-neutral-500 rounded-xl flex items-center justify-center">
                <HelpCircle size={20} />
              </div>
              <span className="font-bold text-neutral-700">Hướng dẫn nhanh</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform duration-300 ${guideOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ${guideOpen ? 'max-h-96' : 'max-h-0'}`}>
            <div className="px-6 pb-6 pt-2 text-sm text-neutral-500 leading-relaxed border-t border-neutral-50">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">1</div>
                  <p>Nhập mã PIN từ người tạo đề để vào phòng thi nhanh nhất.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">2</div>
                  <p>Dùng tính năng <Link to="/explore" className="text-primary-600 font-bold hover:underline">Khám phá</Link> để tự luyện tập với các đề thi có sẵn theo chủ đề.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">3</div>
                  <p>Sử dụng <Link to="/create" className="text-primary-600 font-bold hover:underline">AI Tạo đề</Link> để tiết kiệm thời gian ra đề. Chỉ cần nhập chủ đề, AI sẽ lo phần còn lại.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
