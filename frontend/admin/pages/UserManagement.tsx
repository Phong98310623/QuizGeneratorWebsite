import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, ShieldCheck, Ban, CheckCircle, Search, Filter, Loader2, AlertCircle, X } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminApi } from '../services/adminApi';
import { User } from '../../types';
import { stringToSafeColor } from '../../utils/avatar';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAuthenticated) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const list = await adminApi.getAllUsers();
        setUsers(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAuthenticated]);

  const handleBlockClick = (user: User) => {
    if (user.status === 'ACTIVE') {
      setSelectedUser(user);
      setBlockReason('');
      setShowBlockModal(true);
    } else {
      toggleStatus(user.id, 'ACTIVE', '');
    }
  };

  const toggleStatus = async (id: string, newStatus: string, reason: string = '') => {
      if (!isAuthenticated) {
        setError('Authentication required');
      return;
    }

    setIsUpdating(true);
    try {
      await adminApi.updateUserStatus(id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)),
      );

      if (showBlockModal) {
        setShowBlockModal(false);
        setSelectedUser(null);
        setBlockReason('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating user status');
      console.error('Error updating user status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmBlock = () => {
    if (!selectedUser) return;
    if (!blockReason.trim()) {
      setError('Please provide a reason for blocking this user');
      return;
    }
    toggleStatus(selectedUser.id, 'BANNED', blockReason.trim());
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
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

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-rose-600" size={20} />
          <p className="text-rose-800 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex items-center justify-center">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Joined</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => {
                            // #region agent log
                            const pathUsed = `preview/user/${user.id}`;
                            fetch('http://127.0.0.1:7244/ingest/ce880661-753e-4c17-acfe-180cc31dd4ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'UserManagement.tsx:onClick',message:'navigate to preview user',data:{userId:user.id,pathUsed,pathname:location.pathname,hash:typeof window!=='undefined'?window.location.hash:''},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
                            // #endregion
                            navigate(`/admin/preview/user/${user.id}`);
                          }}
                          className="flex items-center gap-3 w-full text-left hover:opacity-90 transition-opacity"
                        >
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                              style={{ backgroundColor: stringToSafeColor(user.email) }}
                            >
                              {(user.fullName || user.email).charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{user.fullName}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {user.role === 'ADMIN' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : user.status === 'BANNED'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.status === 'ACTIVE'
                                ? 'bg-emerald-500'
                                : user.status === 'BANNED'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBlockClick(user);
                          }}
                          disabled={isUpdating}
                          className={`p-2 rounded-lg transition-colors ${
                            user.status === 'ACTIVE'
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Bỏ khóa'}
                        >
                          {user.status === 'ACTIVE' ? <Ban size={18} /> : <CheckCircle size={18} />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showBlockModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Block User</h3>
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setSelectedUser(null);
                  setBlockReason('');
                  setError(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">You are about to block the following user:</p>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="font-semibold text-slate-900">{selectedUser.fullName}</p>
                <p className="text-xs text-slate-500">{selectedUser.email}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Reason for blocking <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Enter the reason for blocking this user..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                rows={4}
              />
            </div>

            {error && (
              <div className="mb-4 bg-rose-50 border border-rose-200 rounded-lg p-3">
                <p className="text-sm text-rose-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setSelectedUser(null);
                  setBlockReason('');
                  setError(null);
                }}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBlock}
                disabled={isUpdating || !blockReason.trim()}
                className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Blocking...
                  </>
                ) : (
                  'Confirm Block'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

