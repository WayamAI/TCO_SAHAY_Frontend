import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
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
import { KPICard } from "@/components/shared/KPICard";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import { HealthRing } from "@/components/shared/HealthRing";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import { HISTORICAL_TCO, FORECAST_TCO, LOCOMOTIVES, CHART_COLORS } from "@/data/syntheticData";
import { usePartsStore } from "@/store/partsStore";
import { useSimulationStore, formatHorizon } from "@/store/simulationStore";
import { fleetTCO } from "@/utils/tcoEngine";
import { fmtCompact } from "@/utils/formatters";
import { FilterChip, FilterChipGroup } from "@/components/shared/FilterChip";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AppIcon } from "@/components/icons/AppIcon";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center | TCO Intelligence" },
      {
        name: "description",
        content: "Fleet-wide telemetry command center, incident queue, and asset health at a glance.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [viewMode, setViewMode] = useState<"command" | "financial">("command");

  if (viewMode === "command") {
    return (
      <div className="relative">
        <DashboardShell />
        {/* Floating toggle for switching to financial TCO view */}
        <div className="fixed bottom-4 right-4 z-40 hidden xl:flex items-center gap-2 bg-[#141617]/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-xl">
          <span className="text-[11px] text-white/50 font-medium">View Mode:</span>
          <button
            type="button"
            onClick={() => setViewMode("financial")}
            className="text-[11px] font-mono text-white/70 hover:text-white px-2 py-0.5 rounded bg-white/10 hover:bg-white/15 transition-colors"
          >
            Financial Analytics →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-[#090b0c] min-h-screen text-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Financial TCO Breakdown</h1>
        <button
          type="button"
          onClick={() => setViewMode("command")}
          className="text-xs font-medium text-white/80 hover:text-white px-3 py-1.5 rounded-lg bg-[#181a1b] border border-white/10 transition-colors"
        >
          ← Return to Telemetry Command Center
        </button>
      </div>
      <FinancialDashboard />
    </div>
  );
}

const INFLATION_FACTOR = 1.032;

function FinancialDashboard() {
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
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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
        <KPICard
          label="Fleet Availability"
          value={93.6}
          suffix="%"
          decimals={1}
          glow="yellow"
          sub="vs target 95% — watch"
          delay={300}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {/* Historical + forecast chart */}
        <GlassCard className="dot-grid xl:col-span-3" scanline>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Historical + Forecast Cost Timeline</SectionTitle>
            <FilterChipGroup>
              <FilterChip selected={withInflation} onClick={() => setWithInflation(true)}>
                With Inflation
              </FilterChip>
              <FilterChip selected={!withInflation} onClick={() => setWithInflation(false)}>
                Without
              </FilterChip>
            </FilterChipGroup>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="year" stroke={CHART_COLORS.textMuted} fontSize={11} />
              <YAxis
                stroke={CHART_COLORS.textMuted}
                fontSize={11}
                tickFormatter={(v: number) => fmtCompact(v)}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine
                x={2024.5}
                stroke={CHART_COLORS.blue}
                strokeDasharray="4 4"
                label={{
                  value: "FORECAST →",
                  fill: CHART_COLORS.blue,
                  fontSize: 10,
                  position: "top",
                }}
              />
              <Area
                type="monotone"
                dataKey="p90"
                name="P90 band"
                stroke="none"
                fill={CHART_COLORS.blue}
                fillOpacity={0.08}
              />
              <Area
                type="monotone"
                dataKey="p10"
                name="P10 band"
                stroke="none"
                fill={CHART_COLORS.page}
                fillOpacity={0.4}
              />
              <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill={CHART_COLORS.teal} />
              <Bar dataKey="labor" name="Labor" stackId="a" fill={CHART_COLORS.purple} />
              <Bar
                dataKey="consumables"
                name="Consumables"
                stackId="a"
                fill={CHART_COLORS.yellow}
              />
              <Bar dataKey="failures" name="Failures" stackId="a" fill={CHART_COLORS.red} />
              <Bar dataKey="downtime" name="Downtime" stackId="a" fill={CHART_COLORS.orange} />
            </ComposedChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Fleet status */}
        <div className="space-y-3 xl:col-span-2">
          <SectionTitle>Fleet Status</SectionTitle>
          {LOCOMOTIVES.map((l) => (
            <GlassCard key={l.id} className="flex items-center gap-4 py-4">
              <HealthRing score={l.currentHealthScore} size={72} stroke={6} />
              <div className="min-w-0 flex-1">
                <p className="font-display text-display-base text-fg-primary truncate">{l.model}</p>
                <p className="text-body-sm text-fg-tertiary tabular-nums">
                  {l.type} · {l.fleetCount} units · {l.availabilityPct}% avail
                </p>
                <StatusBadge
                  tone={l.status === "Active" ? "success" : "warning"}
                  icon={l.status === "Active" ? "circleDot" : "warning"}
                  className="mt-1.5"
                >
                  {l.status === "Active" ? "Active" : "Maintenance"}
                </StatusBadge>
              </div>
              <Link
                to={l.status === "Active" ? "/simulation" : "/asset-health"}
                className="transition-ui text-label-sm bg-action-secondary text-fg-secondary hover:bg-action-secondary-hover hover:text-fg-primary flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5"
              >
                {l.status === "Active" ? "Open Sim" : "View Risk"}
                <AppIcon name="arrowRight" size="xs" />
              </Link>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Part-level cost breakdown — the visibility the totals were hiding */}
      <GlassCard>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SectionTitle>Part-Level Cost Breakdown — {horizonLabel(horizon)}</SectionTitle>
          <Link
            to="/bom"
            className="transition-ui text-label-sm text-fg-tertiary hover:text-fg-primary flex items-center gap-1"
          >
            All {parts.length} parts
            <AppIcon name="arrowRight" size="xs" />
          </Link>
          <span className="font-mono-data text-label-sm text-fg-tertiary ml-auto flex gap-3 tabular-nums">
            <span>
              Customer <span className="text-warning">{fmtCompact(roll.customerTCO)}</span>
            </span>
            <span>
              Company <span className="text-info">{fmtCompact(roll.organizationTCO)}</span>
            </span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="text-body-sm w-full text-left">
            <thead>
              <tr className="border-default text-caption text-fg-quaternary bg-container sticky top-0 border-b uppercase">
                {[
                  "Part",
                  "Maintenance Cost",
                  "Warranty",
                  "Failure Prob.",
                  "Company Buffer",
                  "Customer Cost",
                  "Company Cost",
                ].map((h) => (
                  <th key={h} className="px-3 py-2 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partRows.map((r) => (
                <tr
                  key={r.part.id}
                  className="border-stroke-muted transition-ui hover:bg-raised-2 border-b"
                >
                  <td className="px-3 py-2.5">
                    <span
                      className="text-fg-primary block max-w-[240px] truncate font-medium"
                      title={r.part.name}
                    >
                      {r.part.name}
                    </span>
                    <span className="font-mono-data text-caption text-fg-quaternary normal-case tracking-normal">
                      every {r.part.maintIntervalValue.toLocaleString()} {r.part.maintIntervalUnit}{" "}
                      · ×{r.part.maintQty} {r.part.uom}
                    </span>
                  </td>
                  <td className="font-mono-data text-fg-primary px-3 py-2.5 tabular-nums">
                    {fmtCompact(r.totalCost)}
                    <span className="text-fg-quaternary ml-1">{r.eventCount}×</span>
                  </td>
                  <td className="font-mono-data text-fg-tertiary px-3 py-2.5">
                    {r.part.warrantyYears}yr / {(r.part.warrantyKm / 1000).toFixed(0)}k km
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <span className="bg-action h-1.5 w-12 overflow-hidden rounded-full">
                        <span
                          className="bg-error-icon block h-full rounded-full"
                          style={{ width: `${Math.min(100, r.part.failureProbabilityPct * 2)}%` }}
                        />
                      </span>
                      <span className="font-mono-data text-fg-secondary tabular-nums">
                        {r.part.failureProbabilityPct}%
                      </span>
                    </span>
                  </td>
                  <td className="font-mono-data text-purple px-3 py-2.5 tabular-nums">
                    {fmtCompact(r.buffer)}
                  </td>
                  <td className="font-mono-data text-warning px-3 py-2.5 tabular-nums">
                    {fmtCompact(r.customerCost)}
                  </td>
                  <td className="font-mono-data text-info px-3 py-2.5 tabular-nums">
                    {fmtCompact(r.companyCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-body-sm text-fg-quaternary mt-2">
          Failure probabilities are trended from hours in service · Company buffer = part cost ×
          failure probability ·{" "}
          <Link
            to="/glossary"
            className="text-fg-tertiary hover:text-fg-primary transition-ui underline underline-offset-2"
          >
            what do these mean?
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
