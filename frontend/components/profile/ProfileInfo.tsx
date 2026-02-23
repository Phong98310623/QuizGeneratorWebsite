import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../UserAvatar';
import { authService } from '../../services/api';
import { resizeImageToDataUrl } from '../../utils/image';
import { ThemeType, setTheme, getCurrentTheme } from '../../utils/theme';
import ConfirmModal from './ConfirmModal';
import { Palette, Crown, Check, HelpCircle, X } from 'lucide-react';

const ProfileInfo: React.FC = () => {
  const { user, login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.fullName ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarDeleteConfirm, setAvatarDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentTheme, setCurrentThemeState] = useState<ThemeType>(getCurrentTheme());

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      setCurrentThemeState(e.detail);
    };
    window.addEventListener('theme-changed', handleThemeChange);
    return () => window.removeEventListener('theme-changed', handleThemeChange);
  }, []);

  if (!user) return null;

  const isVip = user?.role === 'VIP';

  const handleThemeSelect = (theme: ThemeType) => {
    if (theme === currentTheme) return;
    if (!isVip) {
      navigate('/payment');
      return;
    }
    setTheme(theme);
  };

  const themes: { id: ThemeType; name: string; color: string; vip?: boolean }[] = [
    { id: 'default', name: 'Mặc định (Indigo)', color: 'bg-indigo-600' },
    { id: 'emerald', name: 'Xanh lục bảo', color: 'bg-emerald-600' },
    { id: 'rose', name: 'Hoa hồng', color: 'bg-rose-600' },
    { id: 'violet', name: 'Tím mộng mơ', color: 'bg-violet-600' },
    { id: 'vip', name: 'Hoàng gia VIP', color: 'bg-amber-500', vip: true },
  ];

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

  const initialLetter = (user.fullName || user.email).charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Thông tin cá nhân</h2>
          
          {user?.role === 'VIP' ? (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 shadow-sm">
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                VIP
              </span>
              <span className="text-sm font-bold">Thành viên VIP Pro</span>
            </div>
          ) : (
            <div className="relative group">
              <button
                onClick={() => navigate('/payment')}
                className="relative px-6 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-orange-200/50 hover:scale-105 transition-all duration-300 border-2 border-amber-300 overflow-visible"
              >
                <span className="absolute -top-3 -left-2 bg-white text-orange-600 text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-amber-400 shadow-sm z-10 uppercase tracking-tighter transform -rotate-12">
                  VIP
                </span>
                <span className="group-hover:hidden">Nâng cấp VIP</span>
                <span className="hidden group-hover:inline">Chỉ 100k VNĐ</span>
              </button>
              <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-20">
                <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  Mở khóa tất cả tính năng cao cấp
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 mb-2">Avatar</p>
          <div className="flex items-center gap-6">
            <UserAvatar user={user} size="lg" />
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

      {/* Theme Selection Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
            <Palette size={20} />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Giao diện ứng dụng</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {themes.map((t) => {
            const isSelected = currentTheme === t.id;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleThemeSelect(t.id)}
                className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  isSelected 
                    ? 'border-primary-500 bg-primary-50/50 shadow-sm' 
                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                } ${!isVip && !isSelected ? 'grayscale-[0.5] opacity-80 cursor-pointer' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${t.color} flex items-center justify-center text-white`}>
                    {isSelected && <Check size={16} />}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${isSelected ? 'text-primary-700' : 'text-slate-700'}`}>{t.name}</p>
                    {(!isVip || t.vip) && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-600 font-black uppercase tracking-tighter">
                        <Crown size={10} /> {t.vip ? 'VIP Exclusive' : 'VIP Only'}
                      </span>
                    )}
                  </div>
                </div>
                {!isVip && (
                  <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200">
                    <Crown size={14} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* VIP Exclusive: Avatar Frame Selection */}
      <div className={`bg-white rounded-2xl border-2 transition-all ${isVip ? 'border-amber-200 shadow-xl shadow-amber-50' : 'border-slate-100 opacity-80'} p-6 relative overflow-hidden cursor-pointer`}
           onClick={() => !isVip && navigate('/payment')}>
        {!isVip && (
          <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <div className="bg-white/90 px-4 py-2 rounded-xl shadow-xl border border-amber-200 flex items-center gap-2 transform -rotate-2">
              <Crown className="text-amber-500" size={20} />
              <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Mở khóa Khung Avatar VIP</span>
            </div>
          </div>
        )}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-0 translate-x-10 -translate-y-10" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Crown size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Khung Avatar VIP</h2>
              <p className="text-xs text-amber-600 font-bold uppercase tracking-widest">Đặc quyền VIP PRO</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            {/* Option 1: No Frame */}
            <button 
              type="button"
              className="group flex flex-col items-center gap-3"
              onClick={(e) => { e.stopPropagation(); if (isVip) { /* Logic to disable frame */ } else { navigate('/payment'); } }}
            >
              <div className="w-20 h-20 rounded-full border-4 border-slate-100 bg-slate-50 flex items-center justify-center text-slate-300 group-hover:border-primary-200 transition-all">
                <X size={32} />
              </div>
              <span className="text-xs font-bold text-slate-500">Mặc định</span>
            </button>

            {/* Option 2: Royal Gold Frame (Default VIP) */}
            <button 
              type="button"
              className="group flex flex-col items-center gap-3"
              onClick={(e) => { e.stopPropagation(); if (!isVip) navigate('/payment'); }}
            >
              <div className="relative">
                <UserAvatar user={user} size="lg" showVipFrame={true} />
                <div className={`absolute inset-0 border-4 border-amber-400 rounded-full ring-4 ring-amber-100 ${isVip ? 'animate-pulse' : ''}`} />
              </div>
              <span className="text-xs font-black text-amber-600">Hoàng Gia Gold</span>
            </button>
            
            {/* Future frames placeholder */}
            <div className="flex flex-col items-center gap-3 opacity-30 grayscale cursor-not-allowed">
              <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                <HelpCircle size={24} />
              </div>
              <span className="text-xs font-bold text-slate-400">Sắp ra mắt</span>
            </div>
          </div>
        </div>
      </div>

      {avatarDeleteConfirm && (
        <ConfirmModal
          title="Xóa ảnh đại diện?"
          message="Bạn có chắc muốn xóa avatar? Sau khi xóa sẽ hiển thị chữ cái đầu email."
          onConfirm={handleRemoveAvatar}
          onCancel={() => setAvatarDeleteConfirm(false)}
          isSaving={avatarSaving}
        />
      )}
    </div>
  );
};

export default ProfileInfo;
