import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StatCard({ title, value, trend, trendValue, icon, colorClass = "text-brand-500", bgClass = "bg-brand-50" }) {
  const isPositive = trend === "up";
  const isNeutral = trend === "neutral";

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.1)] transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">{title}</h3>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgClass} ${colorClass}`}>
          {icon}
        </div>
      </div>
      
      <div className="mt-auto">
        <p className="text-3xl font-bold text-slate-800 mb-2">{value}</p>
        
        {trend && (
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className={`flex items-center gap-0.5 ${
              isPositive ? "text-emerald-500" : isNeutral ? "text-slate-400" : "text-rose-500"
            }`}>
              {isPositive && <TrendingUp size={14} />}
              {!isPositive && !isNeutral && <TrendingDown size={14} />}
              {isNeutral && <Minus size={14} />}
              {trendValue}
            </span>
            <span className="text-slate-400">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
}
