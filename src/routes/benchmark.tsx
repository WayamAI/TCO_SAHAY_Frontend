import { createFileRoute } from "@tanstack/react-router";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Trophy } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import { COMPETITORS, CHART_COLORS } from "@/data/syntheticData";
import { fmtCompact } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/benchmark")({
  head: () => ({
    meta: [
      { title: "Benchmark Arena | TCO Intelligence" },
      { name: "description", content: "Competitor TCO leaderboard, radar comparison and savings calculator." },
    ],
  }),
  component: Benchmark,
});

function Benchmark() {
  const ranked = [...COMPETITORS].sort((a, b) => a.tco20yr - b.tco20yr);
  const colors: Record<string, string> = {
    "comp-wabtec": CHART_COLORS.blue,
    "comp-ge": CHART_COLORS.orange,
    "comp-alstom": CHART_COLORS.teal,
    "comp-siemens": CHART_COLORS.purple,
  };

  const radarData = [
    { axis: "TCO Score", ...Object.fromEntries(COMPETITORS.map((c) => [c.name, Math.round(100 * (3820000 / c.tco20yr))])) },
    { axis: "Maint Cost", ...Object.fromEntries(COMPETITORS.map((c) => [c.name, Math.round(100 * (0.17 / c.maintenanceCostPerKm))])) },
    { axis: "MTBF", ...Object.fromEntries(COMPETITORS.map((c) => [c.name, Math.round(100 * (c.mtbfHoursEngine / 90000))])) },
    { axis: "PM Interval", ...Object.fromEntries(COMPETITORS.map((c) => [c.name, Math.round(100 * (c.pmIntervalDays / 200))])) },
    { axis: "Warranty", ...Object.fromEntries(COMPETITORS.map((c) => [c.name, Math.round(100 * (c.warrantyYears / 3))])) },
    { axis: "Availability", ...Object.fromEntries(COMPETITORS.map((c) => [c.name, Math.round(c.availabilityPct)])) },
  ];

  const rows: { label: string; get: (c: (typeof COMPETITORS)[0]) => string; best: (c: (typeof COMPETITORS)[0]) => boolean }[] = [
    { label: "Purchase Cost", get: (c) => fmtCompact(c.purchaseCost), best: (c) => c.purchaseCost === Math.min(...COMPETITORS.map((x) => x.purchaseCost)) },
    { label: "20yr TCO", get: (c) => fmtCompact(c.tco20yr), best: (c) => c.tco20yr === Math.min(...COMPETITORS.map((x) => x.tco20yr)) },
    { label: "Maint $/km", get: (c) => `$${c.maintenanceCostPerKm.toFixed(2)}`, best: (c) => c.maintenanceCostPerKm === Math.min(...COMPETITORS.map((x) => x.maintenanceCostPerKm)) },
    { label: "PM Interval", get: (c) => `${c.pmIntervalDays}d`, best: (c) => c.pmIntervalDays === Math.max(...COMPETITORS.map((x) => x.pmIntervalDays)) },
    { label: "Warranty", get: (c) => `${c.warrantyYears}yr`, best: (c) => c.warrantyYears === Math.max(...COMPETITORS.map((x) => x.warrantyYears)) },
    { label: "MTBF Engine", get: (c) => `${c.mtbfHoursEngine.toLocaleString()}hr`, best: (c) => c.mtbfHoursEngine === Math.max(...COMPETITORS.map((x) => x.mtbfHoursEngine)) },
    { label: "10yr Overhaul", get: (c) => fmtCompact(c.overhaul10YrCost), best: (c) => c.overhaul10YrCost === Math.min(...COMPETITORS.map((x) => x.overhaul10YrCost)) },
    { label: "Brake Life", get: (c) => `${c.brakeLifeYears}yr`, best: (c) => c.brakeLifeYears === Math.max(...COMPETITORS.map((x) => x.brakeLifeYears)) },
    { label: "Availability", get: (c) => `${c.availabilityPct}%`, best: (c) => c.availabilityPct === Math.max(...COMPETITORS.map((x) => x.availabilityPct)) },
    { label: "CO₂/km", get: (c) => `${Math.round(c.co2PerKm * 1000)}g`, best: (c) => c.co2PerKm === Math.min(...COMPETITORS.map((x) => x.co2PerKm)) },
  ];

  return (
    <div className="space-y-5">
      {/* Leaderboard */}
      <div className="space-y-2">
        {ranked.map((c, i) => (
          <GlassCard
            key={c.id}
            className={cn("flex items-center gap-4 py-3", c.isOwn && "glow-border border-primary/40")}
            scanline={c.isOwn}
          >
            <span className="font-display w-8 text-center text-lg font-bold text-text-muted">{i + 1}</span>
            {i === 0 && <Trophy size={18} className="text-yellow" />}
            <span className="font-display flex-1 font-semibold">{c.name}</span>
            {i === 0 && <span className="rounded bg-teal/15 px-2 py-0.5 text-[10px] font-bold text-teal">LOWEST TCO</span>}
            <span className="font-mono-data text-lg font-bold" style={{ color: colors[c.id] }}>{fmtCompact(c.tco20yr)}</span>
            <span className="font-mono-data w-24 text-right text-xs text-text-secondary">{c.availabilityPct}% avail</span>
            <span className="text-xs text-yellow">{"★".repeat(Math.round(c.reliabilityAt10yr / 20))}{"☆".repeat(5 - Math.round(c.reliabilityAt10yr / 20))}</span>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <GlassCard>
          <SectionTitle className="mb-2">Six-Axis Radar</SectionTitle>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={CHART_COLORS.grid} />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: CHART_COLORS.textSecondary }} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v}`} />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {COMPETITORS.map((c) => (
                <Radar key={c.id} name={c.name} dataKey={c.name} stroke={colors[c.id]} fill={colors[c.id]} fillOpacity={0.12} strokeWidth={c.isOwn ? 2.5 : 1.5} />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard>
          <SectionTitle className="mb-3">Comparison Table</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase text-text-muted">
                  <th className="py-2 pr-2">Metric</th>
                  {COMPETITORS.map((c) => (
                    <th key={c.id} className="py-2 pr-2" style={{ color: colors[c.id] }}>{c.name.split(" ")[0]}{c.isOwn ? " ★" : ""}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono-data">
                {rows.map((r) => (
                  <tr key={r.label} className="border-b border-border/40">
                    <td className="py-1.5 pr-2 font-sans text-text-secondary">{r.label}</td>
                    {COMPETITORS.map((c) => (
                      <td key={c.id} className={cn("py-1.5 pr-2", r.best(c) && "font-bold text-teal")}>
                        {r.get(c)}{r.best(c) ? " ★" : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-md border border-teal/25 bg-teal/10 p-3 text-xs">
            <span className="font-semibold text-teal">Savings calculator:</span>{" "}
            <span className="text-text-secondary">Wabtec vs GE — over 20 years with 12 locomotives, the fleet saves{" "}</span>
            <span className="font-mono-data font-bold text-teal">$1.92M</span>
            <span className="text-text-secondary"> in TCO.</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
