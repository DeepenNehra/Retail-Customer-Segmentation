import { useEffect, useState } from "react";
import { getProfile } from "../services/api";
import { User, Mail, Server, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [apiUrl, setApiUrl] = useState("http://127.0.0.1:8000/api");

  useEffect(() => {
    getProfile()
      .then(data => setProfile(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    setSaving(true);
    setSaveStatus(null);
    
    // Simulate save
    setTimeout(() => {
      localStorage.setItem('apiUrl', apiUrl);
      setSaving(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="text-brand-500 animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="py-6 h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage user preferences and API credentials.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm max-w-3xl">
        <div className="border-b border-slate-100 pb-6 mb-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <User size={18} className="text-slate-600" />
            Profile Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-500" 
                value={profile?.first_name || "N/A"} 
                readOnly 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-500" 
                value={profile?.last_name || "N/A"} 
                readOnly 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail size={14} className="text-slate-500" />
                Email Address
              </label>
              <input 
                type="email" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-500" 
                value={profile?.email || "N/A"} 
                readOnly 
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
            💡 Profile data is read-only. Contact your administrator to update account information.
          </p>
        </div>

        <div>
          <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Server size={18} className="text-slate-600" />
            API Configuration
          </h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Backend Server URL</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow" 
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-2">
              Update this to point to your deployed Django REST instance in production environments.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <CheckCircle2 size={16} />
              Settings saved successfully!
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-sm text-rose-600 font-medium">
              <AlertCircle size={16} />
              Failed to save settings
            </div>
          )}
          {!saveStatus && <div></div>}
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-brand-600 text-white rounded-lg font-semibold text-sm hover:bg-brand-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
