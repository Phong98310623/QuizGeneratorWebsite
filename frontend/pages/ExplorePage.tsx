import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, RefreshCw, Copy, Check, Play, BookOpen, Layers, ChevronDown, X } from 'lucide-react';
import { publicApi, QuestionSetMeta } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isVip = user?.role === 'VIP';
  const [sets, setSets] = useState<QuestionSetMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [offset, setOffset] = useState(0);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const limit = 12;

  const copyPin = (e: React.MouseEvent, pin: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pin).then(() => {
      setCopiedPin(pin);
      setTimeout(() => setCopiedPin(null), 2000);
    });
  };

  const load = async (resetOffset = false) => {
    const off = resetOffset ? 0 : offset;
    setLoading(true);
    setError('');
    try {
      const res = await publicApi.listSets({ q: q || undefined, type: type || undefined, limit, offset: off });
      setSets(res.data);
      setTotal(res.total);
      if (resetOffset) setOffset(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải danh sách');
      setSets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [q, type]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(true);
  };

  const handleLoadMore = () => {
    const nextOffset = offset + limit;
    setOffset(nextOffset);
    publicApi.listSets({ q: q || undefined, type: type || undefined, limit, offset: nextOffset }).then((res) => {
      setSets((prev) => {
        const existingIds = new Set(prev.map(s => s.id));
        const newItems = res.data.filter(item => !existingIds.has(item.id));
        return [...prev, ...newItems];
      });
    }).catch(() => setError('Lỗi tải thêm'));
  };

  const goPlay = (setItem: QuestionSetMeta) => {
    if (!setItem.pin) return;
    navigate(`/play/${encodeURIComponent(setItem.pin)}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-100">
                  <Search size={20} />
                </div>
                Khám phá bộ câu hỏi
              </h1>
              <p className="text-neutral-500 mt-2 font-medium">Tìm kiếm và thử sức với hàng ngàn bộ đề thi chất lượng</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-primary-50 px-4 py-2 rounded-2xl border border-primary-100">
                <span className="text-sm font-bold text-primary-700">{total.toLocaleString()} bộ đề</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors" size={20} />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên hoặc mô tả bộ đề..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-neutral-200 bg-white focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all font-medium"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="relative md:w-48 group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors" size={18} />
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full pl-12 pr-10 py-4 rounded-2xl border border-neutral-200 bg-white focus:ring-4 focus:ring-primary-100 focus:border-primary-400 transition-all font-medium appearance-none"
              >
                <option value="">Tất cả thể loại</option>
                <option value="Technical">Kỹ thuật / Công nghệ</option>
                <option value="Academic">Học thuật / Giáo dục</option>
                <option value="Geography">Địa lý / Lịch sử</option>
                <option value="Business">Kinh doanh / Tài chính</option>
                <option value="Other">Khác</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={18} />
            </div>

            <button
              type="button"
              onClick={() => load(true)}
              disabled={loading}
              className="p-4 bg-white border border-neutral-200 rounded-2xl text-neutral-500 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 transition-all disabled:opacity-50 shadow-sm"
              title="Làm mới"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl mb-8 flex items-center gap-3 font-medium">
            <X size={20} /> {error}
          </div>
        )}

        {loading && sets.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-neutral-100 p-6 h-60 animate-pulse shadow-sm">
                <div className="w-2/3 h-6 bg-neutral-100 rounded-lg mb-4" />
                <div className="w-full h-12 bg-neutral-50 rounded-lg mb-6" />
                <div className="flex justify-between">
                  <div className="w-16 h-4 bg-neutral-100 rounded" />
                  <div className="w-12 h-4 bg-neutral-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : sets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-neutral-200 shadow-sm">
            <div className="w-20 h-20 bg-neutral-50 text-neutral-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-bold text-neutral-800 mb-2">Không tìm thấy bộ đề</h3>
            <p className="text-neutral-500 max-w-xs mx-auto">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem nhiều hơn.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sets.map((s) => (
                <div
                  key={s.id}
                  className={`group relative bg-white rounded-3xl border-2 border-transparent p-6 shadow-xl shadow-neutral-200/50 transition-all duration-300 ${s.pin ? 'hover:border-primary-500 hover:-translate-y-2 cursor-pointer' : 'opacity-75 cursor-not-allowed'}`}
                  onClick={() => s.pin && goPlay(s)}
                >
                  {/* Category Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-primary-100">
                      {s.type === 'Technical' ? 'KỸ THUẬT' : s.type === 'Academic' ? 'HỌC THUẬT' : s.type === 'Geography' ? 'ĐỊA LÝ' : s.type === 'Business' ? 'KINH DOANH' : 'KHÁC'}
                    </span>
                    <div className="flex items-center gap-1 text-neutral-400 font-bold text-[10px]">
                      <Layers size={12} /> {s.count} CÂU
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-neutral-800 mb-2 line-clamp-2 leading-tight group-hover:text-primary-600 transition-colors">
                    {s.title}
                  </h3>
                  
                  <p className="text-sm text-neutral-500 line-clamp-2 mb-6 font-medium leading-relaxed">
                    {s.description || 'Chưa có mô tả cho bộ câu hỏi này.'}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-neutral-50">
                    {s.pin ? (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter mb-0.5">Mã PIN tham gia</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black font-mono text-primary-600">{s.pin}</span>
                          <button
                            type="button"
                            onClick={(e) => copyPin(e, s.pin!)}
                            className={`p-1 rounded-lg transition-all ${copiedPin === s.pin ? 'text-green-500 bg-green-50' : 'text-neutral-300 hover:text-primary-500 hover:bg-primary-50'}`}
                          >
                            {copiedPin === s.pin ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-neutral-300 uppercase">Hết hạn</span>
                    )}

                    {s.pin && (
                      <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                        <Play size={18} fill="currentColor" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {sets.length < total && (
              <div className="mt-16 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-10 py-4 bg-white border-2 border-primary-600 text-primary-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-50 transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-primary-50"
                >
                  {loading ? 'Đang tải...' : 'Xem thêm bộ đề'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;
