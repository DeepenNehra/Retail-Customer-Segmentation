import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDashboardData } from "../services/api";
import ChartCard from "../components/ChartCard";
import { 
  BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell
} from "recharts";
import { TrendingUp, Users, DollarSign, Activity, Loader2, AlertCircle, RefreshCw, Download } from "lucide-react";
import * as XLSX from 'xlsx';

export default function AnalyticsPage() {
  const [searchParams] = useSearchParams();
  const datasetId = searchParams.get('dataset');
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="text-brand-500 animate-spin mb-4" size={40} />
        <p className="text-slate-500 font-medium">Loading advanced analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <AlertCircle className="text-rose-500 mb-4" size={48} />
        <h3 className="text-lg font-bold text-slate-800 mb-2">Failed to Load Analytics</h3>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <button onClick={fetchData} className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 font-medium shadow-sm transition-colors flex items-center gap-2">
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const stats = data.stats;
  const formatMoney = (val) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  // Prepare segment comparison data
  const segmentData = Object.keys(stats.cluster_dist).map(segment => {
    const customers = data.customers.filter(c => c.ClusterLabel === segment);
    const avgRecency = customers.reduce((sum, c) => sum + c.Recency, 0) / customers.length || 0;
    const avgFrequency = customers.reduce((sum, c) => sum + c.Frequency, 0) / customers.length || 0;
    const avgMonetary = customers.reduce((sum, c) => sum + c.Monetary, 0) / customers.length || 0;
    
    return {
      segment,
      count: stats.cluster_dist[segment],
      avgRecency: Math.round(avgRecency),
      avgFrequency: Math.round(avgFrequency),
      avgMonetary: Math.round(avgMonetary),
      totalRevenue: customers.reduce((sum, c) => sum + c.Monetary, 0)
    };
  });

  // Radar chart data for segment profiles
  const radarData = [
    { metric: 'Recency', VIP: 0, Regular: 0, 'At Risk': 0 },
    { metric: 'Frequency', VIP: 0, Regular: 0, 'At Risk': 0 },
    { metric: 'Monetary', VIP: 0, Regular: 0, 'At Risk': 0 }
  ];

  segmentData.forEach(seg => {
    radarData[0][seg.segment] = 100 - (seg.avgRecency / 365 * 100);
    radarData[1][seg.segment] = Math.min(seg.avgFrequency * 10, 100);
    radarData[2][seg.segment] = Math.min(seg.avgMonetary / 100, 100);
  });

  // Customer lifetime value distribution
  const clvBuckets = [
    { range: '$0-500', count: 0 },
    { range: '$500-1K', count: 0 },
    { range: '$1K-2K', count: 0 },
    { range: '$2K-5K', count: 0 },
    { range: '$5K+', count: 0 }
  ];

  data.customers.forEach(c => {
    if (c.Monetary < 500) clvBuckets[0].count++;
    else if (c.Monetary < 1000) clvBuckets[1].count++;
    else if (c.Monetary < 2000) clvBuckets[2].count++;
    else if (c.Monetary < 5000) clvBuckets[3].count++;
    else clvBuckets[4].count++;
  });

  const handleExportAnalytics = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Overall Statistics
    const statsData = [
      { Metric: 'Total Customers', Value: stats.total_customers },
      { Metric: 'Active Customers', Value: stats.active_customers },
      { Metric: 'Average Monetary', Value: stats.avg_monetary.toFixed(2) },
      { Metric: 'Total Revenue', Value: stats.total_revenue.toFixed(2) }
    ];
    const wsStats = XLSX.utils.json_to_sheet(statsData);
    wsStats['!cols'] = [{ wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsStats, 'Overall Statistics');

    // Sheet 2: Segment Summary
    const segmentExport = segmentData.map(s => ({
      'Segment': s.segment,
      'Customer Count': s.count,
      'Avg Recency (days)': s.avgRecency,
      'Avg Frequency (orders)': s.avgFrequency,
      'Avg Monetary': parseFloat(s.avgMonetary.toFixed(2)),
      'Total Revenue': parseFloat(s.totalRevenue.toFixed(2))
    }));
    const wsSegments = XLSX.utils.json_to_sheet(segmentExport);
    wsSegments['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 20 }, { wch: 22 }, { wch: 15 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsSegments, 'Segment Summary');

    // Sheet 3: Top 10 Countries
    if (data.top_countries?.length > 0) {
      const countriesExport = data.top_countries.map(c => ({
        'Country': c.country,
        'Revenue': parseFloat(c.revenue.toFixed(2))
      }));
      const wsCountries = XLSX.utils.json_to_sheet(countriesExport);
      wsCountries['!cols'] = [{ wch: 20 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsCountries, 'Top 10 Countries');
    }

    // Sheet 4: Top 10 Products
    if (data.top_products?.length > 0) {
      const productsExport = data.top_products.map(p => ({
        'Product': p.product,
        'Quantity Sold': p.quantity,
        'Revenue': parseFloat(p.revenue.toFixed(2))
      }));
      const wsProducts = XLSX.utils.json_to_sheet(productsExport);
      wsProducts['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsProducts, 'Top 10 Products');
    }

    // Sheet 5: Top 10 Customers
    if (data.top_customers?.length > 0) {
      const customersExport = data.top_customers.map(c => ({
        'Customer ID': c.customer_id,
        'Total Spent': parseFloat(c.total_spent.toFixed(2))
      }));
      const wsCustomers = XLSX.utils.json_to_sheet(customersExport);
      wsCustomers['!cols'] = [{ wch: 15 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsCustomers, 'Top 10 Customers');
    }

    // Generate Excel file and download
    XLSX.writeFile(wb, `analytics_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Advanced Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Deep dive into customer behavior patterns and segment performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-brand-600 shadow-sm transition-colors" title="Refresh">
            <RefreshCw size={18} />
          </button>
          <button onClick={handleExportAnalytics} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 font-medium shadow-sm transition-colors flex items-center gap-2 text-sm">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Users size={24} className="opacity-80" />
            <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">VIP</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.cluster_dist['VIP'] || 0}</div>
          <div className="text-sm opacity-90">High-Value Customers</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Activity size={24} className="opacity-80" />
            <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">Regular</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.cluster_dist['Regular'] || 0}</div>
          <div className="text-sm opacity-90">Steady Customers</div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp size={24} className="opacity-80" />
            <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">At Risk</span>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.cluster_dist['At Risk'] || 0}</div>
          <div className="text-sm opacity-90">Needs Attention</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <DollarSign size={24} className="opacity-80" />
            <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">Total</span>
          </div>
          <div className="text-3xl font-bold mb-1">{formatMoney(stats.total_revenue)}</div>
          <div className="text-sm opacity-90">Total Revenue</div>
        </div>
      </div>

      {/* Segment Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Segment Revenue Comparison" 
          subtitle="Total revenue by segment"
          explanation="Compares total revenue generated by each segment. VIP customers typically contribute disproportionately high revenue despite smaller numbers."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segmentData} margin={{ top: 20, right: 30, bottom: 50, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="segment" 
                tick={{fontSize: 12, fill: '#64748b'}} 
                axisLine={false} 
                tickLine={false}
                label={{ value: 'Customer Segment', position: 'insideBottom', offset: -10, style: { fontSize: 13, fill: '#475569', fontWeight: 600 } }}
              />
              <YAxis 
                tick={{fontSize: 12, fill: '#64748b'}} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`}
                label={{ value: 'Total Revenue ($)', angle: -90, position: 'insideLeft', offset: -10, style: { fontSize: 13, fill: '#475569', fontWeight: 600, textAnchor: 'middle' } }}
              />
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                formatter={(value) => [formatMoney(value), 'Revenue']}
              />
              <Bar dataKey="totalRevenue" radius={[8, 8, 0, 0]}>
                {segmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.segment === 'VIP' ? '#10b981' : entry.segment === 'Regular' ? '#3b82f6' : '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard 
          title="Customer Count by Segment" 
          subtitle="Number of customers per segment"
          explanation="Shows how many customers are in each segment. This helps you understand the size of each customer group and prioritize resources accordingly."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segmentData} margin={{ top: 20, right: 30, bottom: 50, left: 70 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="segment" 
                tick={{fontSize: 12, fill: '#64748b'}} 
                axisLine={false} 
                tickLine={false}
                label={{ value: 'Customer Segment', position: 'insideBottom', offset: -10, style: { fontSize: 13, fill: '#475569', fontWeight: 600 } }}
              />
              <YAxis 
                tick={{fontSize: 12, fill: '#64748b'}} 
                axisLine={false} 
                tickLine={false}
                label={{ value: 'Number of Customers', angle: -90, position: 'insideLeft', offset: -10, style: { fontSize: 13, fill: '#475569', fontWeight: 600, textAnchor: 'middle' } }}
              />
              <Tooltip 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                formatter={(value) => [value.toLocaleString(), 'Customers']}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {segmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.segment === 'VIP' ? '#10b981' : entry.segment === 'Regular' ? '#3b82f6' : '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Customer Lifetime Value Distribution" 
          subtitle="Customers by spending range"
          explanation="Shows the distribution of customer lifetime value across spending tiers. Most customers are in lower tiers, with fewer high-value customers."
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={clvBuckets} margin={{ top: 20, right: 30, bottom: 50, left: 80 }}>
              <defs>
                <linearGradient id="colorCLV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="range" 
                tick={{fontSize: 12, fill: '#64748b'}} 
                axisLine={false} 
                tickLine={false}
                label={{ value: 'Spending Range', position: 'insideBottom', offset: -10, style: { fontSize: 13, fill: '#475569', fontWeight: 600 } }}
              />
              <YAxis 
                tick={{fontSize: 12, fill: '#64748b'}} 
                axisLine={false} 
                tickLine={false}
                label={{ value: 'Number of Customers', angle: -90, position: 'insideLeft', offset: -10, style: { fontSize: 13, fill: '#475569', fontWeight: 600, textAnchor: 'middle' } }}
              />
              <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCLV)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard 
          title="Average Metrics by Segment" 
          subtitle="RFM averages comparison"
          explanation="Compares average Recency and Frequency across segments. Lower recency (more recent purchases) and higher frequency indicate better engagement."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segmentData} margin={{ top: 20, right: 30, bottom: 60, left: 70 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="segment" 
                tick={{fontSize: 12, fill: '#64748b'}} 
                axisLine={false} 
                tickLine={false}
                label={{ value: 'Customer Segment', position: 'insideBottom', offset: -40, style: { fontSize: 13, fill: '#475569', fontWeight: 600 } }}
              />
              <YAxis 
                tick={{fontSize: 12, fill: '#64748b'}} 
                axisLine={false} 
                tickLine={false}
                label={{ value: 'Average Value', angle: -90, position: 'insideLeft', offset: -10, style: { fontSize: 13, fill: '#475569', fontWeight: 600, textAnchor: 'middle' } }}
              />
              <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Legend 
                wrapperStyle={{fontSize: "12px", paddingTop: "10px"}} 
                iconType="rect"
                verticalAlign="bottom"
                height={36}
              />
              <Bar dataKey="avgRecency" fill="#ef4444" radius={[4, 4, 0, 0]} name="Avg Recency (days)" />
              <Bar dataKey="avgFrequency" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg Frequency" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top 10 Business Insights */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Top 10 Business Insights</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard 
            title="Top 10 Countries by Revenue" 
            subtitle="Geographic performance"
            explanation="Identifies your strongest markets geographically. Allocate marketing budgets to top performers and investigate why certain regions underperform."
          >
            {data.top_countries?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.top_countries} margin={{ top: 20, right: 20, bottom: 70, left: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="country" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{fontSize: 11, fill: '#64748b'}} 
                    axisLine={false} 
                    tickLine={false}
                    label={{ value: 'Country', position: 'insideBottom', offset: -60, style: { fontSize: 13, fill: '#475569', fontWeight: 600 } }}
                  />
                  <YAxis 
                    tick={{fontSize: 12, fill: '#64748b'}} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`}
                    label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft', offset: -10, style: { fontSize: 13, fill: '#475569', fontWeight: 600, textAnchor: 'middle' } }}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                    {data.top_countries.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index < 3 ? '#3b82f6' : '#8b5cf6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No country data available.</div>
            )}
          </ChartCard>

          <ChartCard 
            title="Top 10 Products by Quantity" 
            subtitle="Best-selling items"
            explanation="Your most popular products by units sold. Ensure adequate inventory for these items and feature them prominently in marketing."
          >
            {data.top_products?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data.top_products} 
                  layout="vertical"
                  margin={{ top: 20, right: 30, bottom: 30, left: 180 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis 
                    type="number" 
                    tick={{fontSize: 12, fill: '#64748b'}} 
                    axisLine={false} 
                    tickLine={false}
                    label={{ value: 'Quantity Sold', position: 'insideBottom', offset: -10, style: { fontSize: 13, fill: '#475569', fontWeight: 600 } }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="product" 
                    width={170}
                    tick={{fontSize: 10, fill: '#64748b'}} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value) => [`${value.toLocaleString()} units`, 'Quantity']}
                  />
                  <Bar dataKey="quantity" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No product data available.</div>
            )}
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-6 mt-6">
          <ChartCard 
            title="Top 10 High-Value Customers" 
            subtitle="Your most valuable customers"
            explanation="These customers represent your highest lifetime value. Implement VIP programs, personalized service, and exclusive offers to retain them."
          >
            {data.top_customers?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.top_customers} margin={{ top: 20, right: 30, bottom: 50, left: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="customer_id" 
                    tick={{fontSize: 11, fill: '#64748b'}} 
                    axisLine={false} 
                    tickLine={false}
                    label={{ value: 'Customer ID', position: 'insideBottom', offset: -10, style: { fontSize: 13, fill: '#475569', fontWeight: 600 } }}
                  />
                  <YAxis 
                    tick={{fontSize: 12, fill: '#64748b'}} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`}
                    label={{ value: 'Total Spent ($)', angle: -90, position: 'insideLeft', offset: -10, style: { fontSize: 13, fill: '#475569', fontWeight: 600, textAnchor: 'middle' } }}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Total Spent']}
                  />
                  <Bar dataKey="total_spent" radius={[8, 8, 0, 0]}>
                    {data.top_customers.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index < 3 ? '#10b981' : index < 7 ? '#3b82f6' : '#8b5cf6'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No customer data available.</div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Segment Details Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">Segment Performance Summary</h3>
          <p className="text-xs text-slate-500 mt-1">Detailed breakdown of each customer segment</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Segment</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Customers</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Avg Recency</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Avg Frequency</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Avg Monetary</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {segmentData.map((seg, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                      ${seg.segment === 'VIP' ? 'bg-emerald-100 text-emerald-700' : 
                        seg.segment === 'Regular' ? 'bg-blue-100 text-blue-700' : 
                        'bg-amber-100 text-amber-700'
                      }
                    `}>
                      {seg.segment}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{seg.count}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{seg.avgRecency} days</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{seg.avgFrequency} orders</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{formatMoney(seg.avgMonetary)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600">{formatMoney(seg.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

