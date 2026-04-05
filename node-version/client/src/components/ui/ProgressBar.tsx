interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'success';
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({
  current,
  max,
  label,
  color = 'primary',
  showPercentage = true,
  size = 'md',
}: ProgressBarProps) {
  const percentage = Math.min((current / max) * 100, 100);

  const colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary',
    error: 'bg-error',
    success: 'bg-emerald-600',
  };

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-slate-500 font-medium">{label}</span>
          {showPercentage && (
            <span className="tabular-nums font-semibold text-navy-dark">
              ${current.toLocaleString()} / ${max.toLocaleString()}
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
