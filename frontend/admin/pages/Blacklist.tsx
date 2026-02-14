import React, { useEffect, useState } from 'react';
import { UserX, ShieldAlert, RotateCcw, Search, Loader2, AlertCircle, X } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminApi } from '../services/adminApi';
import { User } from '../../types';

const Blacklist: React.FC = () => {
  const { token } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeUserId, setIframeUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlacklistedUsers = async () => {
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const allUsers = await adminApi.getAllUsers(token);
        const blocked = allUsers.filter((u) => u.status === 'BANNED');
        setUsers(blocked);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching blacklist');
        console.error('[Blacklist] Error fetching blacklist:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlacklistedUsers();
  }, [token]);

  const restoreAccess = async (id: string) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      await adminApi.updateUserStatus(id, 'ACTIVE', token);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while restoring access');
      console.error('[Blacklist] Error restoring access:', err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const blockedCount = users.length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blacklist Registry</h1>
          <p className="text-slate-500 mt-1">
            Review and manage restricted users and suspicious entities.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search blacklist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-rose-600" size={20} />
          <p className="text-rose-800 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl flex items-center gap-4">
          <div className="bg-rose-600 p-3 rounded-xl text-white">
            <UserX size={24} />
          </div>
          <div>
            <p className="text-rose-800 text-sm font-semibold uppercase tracking-wider">
              Blocked Accounts
            </p>
            <h4 className="text-2xl font-bold text-rose-900">
              {loading ? '—' : blockedCount}
            </h4>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-center gap-4">
          <div className="bg-amber-600 p-3 rounded-xl text-white">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-amber-800 text-sm font-semibold uppercase tracking-wider">
              Suspicious IPs
            </p>
            <h4 className="text-2xl font-bold text-amber-900">—</h4>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex items-center justify-center">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Restriction Date
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Violation Reason
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-slate-500 text-sm"
                  >
                    {searchTerm
                      ? 'No blacklisted users match your search.'
                      : 'No blacklisted users.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setIframeUserId(user.id)}
                        className="flex items-center gap-3 w-full text-left hover:opacity-90 transition-opacity"
                      >
                        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {user.email}
                          </p>
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-500 italic">
                        Blocked by admin
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          restoreAccess(user.id);
                        }}
                        className="flex items-center gap-2 ml-auto text-indigo-600 hover:text-indigo-800 font-semibold text-xs"
                      >
                        <RotateCcw size={14} />
                        Restore Access
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal iframe chi tiết user */}
      {iframeUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Chi tiết user</h3>
              <button
                onClick={() => setIframeUserId(null)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <iframe
                src={`${window.location.origin}${window.location.pathname}#/admin/preview/user/${encodeURIComponent(iframeUserId)}`}
                title="Chi tiết user"
                className="w-full h-full border-0 rounded-b-2xl"
                sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blacklist;

