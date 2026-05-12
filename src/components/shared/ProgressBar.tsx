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
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="font-serif text-base text-ink">{label}</span>
          <span className="text-xs font-mono text-ink-soft tabular-nums">
            {value} / {max}
            <span className="text-ink-mute"> · </span>
            {pct}%
          </span>
        </div>
      )}
      <div className="h-px bg-line relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-accent transition-all duration-500"
          style={{ width: `${pct}%`, height: '2px', top: '-0.5px' }}
        />
      </div>
    </div>
  );
}
