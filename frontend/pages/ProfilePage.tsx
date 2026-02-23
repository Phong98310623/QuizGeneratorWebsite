import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileInfo from '../components/profile/ProfileInfo';
import ChangePassword from '../components/profile/ChangePassword';
import FavoriteQuestions from '../components/profile/FavoriteQuestions';
import Collections from '../components/profile/Collections';
import ActivityHistory from '../components/profile/ActivityHistory';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  type ProfileSection = 'info' | 'password' | 'favorites' | 'collections' | 'activity';
  const [activeSection, setActiveSection] = useState<ProfileSection>('info');

  const menuItems: { id: ProfileSection; label: string }[] = [
    { id: 'info', label: 'Cài đặt tài khoản' },
    { id: 'password', label: 'Bảo mật' },
    { id: 'favorites', label: 'Yêu thích' },
    { id: 'collections', label: 'Bộ sưu tập' },
    { id: 'activity', label: 'Lịch sử' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-primary-600 mb-8 transition-colors uppercase tracking-widest">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Quay lại Trang chủ
        </Link>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar menu */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-3xl border border-neutral-200 p-3 shadow-sm sticky top-24">
              <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 lg:overflow-visible">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`px-6 py-4 rounded-2xl text-left text-sm font-black whitespace-nowrap transition-all ${
                      activeSection === item.id
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-100 scale-[1.02]'
                        : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <div className="h-px bg-neutral-100 my-2 mx-4 hidden lg:block" />
                <Link
                  to="/customize-question"
                  className="px-6 py-4 rounded-2xl text-left text-sm font-bold whitespace-nowrap text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 transition-all"
                >
                  Tạo câu hỏi
                </Link>
                <Link
                  to="/create-set-from-collection"
                  className="px-6 py-4 rounded-2xl text-left text-sm font-bold whitespace-nowrap text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 transition-all"
                  title="Tạo set câu hỏi từ bộ sưu tập"
                >
                  Tạo set câu
                </Link>
              </nav>
            </div>
          </aside>

          {/* Content area */}
          <main className="flex-1 min-w-0">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
                {menuItems.find(i => i.id === activeSection)?.label}
              </h1>
              <p className="text-neutral-500 font-medium mt-1">Quản lý và tùy chỉnh trải nghiệm của bạn</p>
            </div>
            {activeSection === 'info' && <ProfileInfo />}
            {activeSection === 'password' && <ChangePassword />}
            {activeSection === 'favorites' && <FavoriteQuestions />}
            {activeSection === 'collections' && <Collections />}
            {activeSection === 'activity' && <ActivityHistory />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
