import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

const ProfilePage: React.FC = () => {
  const { user, login } = useAuth();
  const [username, setUsername] = useState(user?.fullName ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setMessage({ type: 'error', text: 'Phiên đăng nhập hết hạn. Vui lòng đăng xuất và đăng nhập lại.' });
      return;
    }
    setSaving(true);
    try {
      const res = await authService.updateProfile(token, { username: username.trim() });
      if (res.success && res.data) {
        login(res.data, token);
        setMessage({ type: 'success', text: 'Đã cập nhật thông tin.' });
      } else {
        setMessage({ type: 'error', text: res.error || 'Cập nhật thất bại.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Không thể kết nối server.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Hồ sơ cá nhân</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <p className="text-slate-600">{user.email}</p>
          <p className="text-xs text-slate-400 mt-0.5">Email không thể thay đổi.</p>
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">Tên hiển thị</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Tên của bạn"
          />
        </div>
        {message && (
          <p className={message.type === 'success' ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
