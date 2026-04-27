export default function ChartCard({ title, subtitle, children, className = "", explanation }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] ${className}`}>
      <div className="p-5 pb-3">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="w-full px-5" style={{ height: '320px' }}>
        {children}
      </div>
      {explanation && (
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-start gap-2 text-xs text-slate-600">
            <svg className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="font-semibold text-slate-700">What this shows:</span> {explanation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

