import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  UploadCloud, 
  Settings, 
  User,
  LogOut
} from "lucide-react";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const fullName = user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username : "User";
  const initials = user ? ((user.first_name?.[0] || "") + (user.last_name?.[0] || "")).toUpperCase() || user.username?.[0]?.toUpperCase() || "U" : "U";

  const NAV_ITEMS = [
    { label: "Overview", path: "/dashboard", icon: <LayoutDashboard size={18} />, exact: true },
    { label: "Upload Data", path: "/dashboard/upload", icon: <UploadCloud size={18} /> },
    { label: "Customer Segments", path: "/dashboard/segments", icon: <Users size={18} /> },
    { label: "Analytics", path: "/dashboard/analytics", icon: <BarChart3 size={18} /> },
    { label: "Profile", path: "/dashboard/profile", icon: <User size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-surface-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-surface-900 flex flex-col items-stretch border-r border-slate-800 transition-all duration-300 relative z-20">
        
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0 shadow-lg">
            <BarChart3 size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white leading-tight tracking-wide">
            The Segmentation Knight
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-brand-600/10 text-brand-500"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Info & Status */}
        <div className="p-5 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                <User size={14} className="text-slate-300" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">{fullName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Navbar */}
        <header className="h-16 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-800 hidden md:block">
              The Segmentation Knight
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{fullName}</p>
              <p className="text-xs text-slate-500">{user?.email || ''}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold">
              {initials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-surface-50 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full animate-fade-in">
            <Outlet />
          </div>
        </main>
        
      </div>
    </div>
  );
}
