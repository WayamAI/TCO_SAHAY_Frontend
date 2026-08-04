import { createFileRoute } from "@tanstack/react-router";
import {
  ComposedChart,
  Bar,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { X, Star } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import { useSimulationStore } from "@/store/simulationStore";
import { PREDEFINED_SCENARIOS, CHART_COLORS, type Scenario } from "@/data/syntheticData";
import { fmtCompact } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scenarios")({
  head: () => ({
    meta: [
      { title: "Scenario Comparator | Locomotive TCO Intelligence" },
      { name: "description", content: "Compare up to three TCO scenarios side by side with synchronized charts." },
    ],
  }),
  component: ScenarioComparator,
});

function scenarioYearly(s: Scenario) {
  // Simple deterministic yearly cost derived from scenario TCO
  const annual = (s.tco - 2800000) / s.planningHorizonYears;
  return Array.from({ length: 20 }, (_, i) => {
    const t = i + 1;
    const spike = t % 5 === 0 ? 1.55 : t % 2 === 0 ? 1.08 : 0.92;
    return annual * spike * (s.inflationEnabled ? Math.pow(1.032, t) : 1);
  });
}

function ScenarioComparator() {
  const { comparisonScenarios, addComparisonScenario, removeComparisonScenario } = useSimulationStore();

  const yearlySets = comparisonScenarios.map((s) => ({ s, yearly: scenarioYearly(s) }));
  const chartData = Array.from({ length: 20 }, (_, i) => {
    const row: Record<string, number | string> = { year: i + 1 };
    yearlySets.forEach(({ s, yearly }) => {
      row[s.name] = yearly[i];
      row[`${s.name} cum`] = yearly.slice(0, i + 1).reduce((a, b) => a + b, 2800000);
    });
    return row;
  });

  const deltaData = Array.from({ length: 20 }, (_, i) => {
    const row: Record<string, number | string> = { year: i + 1 };
    const base = yearlySets[0];
    yearlySets.slice(1).forEach(({ s, yearly }) => {
      const baseCum = base ? base.yearly.slice(0, i + 1).reduce((a, b) => a + b, 0) : 0;
      row[`${s.name} Δ`] = yearly.slice(0, i + 1).reduce((a, b) => a + b, 0) - baseCum;
    });
    return row;
  });

  const best = comparisonScenarios.reduce(
    (min, s) => (s.tco < min.tco ? s : min),
    comparisonScenarios[0] ?? PREDEFINED_SCENARIOS[0],
  );

  const kpiRows: { label: string; get: (s: Scenario) => string }[] = [
    { label: "Total TCO", get: (s) => fmtCompact(s.tco) },
    { label: "Annual O&M", get: (s) => fmtCompact((s.tco - 2800000) / s.planningHorizonYears) },
    { label: "Cost/km", get: (s) => `$${(s.tco / (240000 * 20)).toFixed(2)}` },
    { label: "Labor Rate", get: (s) => `$${s.laborRate}/hr` },
    { label: "Maint Interval ×", get: (s) => `${s.maintenanceIntervalMultiplier}×` },
    { label: "Failure Rate ×", get: (s) => `${s.failureRateMultiplier}×` },
    { label: "Extra Warranty", get: (s) => `${s.warrantyExtendedYears} yr` },
    { label: "Inflation", get: (s) => (s.inflationEnabled ? "On" : "Off") },
    { label: "Downtime Costs", get: (s) => (s.includeDowntime ? "Included" : "—") },
    { label: "Profile", get: (s) => s.operatingProfile.replace("-", " ") },
  ];

  return (
    <div className="space-y-5">
      {/* Predefined pills */}
      <div className="flex flex-wrap gap-2">
        {PREDEFINED_SCENARIOS.map((s) => {
          const active = comparisonScenarios.some((c) => c.id === s.id);
          return (
            <button
              key={s.id}
              onClick={() => (active ? removeComparisonScenario(s.id) : addComparisonScenario(s))}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                active ? "font-semibold" : "opacity-60 hover:opacity-100",
              )}
              style={{ borderColor: `${s.color}66`, background: active ? `${s.color}22` : "transparent", color: s.color }}
            >
              {s.name}
            </button>
          );
        })}
        <span className="self-center text-[10px] text-text-muted">max 3 active</span>
      </div>

      {/* Active slots */}
      <div className="grid gap-4 md:grid-cols-3">
        {comparisonScenarios.map((s) => (
          <GlassCard key={s.id} className="relative" scanline>
            <button onClick={() => removeComparisonScenario(s.id)} className="absolute right-3 top-3 text-text-muted hover:text-foreground">
              <X size={14} />
            </button>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
              <p className="font-display font-semibold">{s.name}</p>
              {s.id === best.id && <Star size={13} className="text-teal" fill="currentColor" />}
            </div>
            <p className="font-display font-mono-data mt-2 text-2xl font-bold" style={{ color: s.color }}>
              {fmtCompact(s.tco)}
            </p>
            <p className="font-mono-data mt-1 text-[10px] text-text-secondary">
              {s.planningHorizonYears}yr · {s.discountRate}% · ${s.laborRate}/hr · {s.operatingProfile.replace("-", " ")}
            </p>
          </GlassCard>
        ))}
        {comparisonScenarios.length < 3 && (
          <div className="glass-card flex min-h-[120px] items-center justify-center border-dashed text-xs text-text-muted">
            Select a scenario pill above to add ({3 - comparisonScenarios.length} slot{comparisonScenarios.length === 2 ? "" : "s"} free)
          </div>
        )}
      </div>

      {/* Comparison chart */}
      <GlassCard className="dot-grid">
        <SectionTitle className="mb-3">Annual Cost + Cumulative Overlay</SectionTitle>
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis dataKey="year" stroke={CHART_COLORS.textMuted} fontSize={11} />
            <YAxis yAxisId="l" stroke={CHART_COLORS.textMuted} fontSize={11} tickFormatter={(v: number) => fmtCompact(v)} />
            <YAxis yAxisId="r" orientation="right" stroke={CHART_COLORS.textMuted} fontSize={11} tickFormatter={(v: number) => fmtCompact(v)} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {comparisonScenarios.map((s) => (
              <Bar key={s.id} yAxisId="l" dataKey={s.name} fill={s.color} fillOpacity={0.75} />
            ))}
            {comparisonScenarios.map((s) => (
              <Line key={`${s.id}-cum`} yAxisId="r" type="monotone" dataKey={`${s.name} cum`} stroke={s.color} strokeWidth={2} dot={false} strokeDasharray="5 3" />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </GlassCard>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* KPI grid */}
        <GlassCard>
          <SectionTitle className="mb-3">KPI & Parameter Comparison</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase text-text-muted">
                  <th className="py-2 pr-3">Metric</th>
                  {comparisonScenarios.map((s) => (
                    <th key={s.id} className="py-2 pr-3" style={{ color: s.color }}>
                      {s.name} {s.id === best.id ? "★" : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono-data">
                {kpiRows.map((row) => (
                  <tr key={row.label} className="border-b border-border/40">
                    <td className="py-2 pr-3 font-sans text-text-secondary">{row.label}</td>
                    {comparisonScenarios.map((s) => (
                      <td key={s.id} className={cn("py-2 pr-3", s.id === best.id && row.label === "Total TCO" && "rounded bg-teal/10 text-teal")}>
                        {row.get(s)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Delta chart */}
        <GlassCard>
          <SectionTitle className="mb-3">Cumulative Delta vs {comparisonScenarios[0]?.name ?? "Baseline"}</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={deltaData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="year" stroke={CHART_COLORS.textMuted} fontSize={11} />
              <YAxis stroke={CHART_COLORS.textMuted} fontSize={11} tickFormatter={(v: number) => fmtCompact(v)} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {comparisonScenarios.slice(1).map((s) => (
                <Line key={s.id} type="monotone" dataKey={`${s.name} Δ`} stroke={s.color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  );
}
