import { fmtCompact } from "@/utils/formatters";

// Glassmorphism tooltip for Recharts
export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string | number;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const fmt = formatter ?? fmtCompact;
  return (
    <div className="glass-card min-w-[160px] border-primary/25 p-3 text-xs">
      <p className="font-display mb-1.5 font-semibold text-foreground">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-text-secondary">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-mono-data tabular-nums text-foreground">
            {typeof p.value === "number" ? fmt(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
