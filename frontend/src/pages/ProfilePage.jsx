import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { User, Mail, Calendar, Clock, FileText, Download, Eye, Loader2, RefreshCw } from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export default function ProfilePage() {
  const { user } = useAuth();
  const [uploadHistory, setUploadHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchUploadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/upload-history/`);
      setUploadHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch upload history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    setLoading(false);
    fetchUploadHistory();
  }, []);

  const handleViewDataset = (datasetId) => {
    // Navigate to dashboard with this dataset
    window.location.href = `/dashboard?dataset=${datasetId}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (rows) => {
    return `${rows.toLocaleString()} rows`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="text-brand-500 animate-spin" size={32} />
      </div>
    );
  }

  const fullName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username : "User";
  const initials = user ? ((user.first_name?.[0] || "") + (user.last_name?.[0] || "")).toUpperCase() || user.username?.[0]?.toUpperCase() || "U" : "U";

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Profile & History</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account and view upload history</p>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-8 shadow-xl relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold text-white shadow-lg border-4 border-white/30">
            {initials}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold text-white mb-2">{fullName}</h2>
            <div className="flex flex-col md:flex-row items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <span className="text-sm">{user?.email || "N/A"}</span>
              </div>
              <div className="hidden md:block w-1 h-1 rounded-full bg-white/50"></div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span className="text-sm">Member since {new Date().getFullYear()}</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">{uploadHistory.length}</div>
                <div className="text-xs text-white/80 mt-1">Total Uploads</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">
                  {uploadHistory.reduce((sum, u) => sum + u.total_customers, 0).toLocaleString()}
                </div>
                <div className="text-xs text-white/80 mt-1">Total Customers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl font-bold text-white">
                  {uploadHistory.reduce((sum, u) => sum + u.total_rows, 0).toLocaleString()}
                </div>
                <div className="text-xs text-white/80 mt-1">Total Records</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText size={20} className="text-brand-600" />
              Upload History
            </h3>
            <p className="text-xs text-slate-500 mt-1">View and manage your previous data uploads</p>
          </div>
          <button 
            onClick={fetchUploadHistory}
            className="p-2 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {historyLoading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="text-brand-500 animate-spin mb-4" size={32} />
            <p className="text-sm text-slate-500">Loading upload history...</p>
          </div>
        ) : uploadHistory.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <FileText size={24} className="text-slate-400" />
            </div>
            <h4 className="text-base font-semibold text-slate-700 mb-2">No uploads yet</h4>
            <p className="text-sm text-slate-500 mb-6">Start by uploading your first dataset</p>
            <button 
              onClick={() => window.location.href = '/dashboard/upload'}
              className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 font-medium shadow-sm transition-colors"
            >
              Upload Data
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Records
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Customers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {uploadHistory.map((upload, index) => (
                  <tr key={upload.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                          <FileText size={18} className="text-brand-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">{upload.filename}</div>
                          <div className="text-xs text-slate-500">Dataset #{upload.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock size={14} className="text-slate-400" />
                        {formatDate(upload.uploaded_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-700">
                        {upload.total_rows.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-700">
                        {upload.total_customers.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500">
                        {upload.date_range}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDataset(upload.id)}
                          className="px-4 py-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
                          title="View Analysis"
                        >
                          <Eye size={16} />
                          View Analysis
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <User size={16} className="text-slate-600" />
            Account Details
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Username</label>
              <div className="mt-1 text-sm font-medium text-slate-800">{user?.username || "N/A"}</div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">First Name</label>
              <div className="mt-1 text-sm font-medium text-slate-800">{user?.first_name || "N/A"}</div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Last Name</label>
              <div className="mt-1 text-sm font-medium text-slate-800">{user?.last_name || "N/A"}</div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</label>
              <div className="mt-1 text-sm font-medium text-slate-800">{user?.email || "N/A"}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-800 mb-4">Quick Actions</h4>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.href = '/dashboard/upload'}
              className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Upload New Dataset
            </button>
            <button 
              onClick={fetchUploadHistory}
              className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
