import { useEffect, useState, useMemo } from "react";
import { getCustomers, getPca, getStats } from "../services/api";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "../App.css";

// ─── Constants ───────────────────────────────────────────────────────────────

const CLUSTER_COLORS = { 0: "#3b82f6", 1: "#06b6d4", 2: "#6b7280" };
const PER_PAGE = 5;

const NAV_ITEMS = [
  {
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Customer Segments",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: "Export Data",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
  {
    label: "Settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

// ─── Sparkline bars (decorative mini charts) ─────────────────────────────────
const SPARKLINES = [
  [30, 45, 38, 52, 44, 60, 55, 70, 65, 80],
  [20, 35, 28, 42, 50, 45, 60, 55, 68, 72],
  [50, 42, 55, 48, 60, 52, 65, 58, 72, 68],
  [25, 40, 35, 55, 48, 65, 60, 75, 70, 85],
];

function Sparkline({ data, color }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 32, marginTop: 8 }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${(v / max) * 100}%`,
            borderRadius: 2,
            background: i === data.length - 1 ? color : `${color}40`,
            minHeight: 3,
          }}
        />
      ))}
    </div>
  );
}

// ─── Custom scatter tooltip ───────────────────────────────────────────────────
function ScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: "#0f172a", color: "white", padding: "10px 14px",
      borderRadius: 8, fontSize: 12, lineHeight: 1.7, boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
    }}>
      <div><strong>Cluster {d?.cluster ?? ""}</strong></div>
      <div>PC1: {Number(d?.x).toFixed(3)}</div>
      <div>PC2: {Number(d?.y).toFixed(3)}</div>
    </div>
  );
}

// ─── Cluster badge ────────────────────────────────────────────────────────────
function ClusterBadge({ cluster }) {
  return (
    <span className={`cluster-badge cluster-badge-${cluster}`}>
      Cluster {cluster}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [pcaData, setPcaData]     = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [search, setSearch]       = useState("");
  const [clusterFilter, setClusterFilter] = useState("all");
  const [page, setPage]           = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch all data
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getCustomers(), getPca(), getStats()])
      .then(([cust, pca, st]) => {
        setCustomers(Array.isArray(cust) ? cust : []);
        setPcaData(Array.isArray(pca) ? pca : []);
        setStats(st);
      })
      .catch(() => setError("Failed to connect to backend. Is the Django server running?"))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // Derived stats
  const totalCustomers  = stats?.total_customers  ?? customers.length;
  const activeCustomers = stats?.active_customers ?? customers.filter(c => c.Recency < 90).length;
  const avgMonetary     = stats?.avg_monetary     ?? (customers.length ? customers.reduce((a, c) => a + c.Monetary, 0) / customers.length : 0);
  const totalRevenue    = stats?.total_revenue    ?? customers.reduce((a, c) => a + c.Monetary, 0);

  const formatMoney = (val) => {
    if (!val && val !== 0) return "$0.00";
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    return `$${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCompact = (val) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
    return `$${Number(val).toFixed(2)}`;
  };

  // Filtered customers for table
  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchCluster = clusterFilter === "all" || String(c.Cluster) === clusterFilter;
      const matchSearch  = !search || String(c.CustomerID).toLowerCase().includes(search.toLowerCase());
      return matchCluster && matchSearch;
    });
  }, [customers, clusterFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // PCA grouped by cluster for Recharts
  const pcaByCluster = useMemo(() => {
    const groups = { 0: [], 1: [], 2: [] };
    pcaData.forEach((p) => {
      if (groups[p.cluster] !== undefined) groups[p.cluster].push({ x: p.x, y: p.y, cluster: p.cluster });
    });
    return groups;
  }, [pcaData]);

  // Export CSV
  const handleExportCSV = () => {
    const header = ["CustomerID", "Recency (Days)", "Frequency (Orders)", "Monetary (Spend)", "Cluster Segment"];
    const rows   = filtered.map((c) => [
      c.CustomerID,
      Number(c.Recency).toFixed(2),
      Number(c.Frequency).toFixed(2),
      Number(c.Monetary).toFixed(2),
      `Cluster ${c.Cluster}`,
    ]);
    const csv  = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "customer_segments.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClusterFilterChange = (val) => {
    setClusterFilter(val);
    setPage(1);
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" />
        <p style={{ fontSize: 14, color: "#64748b" }}>Loading dashboard data…</p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="loading-overlay">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style={{ fontSize: 14, color: "#64748b", maxWidth: 360, textAlign: "center" }}>{error}</p>
        <button className="btn btn-primary" onClick={() => setRefreshKey(k => k + 1)}>Retry</button>
      </div>
    );
  }

  // ── Generate page buttons ──────────────────────────────────────────────────
  const getPageButtons = () => {
    const buttons = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) buttons.push(i);
    } else {
      buttons.push(1, 2, 3);
      if (page > 3 && page < totalPages - 1) { buttons.push("…"); buttons.push(page); }
      buttons.push("…");
      buttons.push(totalPages);
    }
    return [...new Set(buttons)];
  };

  // ── Stat cards config ─────────────────────────────────────────────────────
  const statCards = [
    {
      label: "Total Customers",
      value: totalCustomers.toLocaleString(),
      trend: "+12.5% from last month",
      sparkIdx: 0,
      color: "#3b82f6",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: "Active Customers",
      value: activeCustomers.toLocaleString(),
      trend: "+3.2% from last month",
      sparkIdx: 1,
      color: "#06b6d4",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
    },
    {
      label: "Avg. Monetary Value",
      value: formatCompact(avgMonetary),
      trend: "+8.1% from last month",
      sparkIdx: 2,
      color: "#8b5cf6",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
    {
      label: "Total Revenue",
      value: formatMoney(totalRevenue),
      trend: "+15.4% from last month",
      sparkIdx: 3,
      color: "#10b981",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
        </svg>
      ),
    },
  ];

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
          </div>
          <span className="sidebar-logo-text">Retail Customer<br />Segmentation System</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`nav-item${activeNav === item.label ? " active" : ""}`}
              onClick={() => setActiveNav(item.label)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Status */}
        <div className="sidebar-status">
          <p className="sidebar-status-label">System Status</p>
          <div className="status-indicator">
            <div className="status-dot" />
            Backend Connected
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-content">

        {/* Top header bar */}
        <header className="top-header">
          <span className="header-logo-text">Retail Customer Segmentation System</span>
          <div className="header-right">
            <div className="header-bell">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <div className="header-user">
              <div className="header-user-info">
                <p className="header-user-name">Alex Rivera</p>
                <p className="header-user-role">Analytics Manager</p>
              </div>
              <div className="header-avatar">AR</div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
          </div>
        </header>

        {/* Page title row */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Analytics Overview</h1>
            <p className="page-subtitle">Monitor your retail segments and track customer behavior across clusters.</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-outline">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Select Period
            </button>
            <button className="btn btn-primary" onClick={() => setRefreshKey(k => k + 1)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="stats-grid">
          {statCards.map((card, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-card-header">
                <span className="stat-card-label">{card.label}</span>
                <div className="stat-card-icon" style={{ color: card.color }}>{card.icon}</div>
              </div>
              <div className="stat-card-value">{card.value}</div>
              <div className="stat-card-trend">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                </svg>
                {card.trend}
              </div>
              <Sparkline data={SPARKLINES[card.sparkIdx]} color={card.color} />
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label className="filter-label">Cluster Group</label>
            <select
              className="filter-select"
              value={clusterFilter}
              onChange={(e) => handleClusterFilterChange(e.target.value)}
            >
              <option value="all">All Clusters</option>
              <option value="0">Cluster 0</option>
              <option value="1">Cluster 1</option>
              <option value="2">Cluster 2</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Country</label>
            <select className="filter-select" defaultValue="uk">
              <option value="uk">United Kingdom</option>
              <option value="us">United States</option>
              <option value="de">Germany</option>
              <option value="fr">France</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Date Range</label>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 7, background: "white" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span style={{ fontSize: 13, color: "#374151" }}>Jan 2024 – Dec 2024</span>
            </div>
          </div>

          <button className="btn btn-primary" style={{ marginLeft: "auto" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Apply Filters
          </button>
        </div>

        {/* 2D PCA Scatter Chart */}
        <div className="chart-section">
          <div className="chart-header">
            <div>
              <h2 className="section-title">2D PCA Segmentation</h2>
              <p className="section-subtitle">Visualizing high-dimensional customer features into 2D space</p>
            </div>
            <div className="chart-legend">
              {[0, 1, 2].map((c) => (
                <div className="legend-item" key={c}>
                  <div className="legend-dot" style={{ background: CLUSTER_COLORS[c] }} />
                  Cluster {c}
                </div>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                dataKey="x"
                name="PC1"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="PC2"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "#e2e8f0" }} />
              {[0, 1, 2].map((c) => (
                <Scatter
                  key={c}
                  name={`Cluster ${c}`}
                  data={pcaByCluster[c] || []}
                  fill={CLUSTER_COLORS[c]}
                  fillOpacity={0.85}
                  r={5}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Customer table */}
        <div className="table-section">
          <div className="table-header">
            <div className="table-header-left">
              <h3>Detailed Customer Breakdown</h3>
              <p>Drill down into individual customer performance metrics</p>
            </div>
            <div className="table-header-right">
              <div className="search-box">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search Customer ID..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <button className="btn btn-outline" onClick={handleExportCSV}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>CustomerID</th>
                <th>Recency (Days)</th>
                <th>Frequency (Orders)</th>
                <th>Monetary (Spend)</th>
                <th>Cluster Segment</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8", padding: "32px" }}>
                    No customers match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((c, i) => (
                  <tr key={i}>
                    <td>
                      <span className="customer-id-link">C-{String(c.CustomerID).slice(-5)}</span>
                    </td>
                    <td>{Number(c.Recency).toFixed(0)}</td>
                    <td>{Number(c.Frequency).toFixed(0)}</td>
                    <td>{formatMoney(c.Monetary)}</td>
                    <td><ClusterBadge cluster={c.Cluster} /></td>
                    <td>
                      <button className="more-btn" title="More options">···</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <span className="pagination-info">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of{" "}
              <strong>{filtered.length.toLocaleString()}</strong> customers
            </span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹ Previous</button>
              {getPageButtons().map((btn, i) =>
                btn === "…" ? (
                  <span key={`ellipsis-${i}`} style={{ padding: "0 4px", color: "#94a3b8" }}>…</span>
                ) : (
                  <button
                    key={btn}
                    className={`page-btn${page === btn ? " active" : ""}`}
                    onClick={() => setPage(btn)}
                  >
                    {btn}
                  </button>
                )
              )}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next ›</button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <span>© 2026 Retail Customer Segmentation System. All rights reserved.</span>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
}