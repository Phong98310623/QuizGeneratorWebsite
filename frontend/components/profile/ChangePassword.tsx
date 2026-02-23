import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';

const ChangePassword: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới và xác nhận không trùng.' });
      return;
    }
    if (!isAuthenticated) {
      setPasswordMessage({ type: 'error', text: 'Phiên đăng nhập hết hạn. Vui lòng đăng xuất và đăng nhập lại.' });
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await authService.changePassword(null as any, {
        currentPassword,
        newPassword,
      });
      if (res.success) {
        setPasswordMessage({ type: 'success', text: 'Đã đổi mật khẩu thành công.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: res.error || 'Đổi mật khẩu thất bại.' });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Không thể kết nối server.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Đổi mật khẩu</h2>
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu hiện tại</label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Nhập mật khẩu hiện tại"
            required
          />
        </div>
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới</label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ít nhất 6 ký tự"
            minLength={6}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>
        {passwordMessage && (
          <p className={passwordMessage.type === 'success' ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
            {passwordMessage.text}
          </p>
        )}
        <button
          type="submit"
          disabled={passwordSaving}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {passwordSaving ? 'Đang đổi...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
