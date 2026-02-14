import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { adminApi } from '../../services/adminApi';

const UserPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!token || !id) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = await adminApi.getUser(id, token);
        setData(user as unknown as Record<string, unknown>);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, id]);

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
          <AlertCircle size={20} />
          <span>{error || 'Không tìm thấy dữ liệu'}</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-100 rounded-xl">
          <User size={24} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Chi tiết User</h1>
          <p className="text-sm text-slate-500">ID: {String(data.id ?? id)}</p>
        </div>
      </div>
      <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Họ tên</p>
          <p className="font-medium text-slate-900">{String(data.fullName ?? data.username ?? '—')}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</p>
          <p className="text-slate-700">{String(data.email ?? '—')}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vai trò</p>
          <p className="text-slate-700">{String(data.role ?? '—')}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</p>
          <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
            data.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {String(data.status ?? '—')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserPreviewPage;
