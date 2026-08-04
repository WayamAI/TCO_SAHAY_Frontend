import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { useState } from "react";
import { KPICard } from "@/components/shared/KPICard";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import { HealthRing } from "@/components/shared/HealthRing";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import { HISTORICAL_TCO, FORECAST_TCO, LOCOMOTIVES, CHART_COLORS } from "@/data/syntheticData";
import { usePartsStore } from "@/store/partsStore";
import { useSimulationStore, formatHorizon } from "@/store/simulationStore";
import { fleetTCO } from "@/utils/tcoEngine";
import { fmtCompact } from "@/utils/formatters";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center | Locomotive Wayam Intelligence" },
      { name: "description", content: "Fleet-wide TCO, forecast accuracy and availability at a glance." },
    ],
  }),
  component: Dashboard,
});

const INFLATION_FACTOR = 1.032;

function Dashboard() {
  const [withInflation, setWithInflation] = useState(true);
  // Horizon and its display unit are driven by the header controls.
  const { params, horizonUnit } = useSimulationStore();
  const horizon = params.N;
  const { parts, laborPct } = usePartsStore();

  const horizonLabel = (h: number) => formatHorizon(h, horizonUnit);

  // Part-level roll-up drives the customer/organization split and the table below.
  const roll = useMemo(() => fleetTCO(parts, horizon, laborPct), [parts, horizon, laborPct]);

  const partRows = useMemo(
    () => [...roll.rows].sort((a, b) => b.totalCost - a.totalCost).slice(0, 12),
    [roll],
  );

  const timeline = useMemo(() => {
    const all = [
      ...HISTORICAL_TCO.map((h) => ({
        year: h.year,
        maintenance: h.maintenance,
        labor: h.labor,
        consumables: h.consumables,
        failures: h.failures,
        downtime: h.downtime,
        forecast: false,
      })),
      ...FORECAST_TCO.map((f, i) => {
        const mult = withInflation ? Math.pow(INFLATION_FACTOR, i + 1) : 1;
        return {
          year: f.year,
          maintenance: f.maintenance * mult,
          labor: f.labor * mult,
          consumables: f.consumables * mult,
          failures: f.failures * mult,
          downtime: f.downtime * mult,
          p10: f.p10 * mult,
          p90: f.p90 * mult,
          forecast: true,
        };
      }),
    ];
    // The horizon selector trims the forecast tail; history always stays visible.
    const lastHistorical = HISTORICAL_TCO[HISTORICAL_TCO.length - 1].year;
    return all.filter((d) => d.year <= lastHistorical + horizon);
  }, [withInflation, horizon]);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KPICard
          label={`Customer TCO (${horizonLabel(horizon)})`}
          value={roll.customerTCO / 1e6}
          prefix="$"
          suffix="M"
          decimals={2}
          glow="blue"
          sub="Warranty-covered failures excluded"
          delay={0}
        />
        <KPICard
          label="Organization TCO"
          value={roll.organizationTCO / 1e6}
          prefix="$"
          suffix="M"
          decimals={2}
          glow="purple"
          sub="Warranty replacement + reserve"
          delay={100}
        />
        <KPICard
          label="Company Buffer"
          value={roll.buffer / 1e3}
          prefix="$"
          suffix="k"
          decimals={1}
          glow="orange"
          sub={<span>Reserve across {parts.length} parts</span>}
          delay={200}
        />
        <KPICard label="Fleet Availability" value={93.6} suffix="%" decimals={1} glow="yellow" sub="vs target 95% — watch" delay={300} />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* Historical + forecast chart */}
        <GlassCard className="dot-grid xl:col-span-3" scanline>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Historical + Forecast Cost Timeline</SectionTitle>
            <div className="flex overflow-hidden rounded-md border border-border text-[11px]">
              <button
                onClick={() => setWithInflation(true)}
                className={withInflation ? "bg-primary px-2.5 py-1 text-primary-foreground" : "bg-surface-2 px-2.5 py-1 text-text-secondary"}
              >
                With Inflation
              </button>
              <button
                onClick={() => setWithInflation(false)}
                className={!withInflation ? "bg-primary px-2.5 py-1 text-primary-foreground" : "bg-surface-2 px-2.5 py-1 text-text-secondary"}
              >
                Without
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="year" stroke={CHART_COLORS.textMuted} fontSize={11} />
              <YAxis stroke={CHART_COLORS.textMuted} fontSize={11} tickFormatter={(v: number) => fmtCompact(v)} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine x={2024.5} stroke={CHART_COLORS.blue} strokeDasharray="4 4" label={{ value: "FORECAST →", fill: CHART_COLORS.blue, fontSize: 10, position: "top" }} />
              <Area type="monotone" dataKey="p90" name="P90 band" stroke="none" fill={CHART_COLORS.blue} fillOpacity={0.08} />
              <Area type="monotone" dataKey="p10" name="P10 band" stroke="none" fill="#04070F" fillOpacity={0.4} />
              <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill={CHART_COLORS.teal} />
              <Bar dataKey="labor" name="Labor" stackId="a" fill={CHART_COLORS.purple} />
              <Bar dataKey="consumables" name="Consumables" stackId="a" fill={CHART_COLORS.yellow} />
              <Bar dataKey="failures" name="Failures" stackId="a" fill={CHART_COLORS.red} />
              <Bar dataKey="downtime" name="Downtime" stackId="a" fill={CHART_COLORS.orange} />
            </ComposedChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Fleet status */}
        <div className="space-y-4 xl:col-span-2">
          <SectionTitle>Fleet Status</SectionTitle>
          {LOCOMOTIVES.map((l) => (
            <GlassCard key={l.id} className="flex items-center gap-4 py-4">
              <HealthRing score={l.currentHealthScore} size={72} stroke={6} />
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-sm font-semibold">{l.model}</p>
                <p className="text-xs text-text-secondary">
                  {l.type} · {l.fleetCount} units · {l.availabilityPct}% avail
                </p>
                <p className={`mt-1 text-[11px] font-semibold ${l.status === "Active" ? "text-teal" : "text-orange"}`}>
                  {l.status === "Active" ? "● Active" : "⚠ Maintenance"}
                </p>
              </div>
              <Link
                to={l.status === "Active" ? "/simulation" : "/asset-health"}
                className="rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                {l.status === "Active" ? "Open Sim →" : "View Risk →"}
              </Link>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Part-level cost breakdown — the visibility the totals were hiding */}
      <GlassCard>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SectionTitle>Part-Level Cost Breakdown — {horizonLabel(horizon)}</SectionTitle>
          <Link to="/bom" className="text-[11px] text-primary hover:underline">
            All {parts.length} parts →
          </Link>
          <span className="font-mono-data ml-auto flex gap-3 text-[10px] text-text-secondary">
            <span>Customer <span className="text-orange">{fmtCompact(roll.customerTCO)}</span></span>
            <span>Company <span className="text-blue">{fmtCompact(roll.organizationTCO)}</span></span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wider text-text-muted">
                {["Part", "Maintenance Cost", "Warranty", "Failure Prob.", "Company Buffer", "Customer Cost", "Company Cost"].map((h) => (
                  <th key={h} className="px-3 py-2.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partRows.map((r) => (
                <tr key={r.part.id} className="border-b border-border/50 transition-colors hover:bg-surface-2/50">
                  <td className="px-3 py-2.5">
                    <span className="block max-w-[240px] truncate font-medium" title={r.part.name}>{r.part.name}</span>
                    <span className="font-mono-data text-[9px] text-text-muted">
                      every {r.part.maintIntervalValue.toLocaleString()} {r.part.maintIntervalUnit} · ×{r.part.maintQty} {r.part.uom}
                    </span>
                  </td>
                  <td className="font-mono-data px-3 py-2.5 tabular-nums">
                    {fmtCompact(r.totalCost)}
                    <span className="ml-1 text-[9px] text-text-muted">{r.eventCount}×</span>
                  </td>
                  <td className="font-mono-data px-3 py-2.5 text-[10px] text-text-secondary">
                    {r.part.warrantyYears}yr / {(r.part.warrantyKm / 1000).toFixed(0)}k km
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-surface-3">
                        <span className="block h-full rounded-full bg-red" style={{ width: `${Math.min(100, r.part.failureProbabilityPct * 2)}%` }} />
                      </span>
                      <span className="font-mono-data tabular-nums">{r.part.failureProbabilityPct}%</span>
                    </span>
                  </td>
                  <td className="font-mono-data px-3 py-2.5 tabular-nums text-purple">{fmtCompact(r.buffer)}</td>
                  <td className="font-mono-data px-3 py-2.5 tabular-nums text-orange">{fmtCompact(r.customerCost)}</td>
                  <td className="font-mono-data px-3 py-2.5 tabular-nums text-blue">{fmtCompact(r.companyCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[10px] text-text-muted">
          Failure probabilities are trended from hours in service · Company buffer = part cost × failure probability ·{" "}
          <Link to="/glossary" className="text-primary hover:underline">what do these mean?</Link>
        </p>
      </GlassCard>
    </div>
  );
}
