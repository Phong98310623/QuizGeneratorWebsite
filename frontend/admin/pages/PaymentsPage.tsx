import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock, Search, Filter, Loader2, AlertCircle, User } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminApi } from '../services/adminApi';

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { isAuthenticated } = useAdminAuth();

  useEffect(() => {
    fetchPayments();
  }, [isAuthenticated, statusFilter]);

  const fetchPayments = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getPayments(statusFilter || undefined);
      setPayments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (paymentId: string, status: 'APPROVED' | 'CANCELLED' | 'REVIEW') => {
    const actionText = status === 'APPROVED' ? 'duyệt' : status === 'CANCELLED' ? 'từ chối' : 'chuyển sang trạng thái kiểm tra';
    if (!window.confirm(`Bạn có chắc muốn ${actionText} giao dịch này?`)) return;
    
    setIsUpdating(paymentId);
    try {
      await adminApi.updatePaymentStatus(paymentId, status as any);
      setPayments(prev => prev.map(p => p._id === paymentId ? { ...p, status } : p));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái');
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredPayments = payments.filter(p => 
    p.transactionContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"><CheckCircle size={12} /> {status}</span>;
      case 'CANCELLED':
      case 'REJECTED':
      case 'FAILED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700"><XCircle size={12} /> {status}</span>;
      case 'REVIEW':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 font-bold animate-pulse"><Clock size={12} /> Đang chờ duyệt</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700"><Clock size={12} /> {status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý thanh toán</h1>
          <p className="text-slate-500 mt-1">Duyệt các yêu cầu nâng cấp VIP Pro qua chuyển khoản.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm mã GD, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="REVIEW">Đang chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Đã từ chối</option>
            <option value="PENDING">Chưa báo chuyển</option>
          </select>
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
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Người dùng</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Giao dịch</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Số tiền</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Ngày tạo</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Không tìm thấy giao dịch nào.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{payment.userId?.username || 'N/A'}</p>
                            <p className="text-xs text-slate-500">{payment.userId?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">
                            {payment.transactionContent}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">{payment.method}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">
                          {payment.amount?.toLocaleString()}đ
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(payment.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(payment.status === 'REVIEW' || payment.status === 'PENDING') && (
                          <div className="flex items-center justify-end gap-2">
                            {payment.status === 'PENDING' && (
                              <button
                                onClick={() => handleUpdateStatus(payment._id, 'REVIEW')}
                                disabled={!!isUpdating}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Chuyển sang kiểm tra"
                              >
                                {isUpdating === payment._id ? <Loader2 className="animate-spin" size={18} /> : <Clock size={18} />}
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdateStatus(payment._id, 'CANCELLED')}
                              disabled={!!isUpdating}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Từ chối/Hủy"
                            >
                              {isUpdating === payment._id ? <Loader2 className="animate-spin" size={18} /> : <XCircle size={18} />}
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(payment._id, 'APPROVED')}
                              disabled={!!isUpdating}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Duyệt"
                            >
                              {isUpdating === payment._id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                            </button>
                          </div>
                        )}
                        {(payment.status === 'APPROVED' || payment.status === 'CANCELLED') && (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[10px] text-slate-400 italic">Đã xử lý</span>
                            <button
                              onClick={() => handleUpdateStatus(payment._id, 'REVIEW')}
                              disabled={!!isUpdating}
                              className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-all"
                              title="Xem xét lại"
                            >
                              <Clock size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
