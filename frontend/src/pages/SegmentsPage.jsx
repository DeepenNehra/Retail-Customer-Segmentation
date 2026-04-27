import { Users, Info } from "lucide-react";

export default function SegmentsPage() {
  return (
    <div className="py-6 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Customer Segments</h1>
        <p className="text-sm text-slate-500 mt-1">Detailed definition and criteria for the extracted machine learning segments.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* VIP Segment */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
            <Users size={24} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">VIP Customers</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Top tier clients with the highest monetary value, high frequency of distinct orders, and recent activity.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg flex items-start gap-2 border border-slate-100">
            <Info size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600">Action: Reward with loyalty programs, exclusive early access to products, and premium support.</p>
          </div>
        </div>

        {/* Regular Segment */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-brand-50 flex items-center justify-center mb-4">
            <Users size={24} className="text-brand-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Regular Customers</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Average spenders who purchase steadily. They interact with the brand but haven't reached VIP thresholds.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg flex items-start gap-2 border border-slate-100">
            <Info size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600">Action: Upsell via personalized recommendations and volume discounts to increase Cart Value.</p>
          </div>
        </div>

        {/* At Risk Segment */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center mb-4">
            <Users size={24} className="text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">At Risk</h3>
          <p className="text-sm text-slate-500 mb-6 flex-1">
            Customers with high recency (haven't purchased recently) and low frequency/monetary values.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg flex items-start gap-2 border border-slate-100">
            <Info size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600">Action: Deploy win-back campaigns, aggressive discounts, and targeted email reminders.</p>
          </div>
        </div>
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
