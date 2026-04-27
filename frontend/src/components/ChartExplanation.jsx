import { Info } from "lucide-react";

export default function ChartExplanation({ title, children }) {
  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div className="flex items-start gap-2 text-xs text-slate-600">
        <Info size={14} className="text-brand-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">{title}:</span> {children}
        </div>
      </div>
    </div>
  );
}
