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
  const limit = 12;

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
                {s.pin ? <p className="text-xs text-indigo-600 mt-1">PIN: {s.pin}</p> : <p className="text-xs text-slate-400 mt-1">Chưa có mã PIN</p>}
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
