import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AIQuestionGenerator from '../components/AIQuestionGenerator';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-10 backdrop-blur-md bg-slate-900/90">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-300/40">
              A
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-50">Admin Panel</h1>
              <p className="text-xs text-slate-400">Quản lý hệ thống Quick Quiz AI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-300 hidden sm:inline">
              {user.fullName || user.email} {user.role ? `(${user.role})` : ''}
            </span>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-200 border border-slate-600/70 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Về trang người dùng
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-red-100 bg-red-600/90 hover:bg-red-500 rounded-lg shadow-sm shadow-red-500/30 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Tổng quan quản trị</h2>
          <p className="text-sm text-slate-500 mb-4">
            Đây là khu vực dành cho ADMIN để kiểm tra và quản lý hệ thống. (Bạn có thể mở rộng thêm các bảng quản lý User, thống kê, v.v.)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-slate-500 mb-1">Tài khoản</p>
              <p className="font-semibold text-slate-800">{user.email}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-slate-500 mb-1">Vai trò</p>
              <p className="font-semibold text-emerald-600">{user.role || 'USER'}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-slate-500 mb-1">Trạng thái</p>
              <p className="font-semibold text-slate-800">{user.status || 'ACTIVE'}</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Tạo đề nhanh (ADMIN)</h2>
          <p className="text-sm text-slate-500 mb-4">
            Admin vẫn có thể sử dụng AI Question Generator như người dùng, nhưng ở khu vực URI riêng: <code>/admin/dashboard</code>.
          </p>
          <AIQuestionGenerator />
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;

