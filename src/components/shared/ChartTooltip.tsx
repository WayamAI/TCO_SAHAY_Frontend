import { fmtCompact } from "@/utils/formatters";

// Recharts tooltip — raised-x2 surface so it reads above cards, no blur.
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
    <div className="bg-raised-2 border-default text-body-sm min-w-[160px] rounded-lg border p-2.5 shadow-lg">
      <p className="font-display text-display-base text-fg-primary mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <span className="text-fg-tertiary flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-mono-data text-fg-primary tabular-nums">
            {typeof p.value === "number" ? fmt(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
