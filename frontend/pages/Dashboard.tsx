
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-indigo-600">SecureAuth Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-indigo-600 h-32 px-8 flex items-end">
            <div className="transform translate-y-8 bg-white p-2 rounded-full shadow-lg">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-3xl font-bold uppercase">
                {user.fullName.charAt(0)}
              </div>
            </div>
          </div>
          <div className="pt-12 pb-8 px-8">
            <h2 className="text-2xl font-bold text-gray-900">{user.fullName}</h2>
            <p className="text-gray-500">{user.email}</p>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wider">ID Người dùng</h3>
                <p className="mt-2 text-xl font-mono text-blue-900">{user.id}</p>
              </div>
              <div className="p-6 bg-green-50 rounded-xl border border-green-100">
                <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wider">Ngày tham gia</h3>
                <p className="mt-2 text-xl text-green-900">
                  {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div className="p-6 bg-purple-50 rounded-xl border border-purple-100">
                <h3 className="text-sm font-semibold text-purple-800 uppercase tracking-wider">Trạng thái</h3>
                <p className="mt-2 text-xl text-purple-900">Đang hoạt động</p>
              </div>
            </div>

            <div className="mt-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ghi chú cho lập trình viên</h3>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <p className="text-sm text-yellow-700">
                  Phần Backend Node.js Express của bạn nên xử lý: 
                  <br/>1. Hash mật khẩu (bcrypt) trước khi lưu.
                  <br/>2. Tạo JWT Token thực tế.
                  <br/>3. Middleware kiểm tra Token cho các router bảo mật.
                  <br/>4. Kết nối Database (MongoDB/PostgreSQL).
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
