import { healthColor } from "@/data/syntheticData";

export function HealthRing({
  score,
  size = 96,
  stroke = 8,
  label,
  color,
}: {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
  color?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ringColor = color ?? healthColor(score);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            className="stroke-raised-2"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            stroke={ringColor}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - score / 100)}
            style={{ transition: "stroke-dashoffset 0.6s var(--motion-ease)" }}
          />
        </svg>
        <span className="font-display text-display-lg text-fg-primary absolute inset-0 flex items-center justify-center tabular-nums">
          {Math.round(score)}%
        </span>
      </div>
      {label ? <span className="text-body-sm text-fg-tertiary">{label}</span> : null}
    </div>
  );
}
