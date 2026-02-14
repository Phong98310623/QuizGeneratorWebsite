import React, { useEffect, useState } from 'react';
import {
  Users,
  HelpCircle,
  AlertTriangle,
  FileCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminApi } from '../services/adminApi';
import { Link } from 'react-router-dom';

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

const StatCard = ({
  title,
  value,
  subValue,
  icon,
  color,
  loading,
}: {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
        <div className="text-white">{icon}</div>
      </div>
      {loading && <Loader2 className="animate-spin text-slate-400" size={20} />}
    </div>
    <div className="mt-4">
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      {subValue && <p className="text-xs text-slate-400 mt-0.5">{subValue}</p>}
    </div>
  </div>
);

interface ContentStats {
  totalQuestions: number;
  totalSets: number;
  verifiedSets: number;
}

interface ReportItem {
  id: string;
  reporterName: string;
  reportedEntityType: string;
  reportedEntityTitle: string;
  reason: string;
  status: string;
  createdAt?: string;
}

const AdminDashboard: React.FC = () => {
  const { isAuthenticated } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [contentStats, setContentStats] = useState<ContentStats | null>(null);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [reports, setReports] = useState<ReportItem[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const [stats, users, reportsList] = await Promise.all([
          adminApi.getContentStats(),
          adminApi.getAllUsers(),
          adminApi.getReports(),
        ]);
        setContentStats(stats);
        setUsersCount(Array.isArray(users) ? users.length : 0);
        setReports(Array.isArray(reportsList) ? (reportsList as ReportItem[]) : []);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  const pendingCount = reports.filter((r) => r.status === 'PENDING').length;
  const reportByReason = reports.reduce<Record<string, number>>((acc, r) => {
    const key = r.reason || 'Khác';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const reportData = Object.entries(reportByReason)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const reportsByDay = (() => {
    const last7: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      last7[key] = 0;
    }
    reports.forEach((r) => {
      if (r.createdAt) {
        const key = r.createdAt.slice(0, 10);
        if (last7[key] !== undefined) last7[key]++;
      }
    });
    return Object.entries(last7)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name: name.slice(5), reports: count }));
  })();

  const recentReports = reports.slice(0, 8);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tổng quan nền tảng</h1>
        <p className="text-slate-500 mt-1">Dữ liệu từ cơ sở dữ liệu. Cập nhật khi tải trang.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng số user"
          value={loading ? '...' : usersCount.toLocaleString('vi-VN')}
          icon={<Users size={20} />}
          color="bg-indigo-600"
          loading={loading}
        />
        <StatCard
          title="Tổng câu hỏi"
          value={loading ? '...' : (contentStats?.totalQuestions ?? 0).toLocaleString('vi-VN')}
          subValue={contentStats ? `${contentStats.totalSets} bộ câu hỏi` : undefined}
          icon={<HelpCircle size={20} />}
          color="bg-amber-600"
          loading={loading}
        />
        <StatCard
          title="Báo cáo chờ xử lý"
          value={loading ? '...' : pendingCount.toString()}
          subValue={reports.length > 0 ? `Tổng ${reports.length} báo cáo` : undefined}
          icon={<AlertTriangle size={20} />}
          color="bg-rose-600"
          loading={loading}
        />
        <StatCard
          title="Bộ câu hỏi đã duyệt"
          value={loading ? '...' : (contentStats?.verifiedSets ?? 0).toLocaleString('vi-VN')}
          subValue={contentStats ? `/ ${contentStats.totalSets} bộ` : undefined}
          icon={<FileCheck size={20} />}
          color="bg-emerald-600"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">Báo cáo theo ngày (7 ngày gần nhất)</h3>
          </div>
          <div className="h-[300px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-400" size={32} />
              </div>
            ) : reportsByDay.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Chưa có dữ liệu
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportsByDay}>
                  <defs>
                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [value, 'Báo cáo']}
                    labelFormatter={(label) => `Ngày ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="reports"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReports)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Báo cáo theo lý do</h3>
          <div className="h-[300px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-400" size={32} />
              </div>
            ) : reportData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Chưa có báo cáo
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="category"
                    type="category"
                    width={80}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                    {reportData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Báo cáo gần đây</h3>
          <Link
            to="/admin/reports"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Xem tất cả
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : recentReports.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">Chưa có báo cáo nào</div>
          ) : (
            recentReports.map((r) => (
              <div
                key={r.id}
                className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="shrink-0">
                  {r.status === 'PENDING' ? (
                    <AlertTriangle className="text-amber-500" size={16} />
                  ) : (
                    <AlertCircle className="text-slate-400" size={16} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600 truncate">
                    <span className="font-bold text-slate-900">{r.reporterName}</span>
                    {' · Báo cáo "'}
                    <span className="truncate inline-block max-w-[180px] align-bottom" title={r.reportedEntityTitle}>
                      {r.reportedEntityTitle}
                    </span>
                    {'" · '}
                    {r.reason}
                  </p>
                </div>
                <div className="text-xs text-slate-400 font-medium shrink-0">
                  {r.createdAt ? formatTimeAgo(r.createdAt) : '—'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
