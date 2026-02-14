import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicApi, QuestionSetMeta } from '../services/api';
import { Bookmark, Copy, Play, Loader2, Search, Filter } from 'lucide-react';

interface FilterState {
  type: string;
  search: string;
}

const ExploreSetsPage: React.FC = () => {
  const navigate = useNavigate();
  const [sets, setSets] = useState<QuestionSetMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>({ type: '', search: '' });
  const [offset, setOffset] = useState(0);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const limit = 12;

  const categories = [
    { value: '', label: 'Tất cả thể loại' },
    { value: 'Technical', label: 'Technical' },
    { value: 'Academic', label: 'Academic' },
    { value: 'Geography', label: 'Geography' },
    { value: 'Business', label: 'Business' },
    { value: 'Other', label: 'Other' },
  ];

  const load = async (resetOffset = false) => {
    const off = resetOffset ? 0 : offset;
    setLoading(true);
    setError('');
    try {
      const res = await publicApi.listSets({
        q: filters.search || undefined,
        type: filters.type || undefined,
        limit,
        offset: off,
      });
      if (resetOffset) {
        setSets(res.data);
        setOffset(0);
      } else {
        setSets((prev) => [...prev, ...res.data]);
        setOffset(off);
      }
      setTotal(res.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải danh sách bộ đề');
      if (resetOffset) setSets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(true);
  };

  const handleLoadMore = () => {
    const nextOffset = offset + limit;
    setOffset(nextOffset);
    publicApi
      .listSets({
        q: filters.search || undefined,
        type: filters.type || undefined,
        limit,
        offset: nextOffset,
      })
      .then((res) => {
        setSets((prev) => [...prev, ...res.data]);
      })
      .catch(() => setError('Lỗi tải thêm'));
  };

  const copyPin = (pin: string | null) => {
    if (!pin) return;
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2000);
  };

  const playSet = (set: QuestionSetMeta) => {
    if (set.pin) {
      navigate(`/play/${set.pin}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">🎯 Khám phá bộ đề</h1>
          <p className="text-slate-600">
            Tìm và chơi các bộ đề được xác nhận bởi admin
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Search className="inline w-4 h-4 mr-2" />
                  Tìm kiếm bộ đề
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Nhập tên hoặc mô tả bộ đề..."
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
              <div className="sm:w-48">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Filter className="inline w-4 h-4 mr-2" />
                  Thể loại
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Tìm kiếm
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilters({ type: '', search: '' });
                }}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
              >
                Làm mới
              </button>
            </div>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && sets.length === 0 ? (
          <div className="flex justify-center items-center py-24">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Đang tải bộ đề...</p>
            </div>
          </div>
        ) : sets.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-12 text-center">
            <Bookmark className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <p className="text-slate-600 text-lg">Không tìm thấy bộ đề phù hợp</p>
            <p className="text-slate-500 mt-2">
              Hãy thử tìm kiếm hoặc thay đổi bộ lọc
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6">
              <p className="text-sm text-slate-600">
                Đang hiển thị {sets.length} trên {total} bộ đề
              </p>
            </div>

            {/* Sets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {sets.map((set) => (
                <div
                  key={set.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col"
                >
                  {/* Card Header */}
                  <div className="p-6 pb-4 flex-1">
                    {/* Type Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                        {set.type || 'Other'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {set.count} câu
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                      {set.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {set.description || 'Không có mô tả'}
                    </p>

                    {/* PIN Info */}
                    {set.pin && (
                      <div className="bg-slate-50 rounded-lg p-3 mb-4">
                        <p className="text-xs text-slate-600 mb-1">Mã PIN:</p>
                        <p className="font-mono text-sm font-bold text-slate-900">
                          {set.pin}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer - Actions */}
                  <div className="border-t border-slate-100 p-4 flex gap-2">
                    <button
                      onClick={() => playSet(set)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                      <Play className="w-4 h-4" />
                      Chơi
                    </button>
                    {set.pin && (
                      <button
                        onClick={() => copyPin(set.pin)}
                        className={`px-4 py-2 rounded-lg border transition font-medium flex items-center gap-2 ${
                          copiedPin === set.pin
                            ? 'bg-green-50 border-green-300 text-green-700'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                        title="Copy mã PIN"
                      >
                        <Copy className="w-4 h-4" />
                        {copiedPin === set.pin ? 'Đã copy!' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {sets.length < total && (
              <div className="flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-8 py-3 text-indigo-600 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang tải...
                    </>
                  ) : (
                    'Xem thêm'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExploreSetsPage;
