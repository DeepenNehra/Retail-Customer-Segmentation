import { useState, useEffect } from "react";
import { Users, Info, Download, Loader2, AlertCircle } from "lucide-react";
import { getUploadHistory } from "../services/api";
import axios from "axios";
import { auth } from "../firebase";

const BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost'
    ? "http://127.0.0.1:8000/api"
    : "https://segmentation-knight-backend.onrender.com/api");

const SEGMENTS = [
  {
    key: "VIP",
    label: "VIP Customers",
    colorClass: "bg-emerald-50",
    iconClass: "text-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-700",
    description: "Top tier clients with the highest monetary value, high frequency of distinct orders, and recent activity.",
    action: "Action: Reward with loyalty programs, exclusive early access to products, and premium support.",
  },
  {
    key: "Regular",
    label: "Regular Customers",
    colorClass: "bg-blue-50",
    iconClass: "text-blue-500",
    badgeClass: "bg-blue-100 text-blue-700",
    description: "Average spenders who purchase steadily. They interact with the brand but haven't reached VIP thresholds.",
    action: "Action: Upsell via personalized recommendations and volume discounts to increase Cart Value.",
  },
  {
    key: "At Risk",
    label: "At Risk",
    colorClass: "bg-rose-50",
    iconClass: "text-rose-500",
    badgeClass: "bg-rose-100 text-rose-700",
    description: "Customers with high recency (haven't purchased recently) and low frequency/monetary values.",
    action: "Action: Deploy win-back campaigns, aggressive discounts, and targeted email reminders.",
  },
];

function exportToCSV(customers, segmentLabel) {
  if (!customers || customers.length === 0) return;
  const headers = ["Customer ID", "Recency (days)", "Frequency (orders)", "Monetary (£)", "Segment"];
  const rows = customers.map((c) => [
    c.customer_id,
    c.recency,
    c.frequency,
    Number(c.monetary).toFixed(2),
    c.segment,
  ]);
  const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${segmentLabel.replace(/ /g, "_")}_customers.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function SegmentCard({ segment }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState("");

  const fetchCustomers = async () => {
    if (fetched) {
      exportToCSV(customers, segment.label);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      const headers = user ? { "X-User-ID": user.uid } : {};
      const res = await axios.get(`${BASE_URL}/customers/${encodeURIComponent(segment.key)}/`, { headers });
      setCustomers(res.data);
      setFetched(true);
      exportToCSV(res.data, segment.label);
    } catch (err) {
      setError("No data yet — upload a dataset first.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col shadow-sm">
      <div className={`w-12 h-12 rounded-lg ${segment.colorClass} flex items-center justify-center mb-4`}>
        <Users size={24} className={segment.iconClass} />
      </div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-slate-800">{segment.label}</h3>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${segment.badgeClass}`}>
          {segment.key}
        </span>
      </div>
      <p className="text-sm text-slate-500 mb-6 flex-1">{segment.description}</p>

      <div className="p-3 bg-slate-50 rounded-lg flex items-start gap-2 border border-slate-100 mb-4">
        <Info size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-600">{segment.action}</p>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-500 mb-3">
          <AlertCircle size={13} /> {error}
        </div>
      )}

      <button
        onClick={fetchCustomers}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all
          ${segment.key === 'VIP' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' :
            segment.key === 'Regular' ? 'bg-blue-600 hover:bg-blue-500 text-white' :
            'bg-rose-600 hover:bg-rose-500 text-white'}
          disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <><Loader2 size={14} className="animate-spin" /> Fetching...</>
        ) : (
          <><Download size={14} /> Export {segment.key} to CSV</>
        )}
      </button>
    </div>
  );
}

export default function SegmentsPage() {
  return (
    <div className="py-6 h-full flex flex-col">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customer Segments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Explore segment definitions and export customer lists directly to CSV.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {SEGMENTS.map((seg) => (
          <SegmentCard key={seg.key} segment={seg} />
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4">K-Means Algorithm Details</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          The segmentation engine applies the K-Means clustering algorithm on log-transformed, standard-scaled RFM metrics. The number of optimal clusters (k) defaults to 3 via the elbow method.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Due to the unsupervised nature of the model, the exact centroids mutate based on the raw dataset uploaded, but are automatically labeled dynamically based on the Euclidean centroid's total revenue contribution to maintain consistency in reporting (High Value = VIP).
        </p>
      </div>
    </div>
  );
}
