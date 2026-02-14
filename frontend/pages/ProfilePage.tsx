import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService, attemptsApi, userFavoritesApi, AttemptHistoryItem, SavedQuestionDetail, SavedCollectionWithQuestions } from '../services/api';
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
  const { user, login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState(user?.fullName ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarDeleteConfirm, setAvatarDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [history, setHistory] = useState<AttemptHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);
  const [favoriteQuestions, setFavoriteQuestions] = useState<SavedQuestionDetail[]>([]);
  const [savedCollectionsWithQuestions, setSavedCollectionsWithQuestions] = useState<SavedCollectionWithQuestions[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [expandedCollectionId, setExpandedCollectionId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ nameid: string; name: string; questionId: string; questionContent: string } | null>(null);
  const [favoriteDeleteConfirm, setFavoriteDeleteConfirm] = useState<{ questionId: string; questionContent: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<SavedQuestionDetail | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setHistoryLoading(false);
      return;
    }
    attemptsApi.getMyHistory(null as any).then((data) => {
      setHistory(data);
    }).catch(() => setHistory([])).finally(() => setHistoryLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setFavoritesLoading(false);
      return;
    }
    userFavoritesApi.getWithDetails(null as any).then((data) => {
      setFavoriteQuestions(data.favoriteQuestions || []);
      setSavedCollectionsWithQuestions(data.savedCollectionsWithQuestions || []);
    }).catch(() => {}).finally(() => setFavoritesLoading(false));
  }, [isAuthenticated]);

  const handleRemoveFromFavorite = async () => {
    if (!favoriteDeleteConfirm) return;
    if (!isAuthenticated) return;
    setDeleteLoading(true);
    try {
      await userFavoritesApi.toggleFavorite(null as any, favoriteDeleteConfirm.questionId);
      setFavoriteQuestions((prev) => prev.filter((q) => q.id !== favoriteDeleteConfirm.questionId));
      setFavoriteDeleteConfirm(null);
    } catch {
      // ignore
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRemoveFromCollection = async () => {
    if (!deleteConfirm) return;
    if (!isAuthenticated) return;
    setDeleteLoading(true);
    try {
      await userFavoritesApi.removeFromCollection(null as any, deleteConfirm.nameid, deleteConfirm.questionId);
      setSavedCollectionsWithQuestions((prev) =>
        prev.map((col) =>
          col.nameid === deleteConfirm.nameid
            ? { ...col, questions: col.questions.filter((q) => q.id !== deleteConfirm.questionId) }
            : col
        )
      );
      setDeleteConfirm(null);
    } catch {
      // ignore
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!isAuthenticated) {
      setMessage({ type: 'error', text: 'Phiên đăng nhập hết hạn. Vui lòng đăng xuất và đăng nhập lại.' });
      return;
    }
    setSaving(true);
    try {
      const res = await authService.updateProfile(null as any, { username: username.trim() });
      if (res.success && res.data) {
        login(res.data);
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
    if (!isAuthenticated) {
      setAvatarMessage({ type: 'error', text: 'Phiên đăng nhập hết hạn.' });
      return;
    }
    setAvatarMessage(null);
    setAvatarSaving(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      const res = await authService.updateProfile(null as any, { avatar: dataUrl });
      if (res.success && res.data) {
        login(res.data);
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
    if (!isAuthenticated) return;
    setAvatarDeleteConfirm(false);
    setAvatarMessage(null);
    setAvatarSaving(true);
    try {
      const res = await authService.updateProfile(null as any, { avatar: null });
      if (res.success && res.data) {
        login(res.data);
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

  const initialLetter = (user.fullName || user.email).charAt(0).toUpperCase();

  type ProfileSection = 'info' | 'password' | 'favorites' | 'collections' | 'activity';
  const [activeSection, setActiveSection] = useState<ProfileSection>('info');

  const menuItems: { id: ProfileSection; label: string }[] = [
    { id: 'info', label: 'Thông tin cá nhân' },
    { id: 'password', label: 'Đổi mật khẩu' },
    { id: 'favorites', label: 'Câu yêu thích' },
    { id: 'collections', label: 'Bộ sưu tập' },
    { id: 'activity', label: 'Hoạt động' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Quay lại Trang chủ
        </Link>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar menu */}
          <aside className="lg:w-56 flex-shrink-0">
            <h1 className="text-xl font-bold text-slate-800 mb-4 lg:mb-6">Hồ sơ cá nhân</h1>
            <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 lg:overflow-visible">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`px-4 py-2.5 rounded-xl text-left text-sm font-medium whitespace-nowrap transition-colors ${
                    activeSection === item.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <Link
                to="/customize-question"
                className="px-4 py-2.5 rounded-xl text-left text-sm font-medium whitespace-nowrap text-slate-600 hover:bg-slate-200/80 transition-colors"
              >
                Tạo câu hỏi thủ công
              </Link>
              <Link
                to="/create-set-from-collection"
                className="px-4 py-2.5 rounded-xl text-left text-sm font-medium whitespace-nowrap text-slate-600 hover:bg-slate-200/80 transition-colors"
                title="Tạo set câu hỏi từ bộ sưu tập"
              >
                Tạo set câu
              </Link>
            </nav>
          </aside>

          {/* Content area */}
          <main className="flex-1 min-w-0">
            {activeSection === 'info' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">Thông tin cá nhân</h2>
                  <div className="mb-6">
                    <p className="text-sm font-medium text-slate-700 mb-2">Avatar</p>
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
                            onClick={() => setAvatarDeleteConfirm(true)}
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
                </div>
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
            )}

            {activeSection === 'password' && (
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
            )}

            {activeSection === 'favorites' && (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Câu yêu thích</h2>
        {favoritesLoading ? (
          <p className="text-slate-500 text-sm">Đang tải...</p>
        ) : favoriteQuestions.length === 0 ? (
          <p className="text-slate-500 text-sm">Các câu hỏi bạn đánh dấu yêu thích khi làm bài sẽ hiển thị ở đây.</p>
        ) : (
          <ul className="space-y-3">
            {favoriteQuestions.map((q) => (
              <li key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedQuestion(q)}
                  className="text-left flex-1 min-w-0 cursor-pointer"
                >
                  <p className="text-slate-800 font-medium line-clamp-2">{q.content}</p>
                  <p className="text-xs text-slate-500 mt-1">Độ khó: {q.difficulty || 'medium'}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFavoriteDeleteConfirm({ questionId: q.id, questionContent: q.content })}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Xóa khỏi yêu thích"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
            )}

            {activeSection === 'collections' && (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Bộ sưu tập đã lưu</h2>
        {favoritesLoading ? (
          <p className="text-slate-500 text-sm">Đang tải...</p>
        ) : savedCollectionsWithQuestions.length === 0 ? (
          <p className="text-slate-500 text-sm">Các bộ sưu tập bạn tạo khi lưu câu hỏi sẽ hiển thị ở đây.</p>
        ) : (
          <div className="space-y-4">
            {savedCollectionsWithQuestions.map((col) => {
              const isExpanded = expandedCollectionId === col.nameid;
              return (
                <div key={col.nameid} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedCollectionId((id) => (id === col.nameid ? null : col.nameid))}
                    className="w-full px-4 py-3 bg-indigo-50 border-b border-slate-200 flex items-center justify-between gap-3 text-left hover:bg-indigo-100/80 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{col.name}</p>
                      <p className="text-xs text-slate-500">{col.questions.length} câu hỏi</p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <ul className="divide-y divide-slate-100">
                      {col.questions.length === 0 ? (
                        <li className="px-4 py-3 text-sm text-slate-500">Chưa có câu hỏi</li>
                      ) : (
                        col.questions.map((q) => (
                          <li key={q.id} className="px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-3 group">
                            <button
                              type="button"
                              onClick={() => setSelectedQuestion(q)}
                              className="text-left flex-1 min-w-0 cursor-pointer"
                            >
                              <p className="text-slate-800 font-medium text-sm line-clamp-2">{q.content}</p>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ nameid: col.nameid, name: col.name, questionId: q.id, questionContent: q.content }); }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                              title="Xóa khỏi bộ sưu tập"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
            )}

            {activeSection === 'activity' && (
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
            )}
          </main>
        </div>
      </div>

      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedQuestion(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-slate-800 flex-1">Chi tiết câu hỏi</h3>
              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-slate-800 font-medium mb-4">{selectedQuestion.content}</p>
            <div className="space-y-2 mb-4">
              {selectedQuestion.options && selectedQuestion.options.length > 0 ? (
                selectedQuestion.options.map((opt) => (
                  <div
                    key={opt.text}
                    className={`px-4 py-2 rounded-lg border ${
                      opt.isCorrect ? 'border-green-500 bg-green-50 text-green-800' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    {opt.text}
                    {opt.isCorrect && <span className="ml-2 text-xs font-medium text-green-600">(Đáp án đúng)</span>}
                  </div>
                ))
              ) : selectedQuestion.correctAnswer ? (
                <div className="px-4 py-2 rounded-lg border border-green-500 bg-green-50 text-green-800">
                  {selectedQuestion.correctAnswer} <span className="ml-2 text-xs font-medium text-green-600">(Đáp án đúng)</span>
                </div>
              ) : null}
            </div>
            {selectedQuestion.explanation && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm font-medium text-amber-800 mb-1">Lời giải thích</p>
                <p className="text-slate-700 text-sm">{selectedQuestion.explanation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {favoriteDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !deleteLoading && setFavoriteDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Xóa khỏi yêu thích?</h3>
            <p className="text-slate-600 text-sm mb-4 line-clamp-2">{favoriteDeleteConfirm.questionContent}</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => !deleteLoading && setFavoriteDeleteConfirm(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRemoveFromFavorite}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {avatarDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !avatarSaving && setAvatarDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Xóa ảnh đại diện?</h3>
            <p className="text-slate-600 text-sm mb-4">Bạn có chắc muốn xóa avatar? Sau khi xóa sẽ hiển thị chữ cái đầu email.</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => !avatarSaving && setAvatarDeleteConfirm(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={avatarSaving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {avatarSaving ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !deleteLoading && setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Xóa khỏi bộ sưu tập?</h3>
            <p className="text-slate-600 text-sm mb-1">Bộ sưu tập: <span className="font-medium">{deleteConfirm.name}</span></p>
            <p className="text-slate-600 text-sm mb-4 line-clamp-2">{deleteConfirm.questionContent}</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => !deleteLoading && setDeleteConfirm(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRemoveFromCollection}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
