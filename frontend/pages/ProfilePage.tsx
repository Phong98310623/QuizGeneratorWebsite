import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, attemptsApi, AttemptHistoryItem } from '../services/api';
import { stringToSafeColor } from '../utils/avatar';

const MAX_AVATAR_BYTES = 450000;

const resizeImageToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const max = 200;
      let w = img.width;
      let h = img.height;
      if (w > max || h > max) {
        if (w > h) {
          h = (h * max) / w;
          w = max;
        } else {
          w = (w * max) / h;
          h = max;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      let quality = 0.85;
      const tryExport = () => {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length > MAX_AVATAR_BYTES && quality > 0.3) {
          quality -= 0.15;
          tryExport();
        } else {
          resolve(dataUrl);
        }
      };
      tryExport();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không đọc được ảnh'));
    };
    img.src = url;
  });
};

const ProfilePage: React.FC = () => {
  const { user, login } = useAuth();
  const [username, setUsername] = useState(user?.fullName ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [history, setHistory] = useState<AttemptHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setHistoryLoading(false);
      return;
    }
    attemptsApi.getMyHistory(token).then((data) => {
      setHistory(data);
    }).catch(() => setHistory([])).finally(() => setHistoryLoading(false));
  }, []);

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) {
      setAvatarMessage({ type: 'error', text: 'Vui lòng chọn file ảnh (JPG, PNG, ...).' });
      return;
    }
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setAvatarMessage({ type: 'error', text: 'Phiên đăng nhập hết hạn.' });
      return;
    }
    setAvatarMessage(null);
    setAvatarSaving(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      const res = await authService.updateProfile(token, { avatar: dataUrl });
      if (res.success && res.data) {
        login(res.data, token);
        setAvatarMessage({ type: 'success', text: 'Đã cập nhật avatar.' });
      } else {
        setAvatarMessage({ type: 'error', text: res.error || 'Cập nhật thất bại.' });
      }
    } catch (err) {
      setAvatarMessage({ type: 'error', text: err instanceof Error ? err.message : 'Lỗi xử lý ảnh.' });
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setAvatarMessage(null);
    setAvatarSaving(true);
    try {
      const res = await authService.updateProfile(token, { avatar: null });
      if (res.success && res.data) {
        login(res.data, token);
        setAvatarMessage({ type: 'success', text: 'Đã xóa avatar.' });
      }
    } catch {
      setAvatarMessage({ type: 'error', text: 'Không thể xóa avatar.' });
    } finally {
      setAvatarSaving(false);
    }
  };

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
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setPasswordMessage({ type: 'error', text: 'Phiên đăng nhập hết hạn. Vui lòng đăng xuất và đăng nhập lại.' });
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await authService.changePassword(token, {
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

  const initialLetter = (user.fullName || user.email).charAt(0).toUpperCase();

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Quay lại Trang chủ
      </Link>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Hồ sơ cá nhân</h1>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Avatar</h2>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-20 h-20 rounded-full object-cover border border-slate-200" />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold text-white"
                style={{ backgroundColor: stringToSafeColor(user.email) }}
              >
                {initialLetter}
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              disabled={avatarSaving}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {avatarSaving ? 'Đang tải...' : 'Đổi avatar'}
            </button>
            {user.avatar && (
              <button
                type="button"
                disabled={avatarSaving}
                onClick={handleRemoveAvatar}
                className="ml-2 px-4 py-2 text-slate-600 border border-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Xóa avatar
              </button>
            )}
            {avatarMessage && (
              <p className={`mt-2 text-sm ${avatarMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {avatarMessage.text}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1">Nếu chưa đặt avatar, mặc định hiển thị chữ cái đầu email.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 mb-8">
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Hoạt động gần đây</h2>
        {historyLoading ? (
          <p className="text-slate-500 text-sm">Đang tải...</p>
        ) : history.length === 0 ? (
          <p className="text-slate-500 text-sm">Các bộ câu hỏi bạn đã làm sẽ hiển thị ở đây.</p>
        ) : (
          <ul className="space-y-4">
            {history.map((item) => (
              <li key={item.attemptId} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between gap-3 p-4 bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 truncate">{item.setTitle}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.correctCount}/{item.totalCount} câu đúng · {new Date(item.completedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <Link
                    to={`/play/${encodeURIComponent(item.pin)}`}
                    className="shrink-0 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  >
                    Làm lại
                  </Link>
                </div>
                <div className="border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setExpandedAttemptId((id) => (id === item.attemptId ? null : item.attemptId))}
                    className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center justify-between"
                  >
                    Xem chi tiết từng câu
                    <svg className={`w-4 h-4 transition-transform ${expandedAttemptId === item.attemptId ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedAttemptId === item.attemptId && item.details.length > 0 && (
                    <ul className="px-4 pb-4 space-y-2">
                      {item.details.map((d, i) => (
                        <li key={d.questionId} className="text-sm p-3 rounded-lg border border-slate-100 bg-white">
                          <p className="font-medium text-slate-800 mb-1">{d.content}</p>
                          <p className="text-slate-600">
                            Bạn chọn: <span className={d.isCorrect ? 'text-green-600 font-medium' : 'text-red-600'}>{d.userAnswer || '—'}</span>
                            {!d.isCorrect && d.correctAnswer && (
                              <span className="block mt-0.5 text-slate-500">Đáp án đúng: {d.correctAnswer}</span>
                            )}
                          </p>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium mt-1 ${d.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            {d.isCorrect ? '✓ Đúng' : '✗ Sai'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
