import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getDashboardData } from "../services/api";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Legend
} from "recharts";
import { RefreshCw, Download, Calendar, Filter, Loader2, AlertCircle, TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import * as XLSX from 'xlsx';

// Colors for VIP, Regular, At Risk
const CLUSTER_COLORS = {
  "VIP": "#10b981",
  "Regular": "#3b82f6",
  "At Risk": "#f59e0b",
};

export default function DashboardHome() {
  const [searchParams] = useSearchParams();
  const datasetId = searchParams.get('dataset');
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [clusterFilter, setClusterFilter] = useState("All");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const fetchData = () => {
    setLoading(true);
    setError(null);
    getDashboardData(datasetId)
      .then(res => setData(res))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [datasetId]);

  // Filtered Table Data
  const customers = data?.customers || [];
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchCluster = clusterFilter === "All" || c.ClusterLabel === clusterFilter;
      const matchSearch = !search || String(c.CustomerID).toLowerCase().includes(search.toLowerCase());
      return matchCluster && matchSearch;
    });
  }, [customers, clusterFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PER_PAGE));
  const paginatedCustomers = filteredCustomers.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleExport = () => {
    // Prepare data for Excel
    const excelData = filteredCustomers.map(c => ({
      'Customer ID': c.CustomerID,
      'Recency (Days)': c.Recency,
      'Frequency (Orders)': c.Frequency,
      'Monetary (Spend)': parseFloat(c.Monetary.toFixed(2)),
      'Segment Label': c.ClusterLabel
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Customer ID
      { wch: 18 }, // Recency
      { wch: 20 }, // Frequency
      { wch: 18 }, // Monetary
      { wch: 18 }  // Segment Label
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Segmentation');

    // Generate Excel file and download
    XLSX.writeFile(wb, `customer_segmentation_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="text-brand-500 animate-spin mb-4" size={40} />
        <p className="text-slate-500 font-medium">Loading intelligence board...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <AlertCircle className="text-rose-500 mb-4" size={48} />
        <h3 className="text-lg font-bold text-slate-800 mb-2">Connection Error</h3>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <button onClick={fetchData} className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 font-medium shadow-sm transition-colors flex items-center gap-2">
          <RefreshCw size={16} /> Retry Connection
        </button>
      </div>
    );
  }

  if (!data) return null;

  const stats = data.stats;
  const formatMoney = (val) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  // Chart Data preparation
  const pcaGroups = {};
  data.pca.forEach(p => {
    if (!pcaGroups[p.label]) pcaGroups[p.label] = [];
    pcaGroups[p.label].push(p);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time ML customer segmentation and behavioral insights.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 shadow-sm">
            <Calendar size={16} className="text-slate-400" />
            <span>All Time</span>
          </div>
          <button onClick={fetchData} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-brand-600 shadow-sm transition-colors" title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Customers" 
          value={stats.total_customers.toLocaleString()} 
          trend="up" trendValue="12.5%" 
          bgClass="bg-brand-50" colorClass="text-brand-600"
          icon={<Users size={20} />} 
        />
        <StatCard 
          title="Active Customers" 
          value={stats.active_customers.toLocaleString()} 
          trend="up" trendValue="4.2%" 
          bgClass="bg-emerald-50" colorClass="text-emerald-600"
          icon={<Activity size={20} />} 
        />
        <StatCard 
          title="Avg Monetary" 
          value={formatMoney(stats.avg_monetary)} 
          trend="neutral" trendValue="0.0%" 
          bgClass="bg-accent-50" colorClass="text-accent-600"
          icon={<TrendingUp size={20} />} 
        />
        <StatCard 
          title="Total Revenue" 
          value={formatMoney(stats.total_revenue)} 
          trend="up" trendValue="8.1%" 
          bgClass="bg-sky-50" colorClass="text-sky-600"
          icon={<DollarSign size={20} />} 
        />
      </div>

      {/* Primary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="2D PCA Segmentation" 
          subtitle="Customer clusters in 2D space"
          explanation="Uses Principal Component Analysis to visualize 3D customer data (Recency, Frequency, Monetary) in 2D space. Each dot is a customer, colored by segment."
          className="relative"
        >
          <div className="absolute top-6 right-6 flex gap-3 text-xs font-medium z-10">
            {Object.keys(CLUSTER_COLORS).map(lbl => (
              <div key={lbl} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CLUSTER_COLORS[lbl] }}></span>
                <span className="text-slate-600">{lbl}</span>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 70 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="PC1" 
                tick={{fontSize: 12, fill: '#64748b'}} 
                axisLine={false} 
                tickLine={false}
                label={{ value: 'Principal Component 1', position: 'insideBottom', offset: -40, style: { fontSize: 13, fill: '#475569', fontWeight: 600 } }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="PC2" 
                tick={{fontSize: 12, fill: '#64748b'}} 
                axisLine={false} 
                tickLine={false}
                label={{ value: 'Principal Component 2', angle: -90, position: 'insideLeft', offset: -10, style: { fontSize: 13, fill: '#475569', fontWeight: 600, textAnchor: 'middle' } }}
              />
              <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              {Object.keys(pcaGroups).map((label) => (
                <Scatter key={label} name={label} data={pcaGroups[label]} fill={CLUSTER_COLORS[label] || "#cbd5e1"}>
                  {pcaGroups[label].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CLUSTER_COLORS[label] || "#cbd5e1"} opacity={0.6} />
                  ))}
                </Scatter>
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard 
          title="Monthly Sales Trend" 
          subtitle="Revenue over time"
          explanation="Tracks total revenue month-by-month. Identify seasonal patterns, growth trends, and periods that need promotional support."
        >
          {data.monthly_sales?.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={data.monthly_sales} margin={{ top: 20, right: 20, bottom: 50, left: 100 }}>
                 <defs>
                   <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                 <XAxis 
                   dataKey="month" 
                   tick={{fontSize: 11, fill: '#64748b'}} 
                   axisLine={false} 
                   tickLine={false}
                   label={{ value: 'Month', position: 'insideBottom', offset: -10, style: { fontSize: 13, fill: '#475569', fontWeight: 600 } }}
                 />
                 <YAxis 
                   tick={{fontSize: 12, fill: '#64748b'}} 
                   axisLine={false} 
                   tickLine={false} 
                   tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`}
                   label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft', style: { fontSize: 13, fill: '#475569', fontWeight: 600, marginRight:200 } }}
                 />
                 <Tooltip 
                   contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                   formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                 />
                 <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
               </AreaChart>
             </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No time-series data available in dataset.</div>
          )}
        </ChartCard>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard 
          title="Cluster Distribution" 
          subtitle="Proportion per segment"
          explanation="Shows how customers are divided across segments. A healthy distribution has more VIP/Regular than At Risk."
        >
           <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={Object.keys(stats.cluster_dist).map(k => ({ name: k, value: stats.cluster_dist[k] }))}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5}
                  dataKey="value" stroke="none"
                >
                  {Object.keys(stats.cluster_dist).map((key, index) => (
                    <Cell key={`cell-${index}`} fill={CLUSTER_COLORS[key] || "#cbd5e1"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: "12px"}} />
              </PieChart>
           </ResponsiveContainer>
        </ChartCard>

        <ChartCard 
          title="Elbow Method (K-Means)" 
          subtitle="Optimal K selection"
          explanation="Shows the 'elbow' point where adding more clusters doesn't significantly improve grouping. The bend at K=3 indicates 3 segments is optimal."
        >
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={data.elbow} margin={{ top: 20, right: 20, bottom: 50, left: 50 }}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
               <XAxis 
                 dataKey="k" 
                 tick={{fontSize: 12, fill: '#64748b'}} 
                 axisLine={false} 
                 tickLine={false}
                 label={{ value: 'Number of Clusters (K)', position: 'insideBottom', offset: -10, style: { fontSize: 13, fill: '#475569', fontWeight: 600 } }}
               />
               <YAxis 
                 tick={{fontSize: 12, fill: '#64748b'}} 
                 axisLine={false} 
                 tickLine={false}
                 label={{ value: 'Inertia', angle: -90, position: 'insideLeft', style: { fontSize: 13, fill: '#475569', fontWeight: 600 } }}
               />
               <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
               <Line type="monotone" dataKey="inertia" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
             </LineChart>
           </ResponsiveContainer>
        </ChartCard>

        <ChartCard 
          title="Monetary Distribution" 
          subtitle="Customer spending ranges"
          explanation="Distribution of customer spending across different ranges. Most customers fall in lower ranges, while high-value customers are in the tail."
        >
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={data.rfm_distribution?.monetary || []} margin={{ top: 20, right: 20, bottom: 50, left: 50 }}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
               <XAxis 
                 dataKey="range" 
                 tick={{fontSize: 10, fill: '#64748b'}} 
                 axisLine={false} 
                 tickLine={false}
                 label={{ value: 'Spending Range', position: 'insideBottom', offset: -10, style: { fontSize: 13, fill: '#475569', fontWeight: 600 } }}
               />
               <YAxis 
                 tick={{fontSize: 12, fill: '#64748b'}} 
                 axisLine={false} 
                 tickLine={false}
                 label={{ value: 'Customer Count', angle: -90, position: 'insideLeft', style: { fontSize: 13, fill: '#475569', fontWeight: 600 } }}
               />
               <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
               <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
             </BarChart>
           </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Customer Records</h3>
            <p className="text-xs text-slate-500 mt-1">Detailed breakdown of individual metrics and segment labels.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                value={clusterFilter} 
                onChange={e => {setClusterFilter(e.target.value); setPage(1);}}
                className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-shadow appearance-none cursor-pointer"
              >
                <option value="All">All Segments</option>
                {data.label_map && Object.values(data.label_map).map(lbl => (
                  <option key={lbl} value={lbl}>{lbl}</option>
                ))}
              </select>
            </div>
            <input 
              type="text" 
              placeholder="Search ID..." 
              value={search}
              onChange={e => {setSearch(e.target.value); setPage(1);}}
              className="w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-shadow"
            />
            <button onClick={handleExport} className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-colors tooltip flex-shrink-0" title="Export CSV">
              <Download size={18} />
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto table-container">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Recency (Days)</th>
                <th>Frequency (Orders)</th>
                <th>Monetary (Spend)</th>
                <th>Segment Label</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400">No customers found matching criteria.</td></tr>
              ) : (
                paginatedCustomers.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="font-mono text-brand-600 font-medium">{c.CustomerID}</td>
                    <td>{c.Recency}</td>
                    <td>{c.Frequency}</td>
                    <td className="font-medium text-slate-700">{formatMoney(c.Monetary)}</td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                        ${c.ClusterLabel === 'VIP' ? 'bg-emerald-100 text-emerald-700' : 
                          c.ClusterLabel === 'Regular' ? 'bg-blue-100 text-blue-700' : 
                          'bg-amber-100 text-amber-700'
                        }
                      `}>
                        {c.ClusterLabel}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
          <span>Showing {paginatedCustomers.length > 0 ? (page - 1) * PER_PAGE + 1 : 0} to {Math.min(page * PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length} results</span>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-white transition-colors"
            >
              Previous
            </button>
            <span className="font-medium px-2 text-slate-700">Page {page} of {totalPages}</span>
            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-white transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}





