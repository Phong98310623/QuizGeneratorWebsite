import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { publicApi } from '../services/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
