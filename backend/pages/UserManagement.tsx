
import React, { useState } from 'react';
import { MoreVertical, Shield, ShieldCheck, Ban, CheckCircle, Search, Filter } from 'lucide-react';
import { User, UserRole, UserStatus } from '../types';

const MOCK_USERS: User[] = [
  { _id: '1', username: 'john_doe', email: 'john@example.com', role: UserRole.ADMIN, status: UserStatus.ACTIVE, total_score: 1250, created_at: '2023-10-01' },
  { _id: '2', username: 'jane_smith', email: 'jane@example.com', role: UserRole.USER, status: UserStatus.ACTIVE, total_score: 840, created_at: '2023-11-15' },
  { _id: '3', username: 'bad_actor', email: 'spam@bot.com', role: UserRole.USER, status: UserStatus.BLOCKED, total_score: 0, created_at: '2023-12-05' },
  { _id: '4', username: 'mike_ro', email: 'mike@dev.io', role: UserRole.USER, status: UserStatus.ACTIVE, total_score: 2100, created_at: '2024-01-20' },
  { _id: '5', username: 'sarah_con', email: 'sarah@skynet.com', role: UserRole.USER, status: UserStatus.ACTIVE, total_score: 150, created_at: '2024-02-10' },
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleStatus = (id: string) => {
    setUsers(users.map(u => 
      u._id === id 
        ? { ...u, status: u.status === UserStatus.ACTIVE ? UserStatus.BLOCKED : UserStatus.ACTIVE } 
        : u
    ));
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage platform users, roles, and account permissions.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Score</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Joined</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={`https://picsum.photos/seed/${user.username}/40/40`} 
                        className="w-10 h-10 rounded-full bg-slate-100" 
                        alt="" 
                      />
                      <div>
                        <p className="font-bold text-slate-900">{user.username}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === UserRole.ADMIN ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {user.role === UserRole.ADMIN ? <ShieldCheck size={12} /> : <Shield size={12} />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === UserStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${user.status === UserStatus.ACTIVE ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-700">{user.total_score.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => toggleStatus(user._id)}
                        className={`p-2 rounded-lg transition-colors ${
                          user.status === UserStatus.ACTIVE 
                            ? 'text-rose-600 hover:bg-rose-50' 
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={user.status === UserStatus.ACTIVE ? 'Block User' : 'Unblock User'}
                      >
                        {user.status === UserStatus.ACTIVE ? <Ban size={18} /> : <CheckCircle size={18} />}
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
