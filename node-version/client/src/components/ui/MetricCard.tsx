interface MetricCardProps {
  icon: string;
  iconColor?: string;
  label: string;
  value: string | number;
  trend?: {
    value: string;
    type: 'up' | 'down' | 'neutral';
  };
  badgeLabel?: string;
  badgeColor?: string;
  onClick?: () => void;
}

export function MetricCard({
  icon,
  iconColor = 'text-primary',
  label,
  value,
  trend,
  badgeLabel,
  badgeColor = 'text-primary',
  onClick,
}: MetricCardProps) {
  const trendColors = {
    up: 'text-emerald-600',
    down: 'text-error',
    neutral: 'text-slate-400',
  };

  const trendIcons = {
    up: 'trending_up',
    down: 'trending_down',
    neutral: 'trending_flat',
  };

  return (
    <div
      className={`bg-white p-6 rounded-[24px] shadow-sm hover:shadow-md transition-shadow border border-[#F1EFE9] ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 ${iconColor}/10 rounded-2xl ${iconColor}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {badgeLabel && (
          <span className={`text-[10px] font-bold ${badgeColor} tracking-widest uppercase`}>
            {badgeLabel}
          </span>
        )}
      </div>

      <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
      <h3 className="text-2xl font-black tabular-nums text-navy-dark">{value}</h3>

      {trend && (
        <div className={`mt-4 flex items-center gap-2 text-xs font-semibold ${trendColors[trend.type]}`}>
          <span className="material-symbols-outlined text-sm">{trendIcons[trend.type]}</span>
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
}
