import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { publicApi } from '../services/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Vào bộ câu hỏi</h1>
        <p className="text-slate-500">Nhập mã PIN do giáo viên hoặc người tạo đề cung cấp</p>
        {totalSets !== null && (
          <p className="text-sm text-slate-500 mt-2">
            Đã có <strong className="text-slate-700">{totalSets}</strong> bộ câu hỏi
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 justify-center mb-6">
        <Link
          to="/explore"
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
        >
          Khám phá bộ câu hỏi
        </Link>
        <Link
          to="/create"
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Tạo câu hỏi mới
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="mb-10">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value.toUpperCase())}
            placeholder="Nhập mã PIN (ví dụ: ABC123)"
            className="flex-1 min-w-0 px-4 py-4 text-lg rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            maxLength={12}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Đang kiểm tra...' : 'Vào bộ câu hỏi'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>

      <div className="mb-8">
        <button
          type="button"
          onClick={() => setGuideOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 rounded-xl text-left text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Hướng dẫn nhanh
          <svg className={`w-5 h-5 text-slate-500 transition-transform ${guideOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {guideOpen && (
          <div className="mt-2 px-4 py-3 bg-white rounded-xl border border-slate-200 text-sm text-slate-600">
            Nhập mã PIN từ giáo viên hoặc người tạo đề để vào làm bài. Hoặc dùng <Link to="/explore" className="text-indigo-600 hover:underline">Khám phá</Link> để xem các bộ câu hỏi có sẵn, và <Link to="/create" className="text-indigo-600 hover:underline">Tạo câu hỏi mới</Link> để dùng AI tạo bộ câu hỏi theo chủ đề.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/explore"
          className="block p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow transition-all"
        >
          <h2 className="font-semibold text-slate-800 mb-1">Khám phá bộ câu hỏi</h2>
          <p className="text-sm text-slate-500">Xem và làm các bộ câu hỏi đã được xác minh</p>
        </Link>
        <Link
          to="/create"
          className="block p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow transition-all"
        >
          <h2 className="font-semibold text-slate-800 mb-1">Tạo câu hỏi mới</h2>
          <p className="text-sm text-slate-500">Dùng AI để tạo bộ câu hỏi theo chủ đề</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
