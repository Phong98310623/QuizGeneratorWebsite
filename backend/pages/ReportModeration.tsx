
import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  ExternalLink,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Report, ReportStatus } from '../types';
import { GoogleGenAI } from "@google/genai";
import { useAdminAuth } from '../context/AdminAuthContext';
import { API_BASE_URL } from '../config';

// Map API response to Report type
const mapApiReportToReport = (apiReport: any): Report => {
  let status: ReportStatus;
  if (apiReport.status === 'PENDING') {
    status = ReportStatus.PENDING;
  } else if (apiReport.status === 'RESOLVED') {
    status = ReportStatus.RESOLVED;
  } else {
    status = ReportStatus.REJECTED;
  }

  return {
    _id: apiReport.id || apiReport._id,
    reporter_id: apiReport.reporter_id,
    target_user_id: apiReport.target_user_id || undefined,
    question_id: apiReport.question_id || undefined,
    reason: apiReport.reason,
    status,
    resolved_by: apiReport.resolved_by || undefined,
    created_at: apiReport.created_at || new Date().toISOString(),
    resolved_at: apiReport.resolved_at || undefined,
    reporter_name: apiReport.reporter_name || 'Unknown',
    target_name: apiReport.target_name || undefined,
  };
};

const ReportModeration: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { token } = useAdminAuth();

  // Fetch reports from API
  useEffect(() => {
    const fetchReports = async () => {
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/api/reports/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch reports' }));
          throw new Error(errorData.detail || 'Failed to fetch reports');
        }

        const data = await response.json();
        const mappedReports = data.reports.map(mapApiReportToReport);
        setReports(mappedReports);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching reports');
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [token]);

  const handleResolve = async (id: string, status: ReportStatus) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports/status/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_id: id,
          status: status === ReportStatus.RESOLVED ? 'RESOLVED' : 'REJECTED',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to update report status' }));
        throw new Error(errorData.detail || 'Failed to update report status');
      }

      // Update local state
      setReports(reports.map(r => r._id === id ? { ...r, status } : r));
      setSelectedReport(null);
      setAiAnalysis(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating report status');
      console.error('Error updating report status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const analyzeWithAI = async (report: Report) => {
    setIsAiLoading(true);
    setAiAnalysis(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this user report for a quiz platform.
        Report Reason: "${report.reason}"
        Target: ${report.question_id ? 'Question ID: ' + report.question_id : 'User: ' + report.target_name}
        
        Provide a concise recommendation for the moderator (Resolve/Reject/Investigate) and why. Keep it under 100 words.`,
      });
      setAiAnalysis(response.text);
    } catch (error) {
      console.error(error);
      setAiAnalysis("Could not reach AI services. Please proceed with manual review.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const pendingReports = reports.filter(r => r.status === ReportStatus.PENDING);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="lg:col-span-12">
        <h1 className="text-2xl font-bold text-slate-900">Report Queue</h1>
        <p className="text-slate-500">Moderation requests from the community.</p>
      </div>

      {error && (
        <div className="lg:col-span-12 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-rose-600" size={20} />
          <p className="text-rose-800 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="lg:col-span-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex items-center justify-center">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : (
        <>
          <div className="lg:col-span-5 space-y-4">
            {pendingReports.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
            <CheckCircle className="text-emerald-500 mb-3" size={48} />
            <h3 className="font-bold text-slate-900">All clear!</h3>
            <p className="text-slate-500 text-sm">There are no pending reports to review.</p>
          </div>
        ) : (
          pendingReports.map((report) => (
            <div 
              key={report._id} 
              onClick={() => {
                setSelectedReport(report);
                setAiAnalysis(null);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                selectedReport?._id === report._id 
                  ? 'bg-indigo-50 border-indigo-200 shadow-md ring-2 ring-indigo-500/20' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  report.question_id ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {report.question_id ? 'Content' : 'User'} Report
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 line-clamp-1">{report.reason}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[8px]">
                  {report.reporter_name?.charAt(0)}
                </div>
                <span>By {report.reporter_name}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="lg:col-span-7">
        {selectedReport ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full sticky top-4">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Report Details</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleResolve(selectedReport._id, ReportStatus.REJECTED)}
                    disabled={isUpdating}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors ${
                      isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                  <button 
                    onClick={() => handleResolve(selectedReport._id, ReportStatus.RESOLVED)}
                    disabled={isUpdating}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all ${
                      isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        Take Action
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Detailed Reason</label>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-slate-700">
                  "{selectedReport.reason}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Reporter</p>
                  <p className="font-bold text-slate-900">{selectedReport.reporter_name}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Target Object</p>
                  <p className="font-bold text-indigo-600 flex items-center gap-1">
                    {selectedReport.question_id ? `Question #${selectedReport.question_id}` : `User @${selectedReport.target_name}`}
                    <ExternalLink size={12} />
                  </p>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-indigo-200 opacity-20">
                  <Sparkles size={64} />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                    <Sparkles size={18} className="text-indigo-500" />
                    AI Assistant Insight
                  </h4>
                  {!aiAnalysis && !isAiLoading && (
                    <button 
                      onClick={() => analyzeWithAI(selectedReport)}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Run Analysis
                    </button>
                  )}
                </div>

                {isAiLoading ? (
                  <div className="flex flex-col items-center py-4">
                    <Loader2 className="animate-spin text-indigo-600 mb-2" />
                    <p className="text-sm text-indigo-600 font-medium italic">Gemini is analyzing context...</p>
                  </div>
                ) : aiAnalysis ? (
                  <p className="text-sm text-slate-700 leading-relaxed bg-white/60 p-3 rounded-lg border border-indigo-100">
                    {aiAnalysis}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 italic">Get an automated recommendation based on platform history and content rules.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Select a report from the queue to view full context and take action.</p>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default ReportModeration;
