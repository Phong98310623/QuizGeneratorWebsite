import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-200">
                Q
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-800">Quick Quiz AI</span>
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              <Link
                to="/dashboard"
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg"
              >
                Trang chủ
              </Link>
              <Link
                to="/explore"
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg"
              >
                Khám phá
              </Link>
              <Link
                to="/create"
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg"
              >
                Tạo câu hỏi
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="text-sm text-slate-500 hidden sm:inline truncate max-w-[120px] hover:text-indigo-600 hover:underline"
            >
              {user.email}
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default UserLayout;
