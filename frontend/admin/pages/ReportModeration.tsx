import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flag,
  Search,
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  User,
  FileText,
  MessageSquare,
  ChevronDown,
  Clock,
  ShieldAlert,
  AlertCircle,
  X,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminApi } from '../services/adminApi';

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';
export type ReportPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ReportEntityType = 'USER' | 'QUIZ' | 'CONTENT' | 'OTHER';

export interface Report {
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

const ReportModeration: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAdminAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<ReportEntityType | 'ALL'>('ALL');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [iframeEntity, setIframeEntity] = useState<{ type: string; id: string } | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Yêu cầu đăng nhập');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const list = await adminApi.getReports();
      setReports(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách report');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch =
        searchTerm === '' ||
        r.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reporterEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reportedEntityTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.reason.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchType = typeFilter === 'ALL' || r.reportedEntityType === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [reports, searchTerm, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const pending = reports.filter((r) => r.status === 'PENDING').length;
    const resolved = reports.filter((r) => r.status === 'RESOLVED').length;
    const highPriority = reports.filter((r) => r.priority === 'HIGH' && r.status === 'PENDING').length;
    return { pending, resolved, highPriority };
  }, [reports]);

  const handleResolve = async (id: string) => {
    if (!isAuthenticated) return;
    setIsResolving(true);
    try {
      const result = await adminApi.resolveReport(id);
      setReports((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'RESOLVED' as ReportStatus,
                resolvedAt: result?.resolvedAt ?? new Date().toISOString(),
                resolvedBy: result?.resolvedBy ?? 'Admin',
              }
            : r
        )
      );
      setSelectedReport(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể resolve report');
    } finally {
      setIsResolving(false);
    }
  };

  const handleDismiss = async (id: string) => {
    if (!isAuthenticated) return;
    try {
      const result = await adminApi.dismissReport(id);
      setReports((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'DISMISSED' as ReportStatus,
                resolvedAt: result?.resolvedAt ?? new Date().toISOString(),
                resolvedBy: result?.resolvedBy ?? 'Admin',
              }
            : r
        )
      );
      setSelectedReport(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể dismiss report');
    }
  };

  const getPreviewType = (type: ReportEntityType): string => {
    switch (type) {
      case 'USER': return 'user';
      case 'CONTENT': return 'question';
      case 'QUIZ': return 'set';
      default: return 'user';
    }
  };

  const handleEntityClick = (report: Report) => {
    if (report.reportedEntityType === 'OTHER') return;
    const previewType = getPreviewType(report.reportedEntityType);
    setIframeEntity({ type: previewType, id: report.reportedEntityId });
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
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Report Moderation</h1>
          <p className="text-slate-500 mt-1">
            Review and resolve user reports for content, quizzes, and accounts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-56"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50"
            >
              <Filter size={16} />
              {statusFilter === 'ALL' ? 'Status' : statusFilter}
              <ChevronDown size={14} />
            </button>
            {showStatusDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
                <div className="absolute right-0 mt-1 w-40 py-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20">
                  {(['ALL', 'PENDING', 'RESOLVED', 'DISMISSED'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        setShowStatusDropdown(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${statusFilter === s ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowTypeDropdown((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50"
            >
              Type: {typeFilter === 'ALL' ? 'All' : typeFilter}
              <ChevronDown size={14} />
            </button>
            {showTypeDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowTypeDropdown(false)} />
                <div className="absolute right-0 mt-1 w-36 py-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20">
                  {(['ALL', 'USER', 'QUIZ', 'CONTENT', 'OTHER'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setTypeFilter(t);
                        setShowTypeDropdown(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${typeFilter === t ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            onClick={() => { setError(null); fetchReports(); }}
            className="ml-auto text-sm underline hover:no-underline"
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="bg-amber-500 p-3 rounded-xl text-white">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-amber-800 text-sm font-semibold uppercase tracking-wider">Pending</p>
            <h4 className="text-2xl font-bold text-amber-900">{stats.pending}</h4>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="bg-emerald-500 p-3 rounded-xl text-white">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-emerald-800 text-sm font-semibold uppercase tracking-wider">Resolved</p>
            <h4 className="text-2xl font-bold text-emerald-900">{stats.resolved}</h4>
          </div>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="bg-rose-500 p-3 rounded-xl text-white">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-rose-800 text-sm font-semibold uppercase tracking-wider">High priority</p>
            <h4 className="text-2xl font-bold text-rose-900">{stats.highPriority}</h4>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reporter / Reported</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    {searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                      ? 'No reports match your filters.'
                      : 'No reports yet.'}
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => navigate(`/admin/preview/report/${report.id}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{report.reporterName}</span>
                        </div>
                        <p className="text-xs text-slate-500">{report.reporterEmail}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEntityClick(report);
                          }}
                          disabled={report.reportedEntityType === 'OTHER'}
                          className={`text-xs font-medium mt-1 text-left block max-w-full truncate ${
                            report.reportedEntityType === 'OTHER'
                              ? 'text-slate-400 cursor-default'
                              : 'text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer'
                          }`}
                          title={report.reportedEntityType === 'OTHER' ? '' : 'Xem chi tiết'}
                        >
                          → {report.reportedEntityTitle}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                        {getEntityIcon(report.reportedEntityType)}
                        {report.reportedEntityType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 max-w-[180px] truncate" title={report.reason}>
                      {report.reason}
                    </td>
                    <td className="px-6 py-4">{getPriorityBadge(report.priority)}</td>
                    <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(report.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/preview/report/${report.id}`)}
                          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        {report.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleResolve(report.id)}
                              disabled={isResolving}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Resolve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleDismiss(report.id)}
                              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Dismiss"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Report details</h3>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reporter</p>
                <p className="font-medium text-slate-900">{selectedReport.reporterName}</p>
                <p className="text-sm text-slate-500">{selectedReport.reporterEmail}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reported</p>
                <p className="font-medium text-slate-900">{selectedReport.reportedEntityTitle}</p>
                <p className="text-sm text-slate-500">{selectedReport.reportedEntityType} · {selectedReport.reportedEntityId}</p>
                {selectedReport.reportedEntityType !== 'OTHER' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReport(null);
                      handleEntityClick(selectedReport);
                    }}
                    className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                  >
                    <Eye size={14} />
                    Xem chi tiết trong iframe
                  </button>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reason</p>
                <p className="text-slate-700">{selectedReport.reason}</p>
              </div>
              {selectedReport.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-slate-600 text-sm bg-slate-50 rounded-xl p-3">{selectedReport.description}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {getPriorityBadge(selectedReport.priority)}
                {getStatusBadge(selectedReport.status)}
              </div>
              {selectedReport.resolvedAt && (
                <div className="pt-2 border-t border-slate-100 text-sm text-slate-500">
                  Resolved {new Date(selectedReport.resolvedAt).toLocaleString('vi-VN')}
                  {selectedReport.resolvedBy && ` by ${selectedReport.resolvedBy}`}
                </div>
              )}
            </div>
            {selectedReport.status === 'PENDING' && (
              <div className="p-6 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => handleResolve(selectedReport.id)}
                  disabled={isResolving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isResolving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Resolve
                </button>
                <button
                  onClick={() => handleDismiss(selectedReport.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50"
                >
                  <XCircle size={18} />
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
                title="Entity preview"
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

export default ReportModeration;
