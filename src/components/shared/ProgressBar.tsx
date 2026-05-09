interface Props {
  value: number;
  max: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ value, max, label, className = '' }: Props) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between text-sm text-slate-600 mb-1">
          <span>{label}</span>
          <span>
            {value} / {max} ({pct}%)
          </span>
        </div>
      )}
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
