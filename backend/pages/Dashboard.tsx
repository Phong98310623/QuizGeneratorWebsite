
import React from 'react';
import { 
  Users, 
  HelpCircle, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2
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
  Cell
} from 'recharts';

const data = [
  { name: 'Mon', active: 400, attempts: 2400 },
  { name: 'Tue', active: 300, attempts: 1398 },
  { name: 'Wed', active: 200, attempts: 9800 },
  { name: 'Thu', active: 278, attempts: 3908 },
  { name: 'Fri', active: 189, attempts: 4800 },
  { name: 'Sat', active: 239, attempts: 3800 },
  { name: 'Sun', active: 349, attempts: 4300 },
];

const reportData = [
  { category: 'Spam', count: 45 },
  { category: 'Inaccurate', count: 28 },
  { category: 'Inappropriate', count: 12 },
  { category: 'Technical', count: 8 },
];

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981'];

const StatCard = ({ title, value, change, trend, icon, color }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-xs font-semibold ${trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-2 py-1 rounded-full`}>
        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {change}%
      </div>
    </div>
    <div className="mt-4">
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-slate-500 mt-1">Welcome back. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value="12,842" 
          change="12" 
          trend="up" 
          icon={<Users size={20} />} 
          color="bg-indigo-600"
        />
        <StatCard 
          title="Active Questions" 
          value="3,490" 
          change="5.4" 
          trend="up" 
          icon={<HelpCircle size={20} />} 
          color="bg-amber-600"
        />
        <StatCard 
          title="Pending Reports" 
          value="18" 
          change="24" 
          trend="down" 
          icon={<AlertTriangle size={20} />} 
          color="bg-rose-600"
        />
        <StatCard 
          title="Avg. Daily Active" 
          value="1,240" 
          change="8.1" 
          trend="up" 
          icon={<TrendingUp size={20} />} 
          color="bg-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900">User Activity & Engagement</h3>
            <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="attempts" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6">Report Breakdown</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                  {reportData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {reportData.map((r, i) => (
              <div key={r.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                  <span className="text-sm text-slate-500">{r.category}</span>
                </div>
                <span className="text-sm font-semibold">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Recent Activity</h3>
          <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">View all logs</button>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { user: 'alex_dev', action: 'Created new question set "Advanced React"', time: '2 mins ago', icon: <CheckCircle2 className="text-emerald-500" size={16} /> },
            { user: 'mod_jess', action: 'Resolved report #9842 (Inaccurate content)', time: '14 mins ago', icon: <CheckCircle2 className="text-emerald-500" size={16} /> },
            { user: 'system', action: 'Auto-blocked user "bot_99" for suspicious activity', time: '1 hour ago', icon: <Clock className="text-slate-400" size={16} /> },
            { user: 'sarah_smith', action: 'Reported question #772 (Spam)', time: '3 hours ago', icon: <AlertTriangle className="text-rose-500" size={16} /> },
          ].map((activity, idx) => (
            <div key={idx} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
              <div className="shrink-0">{activity.icon}</div>
              <div className="flex-1">
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-slate-900">@{activity.user}</span> {activity.action}
                </p>
              </div>
              <div className="text-xs text-slate-400 font-medium">{activity.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
