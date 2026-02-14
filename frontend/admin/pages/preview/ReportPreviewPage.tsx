import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Flag,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Mail,
  User,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  ShieldAlert,
  Eye,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { adminApi } from '../../services/adminApi';

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';
export type ReportPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ReportEntityType = 'USER' | 'QUIZ' | 'CONTENT' | 'OTHER';

export interface ReportDetail {
  id: string;
  reporterName: string;
  reporterEmail: string;
  reportedEntityType: ReportEntityType;
  reportedEntityId: string;
  reportedEntityTitle: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  priority: ReportPriority;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

const formatDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN');
};

const ReportPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportDetail | null>(null);
  const [updating, setUpdating] = useState(false);
  const [iframeEntity, setIframeEntity] = useState<{ type: string; id: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated || !id) return;
    try {
      setLoading(true);
      setError(null);
      const raw = await adminApi.getReportById(id);
      setData({
        id: String(raw.id ?? raw._id ?? id),
        reporterName: raw.reporterName ?? '',
        reporterEmail: raw.reporterEmail ?? '',
        reportedEntityType: raw.reportedEntityType ?? 'OTHER',
        reportedEntityId: raw.reportedEntityId ?? '',
        reportedEntityTitle: raw.reportedEntityTitle ?? '',
        reason: raw.reason ?? '',
        description: raw.description,
        status: raw.status ?? 'PENDING',
        priority: raw.priority ?? 'MEDIUM',
        createdAt: raw.createdAt ?? '',
        resolvedAt: raw.resolvedAt,
        resolvedBy: raw.resolvedBy,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResolve = async () => {
    if (!isAuthenticated || !id || !data) return;
    setUpdating(true);
    try {
      const result = await adminApi.resolveReport(id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              status: 'RESOLVED' as ReportStatus,
              resolvedAt: result?.resolvedAt ?? new Date().toISOString(),
              resolvedBy: result?.resolvedBy ?? 'Admin',
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể resolve report');
    } finally {
      setUpdating(false);
    }
  };

  const handleDismiss = async () => {
    if (!isAuthenticated || !id || !data) return;
    setUpdating(true);
    try {
      const result = await adminApi.dismissReport(id);
      setData((prev) =>
        prev
          ? {
              ...prev,
              status: 'DISMISSED' as ReportStatus,
              resolvedAt: result?.resolvedAt ?? new Date().toISOString(),
              resolvedBy: result?.resolvedBy ?? 'Admin',
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể dismiss report');
    } finally {
      setUpdating(false);
    }
  };

  const getPreviewType = (type: ReportEntityType): string => {
    switch (type) {
      case 'USER':
        return 'user';
      case 'CONTENT':
        return 'question';
      case 'QUIZ':
        return 'set';
      default:
        return 'user';
    }
  };

  const handleViewEntity = () => {
    if (!data || data.reportedEntityType === 'OTHER') return;
    const previewType = getPreviewType(data.reportedEntityType);
    setIframeEntity({ type: previewType, id: data.reportedEntityId });
  };

  const getEntityIcon = (type: ReportEntityType) => {
    switch (type) {
      case 'USER':
        return <User size={14} className="text-slate-500" />;
      case 'QUIZ':
        return <FileText size={14} className="text-slate-500" />;
      case 'CONTENT':
        return <MessageSquare size={14} className="text-slate-500" />;
      default:
        return <Flag size={14} className="text-slate-500" />;
    }
  };

  const getPriorityBadge = (p: ReportPriority) => {
    const styles = {
      HIGH: 'bg-rose-100 text-rose-700',
      MEDIUM: 'bg-amber-100 text-amber-700',
      LOW: 'bg-slate-100 text-slate-600',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[p]}`}>
        {p === 'HIGH' && <ShieldAlert size={10} />}
        {p}
      </span>
    );
  };

  const getStatusBadge = (s: ReportStatus) => {
    const styles = {
      PENDING: 'bg-amber-100 text-amber-700',
      RESOLVED: 'bg-emerald-100 text-emerald-700',
      DISMISSED: 'bg-slate-100 text-slate-600',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[s]}`}>
        {s === 'PENDING' && <Clock size={10} />}
        {s === 'RESOLVED' && <CheckCircle size={10} />}
        {s === 'DISMISSED' && <XCircle size={10} />}
        {s}
      </span>
    );
  };

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

  const reportId = String(data.id ?? id);
  const isPending = data.status === 'PENDING';

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <Flag size={24} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Chi tiết Report</h1>
            <p className="text-sm text-slate-500">ID: {reportId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/admin/reports')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách
          </button>
          {isPending && (
            <>
              <button
                onClick={handleResolve}
                disabled={updating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {updating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Resolve
              </button>
              <button
                onClick={handleDismiss}
                disabled={updating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <XCircle size={16} />
                Dismiss
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        {/* Reporter */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <User size={14} />
            Người báo cáo
          </p>
          <p className="font-medium text-slate-900 py-0.5">{data.reporterName}</p>
          <p className="text-slate-600 text-sm flex items-center gap-1">
            <Mail size={14} />
            {data.reporterEmail}
          </p>
        </div>

        {/* Reported entity */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nội dung bị báo cáo</p>
          <p className="font-medium text-slate-900 py-0.5">{data.reportedEntityTitle}</p>
          <p className="text-slate-600 text-sm flex items-center gap-1.5 mt-1">
            {getEntityIcon(data.reportedEntityType)}
            {data.reportedEntityType} · {data.reportedEntityId}
          </p>
          {data.reportedEntityType !== 'OTHER' && (
            <button
              type="button"
              onClick={handleViewEntity}
              className="mt-2 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              <Eye size={14} />
              Xem chi tiết nội dung trong iframe
            </button>
          )}
        </div>

        {/* Reason */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Lý do báo cáo</p>
          <p className="text-slate-700 py-0.5">{data.reason}</p>
        </div>

        {/* Description */}
        {data.description && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Mô tả thêm</p>
            <p className="text-slate-600 text-sm bg-slate-50 rounded-xl p-3">{data.description}</p>
          </div>
        )}

        {/* Priority & Status */}
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Độ ưu tiên</p>
            {getPriorityBadge(data.priority)}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Trạng thái</p>
            {getStatusBadge(data.status)}
          </div>
        </div>

        {/* Timestamps */}
        <div className="flex flex-wrap gap-6 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            Tạo lúc: {formatDate(data.createdAt)}
          </span>
          {data.resolvedAt && (
            <span className="flex items-center gap-1">
              <CheckCircle size={14} />
              Xử lý lúc: {formatDate(data.resolvedAt)}
              {data.resolvedBy && ` bởi ${data.resolvedBy}`}
            </span>
          )}
        </div>
      </div>

      {/* Modal iframe xem chi tiết entity */}
      {iframeEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Chi tiết nội dung bị báo cáo</h3>
              <button
                onClick={() => setIframeEntity(null)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <iframe
                src={`${window.location.origin}${window.location.pathname}#/admin/preview/${iframeEntity.type}/${encodeURIComponent(iframeEntity.id)}`}
                title="Chi tiết nội dung"
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

export default ReportPreviewPage;
