import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicApi, QuestionSetMeta } from '../services/api';

const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
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
    load(true);
  }, [q, type]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(true);
  };

  const handleLoadMore = () => {
    const nextOffset = offset + limit;
    setOffset(nextOffset);
    publicApi.listSets({ q: q || undefined, type: type || undefined, limit, offset: nextOffset }).then((res) => {
      setSets((prev) => [...prev, ...res.data]);
    }).catch(() => setError('Lỗi tải thêm'));
  };

  const goPlay = (setItem: QuestionSetMeta) => {
    if (!setItem.pin) return;
    navigate(`/play/${encodeURIComponent(setItem.pin)}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Khám phá bộ câu hỏi</h1>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên hoặc mô tả..."
          className="flex-1 min-w-0 px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 sm:w-40"
        >
          <option value="">Tất cả thể loại</option>
          <option value="Technical">Technical</option>
          <option value="Academic">Academic</option>
          <option value="Geography">Geography</option>
          <option value="Business">Business</option>
          <option value="Other">Other</option>
        </select>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Tìm kiếm
        </button>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={loading}
          className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Làm mới
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && sets.length === 0 ? (
        <div className="text-slate-500 py-12 text-center">Đang tải...</div>
      ) : sets.length === 0 ? (
        <div className="text-slate-500 py-12 text-center">Chưa có bộ câu hỏi nào phù hợp.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sets.map((s) => (
              <div
                key={s.id}
                className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm transition-all ${s.pin ? 'hover:border-indigo-200 hover:shadow cursor-pointer' : 'opacity-75'}`}
                onClick={() => s.pin && goPlay(s)}
              >
                <h3 className="font-semibold text-slate-800 mb-1 truncate">{s.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-2">{s.description || '—'}</p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{s.type || 'Other'}</span>
                  <span>{s.count} câu</span>
                </div>
                <div className="flex items-center justify-between mt-2 gap-2">
                  {s.pin ? (
                    <>
                      <p className="text-xs text-indigo-600">PIN: {s.pin}</p>
                      <button
                        type="button"
                        onClick={(e) => copyPin(e, s.pin!)}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200"
                        title="Sao chép PIN"
                      >
                        {copiedPin === s.pin ? (
                          'Đã sao chép'
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Sao chép PIN
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">Chưa có mã PIN</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {sets.length < total && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50"
              >
                {loading ? 'Đang tải...' : 'Xem thêm'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExplorePage;
