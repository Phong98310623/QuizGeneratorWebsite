import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Flag,
  BookOpen,
  UserX,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  AlertCircle,
  Gift,
  AlertTriangle,
  Info,
  Megaphone,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminApi, getNotificationStreamUrl } from '../services/adminApi';

const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

interface LayoutProps {
  children: React.ReactNode;
}

type NotificationItem = {
  _id: string;
  title: string;
  content: string;
  icon?: string;
  type?: string;
  createdAt: string;
  link?: string;
};

const iconMap: Record<string, React.ReactNode> = {
  warning: <AlertTriangle size={18} className="text-amber-500" />,
  info: <Info size={18} className="text-blue-500" />,
  system: <Megaphone size={18} className="text-slate-500" />,
  event: <AlertCircle size={18} className="text-indigo-500" />,
  reward: <Gift size={18} className="text-emerald-500" />,
  update: <Info size={18} className="text-cyan-500" />,
};

const bellShakeStyle = `
  @keyframes bell-shake {
    0%, 100% { transform: rotate(0deg); }
    10%, 30%, 50%, 70%, 90% { transform: rotate(-8deg); }
    20%, 40%, 60%, 80% { transform: rotate(8deg); }
  }
  .bell-shake-animate {
    animation: bell-shake 0.6s ease-in-out infinite;
  }
`;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAdminAuth();

  const fetchNotifications = async () => {
    try {
      setNotificationLoading(true);
      const { notifications: list, lastReadAt: readAt } = await adminApi.getNotifications();
      setNotifications(list || []);
      setLastReadAt(readAt ?? null);
    } catch {
      setNotifications([]);
      setLastReadAt(null);
    } finally {
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  // SSE: khi có thông báo mới (vd. report) server gửi event → refetch
  useEffect(() => {
    if (!user) return;
    const url = getNotificationStreamUrl();
    const es = new EventSource(url, { withCredentials: true });
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === 'NEW_NOTIFICATION') fetchNotifications();
      } catch {
        // ignore
      }
    };
    es.onerror = () => {
      es.close();
    };
    return () => {
      es.close();
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const lastReadTime = lastReadAt ? new Date(lastReadAt).getTime() : 0;
  const hasUnread = notifications.some((n) => new Date(n.createdAt).getTime() > lastReadTime);

  const handleBellClick = async () => {
    const wasOpen = notificationOpen;
    setNotificationOpen(!notificationOpen);
    if (!wasOpen && hasUnread) {
      try {
        await adminApi.markNotificationsRead();
        setLastReadAt(new Date().toISOString());
      } catch {
        // ignore
      }
    }
  };

  const handleNotificationClick = (n: NotificationItem) => {
    if (n.link) {
      setNotificationOpen(false);
      navigate(n.link);
    } else {
      setNotifications((prev) => prev.filter((x) => x._id !== n._id));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (isInIframe) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="p-4">{children}</div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'User Directory', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'Blacklist', path: '/admin/blacklist', icon: <UserX size={20} /> },
    { name: 'Report Queue', path: '/admin/reports', icon: <Flag size={20} /> },
    { name: 'Content Manager', path: '/admin/content', icon: <BookOpen size={20} /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden text-slate-700">
      <style>{bellShakeStyle}</style>
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } transition-all duration-300 ease-in-out bg-white border-r border-slate-200 flex flex-col z-50`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen && 'justify-center'}`}>
            <div className="bg-indigo-600 p-2 rounded-lg shrink-0">
              <BookOpen className="text-white" size={24} />
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-xl tracking-tight text-slate-900 whitespace-nowrap">
                QuizAdmin
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 mt-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-3 py-3 rounded-xl transition-all',
                  isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                  !isSidebarOpen && 'justify-center',
                ].join(' ')
              }
            >
              <span className="shrink-0">{item.icon}</span>
              {isSidebarOpen && <span className="font-medium text-sm">{item.name}</span>}
              {isSidebarOpen && location.pathname === item.path && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-3 w-full rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all ${
              !isSidebarOpen && 'justify-center'
            }`}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-1.5 w-64">
              <Search size={16} className="text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search everything..."
                className="bg-transparent border-none text-sm focus:ring-0 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={handleBellClick}
                className={`relative p-2 hover:bg-slate-100 rounded-lg transition-colors ${
                  hasUnread ? 'bell-shake-animate' : ''
                }`}
                aria-label="Thông báo"
              >
                <Bell size={20} className="text-slate-600" />
                {hasUnread && (
                  <span
                    className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"
                    aria-hidden
                  />
                )}
              </button>
              {notificationOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">Thông báo</span>
                    {notifications.length > 0 && hasUnread && (
                      <span className="text-xs text-slate-500">Đã đánh dấu đọc</span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificationLoading ? (
                      <div className="p-6 text-center text-slate-500 text-sm">Đang tải...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-sm">
                        Không có thông báo mới
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {notifications.map((n) => (
                          <li
                            key={n._id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleNotificationClick(n)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleNotificationClick(n);
                              }
                            }}
                            className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <div className="flex gap-3">
                              <span className="shrink-0 mt-0.5">
                                {iconMap[String(n.icon || n.type || 'system').toLowerCase()] ?? (
                                  <Bell size={18} className="text-slate-400" />
                                )}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-slate-900 text-sm">{n.title}</p>
                                <p className="text-slate-600 text-xs mt-0.5 line-clamp-2">
                                  {n.content}
                                </p>
                                <p className="text-slate-400 text-[10px] mt-1">
                                  {new Date(n.createdAt).toLocaleString('vi-VN')}
                                  {n.link && (
                                    <span className="ml-1 text-indigo-500">· Xem chi tiết</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="h-8 w-[1px] bg-slate-200 mx-2" />
            <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-900 leading-none">
                  {user?.fullName || user?.email || 'Admin User'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">{user?.role || 'Admin'}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;

