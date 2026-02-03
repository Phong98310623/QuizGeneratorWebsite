
import React from 'react';
import { UserX, ShieldAlert, RotateCcw, Search } from 'lucide-react';
import { User, UserStatus } from '../types';

const BLACKLISTED_USERS: Partial<User>[] = [
  { _id: '3', username: 'bad_actor', email: 'spam@bot.com', status: UserStatus.BLOCKED, created_at: '2023-12-05' },
  { _id: '10', username: 'phisher_01', email: 'scam@mail.ru', status: UserStatus.BLOCKED, created_at: '2024-01-15' },
];

const Blacklist: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blacklist Registry</h1>
          <p className="text-slate-500 mt-1">Review and manage restricted users and suspicious entities.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search blacklist..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl flex items-center gap-4">
          <div className="bg-rose-600 p-3 rounded-xl text-white">
            <UserX size={24} />
          </div>
          <div>
            <p className="text-rose-800 text-sm font-semibold uppercase tracking-wider">Blocked Accounts</p>
            <h4 className="text-2xl font-bold text-rose-900">142</h4>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-center gap-4">
          <div className="bg-amber-600 p-3 rounded-xl text-white">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-amber-800 text-sm font-semibold uppercase tracking-wider">Suspicious IPs</p>
            <h4 className="text-2xl font-bold text-amber-900">28</h4>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Entity</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Restriction Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Violation Reason</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {BLACKLISTED_USERS.map((user) => (
              <tr key={user._id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{user.username}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {user.created_at}
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-medium text-slate-500 italic">Spamming / Multiple failed auth attempts</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="flex items-center gap-2 ml-auto text-indigo-600 hover:text-indigo-800 font-semibold text-xs">
                    <RotateCcw size={14} />
                    Restore Access
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Blacklist;
