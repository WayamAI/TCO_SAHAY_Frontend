import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import CountUp from "@/components/shared/CountUp";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Treemap,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import { SliderRow, ToggleRow } from "@/components/shared/Controls";
import { MaintenanceAnalytics, MaintDriverSummary } from "@/components/simulation/MaintenanceAnalytics";
import { useSimulationStore } from "@/store/simulationStore";
import {
  LOCOMOTIVES,
  OPERATING_PROFILES,
  COMPONENTS,
  SYSTEMS,
  ASSEMBLIES,
  RELIABILITY_CURVE_DATA,
  CHART_COLORS,
} from "@/data/syntheticData";
import { SENSITIVITY_DATA, runTCOSimulation, weibullFailureProb } from "@/utils/simulationEngine";
import { usePartsStore } from "@/store/partsStore";
import { partTCO, fleetTCO, eventPartsCost, formatInterval } from "@/utils/tcoEngine";
import { fmtCompact, fmtUSD } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/simulation")({
  head: () => ({
    meta: [
      { title: "TCO Simulation Playground | Locomotive TCO Intelligence" },
      { name: "description", content: "Interactive lifecycle cost simulation with Weibull reliability, inflation and downtime modeling." },
    ],
  }),
  component: SimulationPlayground,
});

const TABS = ["Cumulative TCO", "Annual Breakdown", "By Component", "Sensitivity", "Inflation Impact"] as const;

function SimulationPlayground() {
  const { params, setParams, result } = useSimulationStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Cumulative TCO");
  const profile = OPERATING_PROFILES.find((p) => p.id === params.operatingProfile) ?? OPERATING_PROFILES[0];

  const kpis = [
    { l: "Total TCO", v: result.totalTCO, fmt: (v: number) => fmtCompact(v) },
    { l: "Customer TCO", v: result.split.customerTCO, fmt: (v: number) => fmtCompact(v) },
    { l: "Organization TCO", v: result.split.organizationTCO, fmt: (v: number) => fmtCompact(v) },
    { l: "Annual Avg", v: result.financials.annualAvg, fmt: (v: number) => fmtCompact(v) },
    { l: "Cost / km", v: result.financials.costPerKm, fmt: (v: number) => `$${v.toFixed(2)}` },
    { l: "Availability", v: result.availability.availabilityPct, fmt: (v: number) => `${v.toFixed(1)}%` },
  ];

  const donutData = [
    { name: "Capital", value: result.breakdown.capital, color: CHART_COLORS.blue },
    { name: "Maintenance", value: result.breakdown.maintenance, color: CHART_COLORS.teal },
    { name: "Replacements", value: result.breakdown.replacements, color: CHART_COLORS.purple },
    { name: "Consumables", value: result.breakdown.consumables, color: CHART_COLORS.yellow },
    { name: "Failures", value: result.breakdown.failures, color: CHART_COLORS.red },
    { name: "Downtime", value: result.breakdown.downtime, color: CHART_COLORS.green },
  ].filter((d) => d.value > 0);

  return (
    <div className="grid gap-5 xl:grid-cols-[280px_1fr] 2xl:grid-cols-[320px_1fr]">
      {/* ───── LEFT: Control tower ───── */}
      <div className="space-y-4">
        <GlassCard>
          <SectionTitle className="mb-3">Locomotive</SectionTitle>
          <div className="space-y-2">
            {LOCOMOTIVES.map((l) => (
              <button
                key={l.id}
                onClick={() => setParams({ locomotiveId: l.id })}
                className={cn(
                  "w-full rounded-lg border p-2.5 text-left text-xs transition-colors",
                  params.locomotiveId === l.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/40",
                )}
              >
                <p className="font-display font-semibold">{l.model.split(" ").slice(0, 2).join(" ")}</p>
                <p className="text-[10px] text-text-secondary">
                  {l.horsepower}hp · {fmtCompact(l.purchaseCost)} · {l.fuelType}
                </p>
              </button>
            ))}
          </div>
          <SectionTitle className="mb-2 mt-4">Operating Profile</SectionTitle>
          <div className="grid grid-cols-2 gap-1.5">
            {OPERATING_PROFILES.map((p) => (
              <button
                key={p.id}
                onClick={() => setParams({ operatingProfile: p.id })}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-[10px] transition-colors",
                  params.operatingProfile === p.id
                    ? "border-primary bg-primary/15 font-semibold text-primary"
                    : "border-border text-text-secondary hover:text-foreground",
                )}
                title={p.description}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="font-mono-data mt-2 rounded-md bg-surface-2 p-2 text-[10px] text-text-secondary">
            Wear ×{profile.wearMultiplier} · Maint ×{profile.maintenanceFreqMultiplier} · Risk ×{profile.failureProbMultiplier}
          </div>
        </GlassCard>

        <GlassCard className="space-y-3.5">
          <SectionTitle>Planning</SectionTitle>
          <SliderRow label="Planning Horizon" min={5} max={30} value={params.N} display={`${params.N} yr`} onChange={(v) => setParams({ N: v })} />
          <SliderRow label="Labor Rate" min={60} max={180} value={params.laborRatePerHour} display={`$${params.laborRatePerHour}/hr`} onChange={(v) => setParams({ laborRatePerHour: v })} />
        </GlassCard>

        <MaintenancePartCard />

        <GlassCard className="space-y-3.5">
          <SectionTitle>Maintenance & Reliability</SectionTitle>
          <SliderRow label="Maint Interval ×" min={0.5} max={2} step={0.05} value={params.maintenanceIntervalMultiplier} display={`${params.maintenanceIntervalMultiplier.toFixed(2)}×`} onChange={(v) => setParams({ maintenanceIntervalMultiplier: v })} />
          <SliderRow label="Failure Rate ×" min={0.5} max={3} step={0.05} value={params.failureRateMultiplier} display={`${params.failureRateMultiplier.toFixed(2)}×`} onChange={(v) => setParams({ failureRateMultiplier: v })} />
          <SliderRow label="MTTR ×" min={0.5} max={2} step={0.05} value={params.mttrMultiplier} display={`${params.mttrMultiplier.toFixed(2)}×`} onChange={(v) => setParams({ mttrMultiplier: v })} />
          <SliderRow label="Extended Warranty" min={0} max={5} value={params.warrantyExtendedYears} display={`+${params.warrantyExtendedYears} yr`} onChange={(v) => setParams({ warrantyExtendedYears: v })} />
          <SliderRow label="Consumable Qty ×" min={0.5} max={2} step={0.05} value={params.consumableQtyMultiplier} display={`${params.consumableQtyMultiplier.toFixed(2)}×`} onChange={(v) => setParams({ consumableQtyMultiplier: v })} />
        </GlassCard>

        <GlassCard className="space-y-2">
          <SectionTitle>Inflation & Inclusions</SectionTitle>
          <ToggleRow label="Inflation modeling" value={params.inflationEnabled} onChange={(v) => setParams({ inflationEnabled: v })} />
          {params.inflationEnabled && (
            <div className="space-y-3 pb-1 pt-1">
              <SliderRow label="Labor escalation" min={0} max={8} step={0.1} value={params.inflationLabor} display={`${params.inflationLabor.toFixed(1)}%/yr`} onChange={(v) => setParams({ inflationLabor: v })} />
              <SliderRow label="Spare parts" min={0} max={6} step={0.1} value={params.inflationParts} display={`${params.inflationParts.toFixed(1)}%/yr`} onChange={(v) => setParams({ inflationParts: v })} />
            </div>
          )}
          <ToggleRow label="Include downtime costs" value={params.includeDowntime} onChange={(v) => setParams({ includeDowntime: v })} />
          {params.inflationEnabled && (
            <p className="font-mono-data rounded bg-surface-2 p-2 text-[10px] text-yellow">
              Labor: ${params.laborRatePerHour}/hr → ${Math.round(params.laborRatePerHour * Math.pow(1 + params.inflationLabor / 100, 10))}/hr by Year 10
            </p>
          )}
        </GlassCard>
      </div>

      {/* ───── RIGHT: Results canvas (KPIs, charts, intelligence & analytics) ───── */}
      <div className="space-y-4 min-w-0">
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {kpis.map((k, i) => (
            <div key={k.l} className="glass-card animate-fade-up p-2.5 text-center" style={{ animationDelay: `${i * 60}ms` }}>
              <p className="text-[9px] uppercase tracking-wider text-text-muted">{k.l}</p>
              <p className="font-display font-mono-data mt-1 text-sm font-bold text-foreground tabular-nums">{k.fmt(k.v)}</p>
            </div>
          ))}
        </div>

        <TCOSplitCard />

        <MaintDriverSummary />

        <GlassCard className="dot-grid min-w-0" scanline>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] transition-colors",
                  tab === t ? "bg-primary font-semibold text-primary-foreground" : "bg-surface-2 text-text-secondary hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <ChartArea tab={tab} />
        </GlassCard>

        {/* Output intelligence — tiled to fill the canvas */}
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          <GlassCard>
            <SectionTitle className="mb-2">Cost Breakdown</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} strokeWidth={0}>
                  {donutData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
          <GlassCard>
            <SectionTitle className="mb-2">Weibull Reliability vs Competitors</SectionTitle>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={RELIABILITY_CURVE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="year" stroke={CHART_COLORS.textMuted} fontSize={10} label={{ value: "Years", fontSize: 9, fill: CHART_COLORS.textMuted, position: "insideBottom", offset: -2 }} />
                <YAxis stroke={CHART_COLORS.textMuted} fontSize={10} unit="%" />
                <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="es44ac" name="ES44AC" stroke={CHART_COLORS.blue} dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="ge_t4" name="GE T4" stroke={CHART_COLORS.orange} dot={false} strokeDasharray="5 3" />
                <Line type="monotone" dataKey="siemens" name="Siemens" stroke={CHART_COLORS.purple} dot={false} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>
          <CostBySystem />
          <RiskMatrix />
          <GlassCard className="border-teal/25">
            <div className="flex items-center justify-between">
              <SectionTitle>Optimization Insight</SectionTitle>
              <span className="font-mono-data text-[10px] font-bold text-teal">92% CONF</span>
            </div>
            <p className="font-display mt-2 text-sm font-semibold">Extend brake PM interval 6 → 8 months</p>
            <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">
              <span className="font-semibold text-foreground">WHY:</span> Weibull β=3.5 shows wear-out begins at 7,200 hrs. Current 5,500hr trigger is 24% earlier than required.
            </p>
            <div className="font-mono-data mt-3 space-y-1 rounded-md bg-surface-2 p-2.5 text-[10px]">
              <p className="text-teal">Impact: save $84,000 over 20 years</p>
              <p className="text-text-secondary">Reliability change: −0.8% (negligible)</p>
              <p className="text-text-secondary">Availability change: +0.3%</p>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setParams({ maintenanceIntervalMultiplier: Math.min(2, params.maintenanceIntervalMultiplier * 1.33) })}
                className="flex-1 rounded-md bg-teal/15 px-2 py-1.5 text-[11px] font-semibold text-teal transition-colors hover:bg-teal/25"
              >
                Apply
              </button>
              <button className="flex-1 rounded-md border border-border px-2 py-1.5 text-[11px] text-text-secondary hover:text-foreground">
                Simulate First
              </button>
            </div>
          </GlassCard>
          <GlassCard>
            <SectionTitle className="mb-3">Availability Metrics</SectionTitle>
            <div className="font-mono-data space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-text-secondary">MTTR (avg)</span><span>{result.availability.mttrAvg.toFixed(1)} hrs</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">MTBF (fleet avg)</span><span>{Math.round(result.availability.mtbfFleetAvg).toLocaleString()} hrs</span></div>
              <div className="flex justify-between"><span className="text-text-secondary">Availability</span><span className="text-teal">{result.availability.availabilityPct.toFixed(2)}%</span></div>
            </div>
            <p className="mt-2 text-[10px] text-text-muted">A = MTBF / (MTBF + MTTR)</p>
          </GlassCard>
        </div>

        {/* Component & consumable analytics — full width of the canvas */}
        <MaintenanceAnalytics />
      </div>
    </div>
  );
}

function ChartArea({ tab }: { tab: string }) {
  const { params, result } = useSimulationStore();

  if (tab === "Cumulative TCO") {
    return (
      <ResponsiveContainer width="100%" height={340}>
        <AreaChart data={result.yearlyBreakdown}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="year" stroke={CHART_COLORS.textMuted} fontSize={11} />
          <YAxis stroke={CHART_COLORS.textMuted} fontSize={11} tickFormatter={(v: number) => fmtCompact(v)} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="maintenance" name="Maintenance" stackId="1" stroke={CHART_COLORS.teal} fill={CHART_COLORS.teal} fillOpacity={0.5} />
          <Area type="monotone" dataKey="replacement" name="Replacements" stackId="1" stroke={CHART_COLORS.purple} fill={CHART_COLORS.purple} fillOpacity={0.5} />
          <Area type="monotone" dataKey="consumables" name="Consumables" stackId="1" stroke={CHART_COLORS.yellow} fill={CHART_COLORS.yellow} fillOpacity={0.5} />
          <Area type="monotone" dataKey="failures" name="Failures" stackId="1" stroke={CHART_COLORS.red} fill={CHART_COLORS.red} fillOpacity={0.5} />
          <Area type="monotone" dataKey="downtime" name="Downtime" stackId="1" stroke={CHART_COLORS.blue} fill={CHART_COLORS.blue} fillOpacity={0.4} />
          <Area type="monotone" dataKey="warranty" name="Warranty offset" stroke={CHART_COLORS.green} fill={CHART_COLORS.green} fillOpacity={0.25} strokeDasharray="4 3" />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (tab === "Annual Breakdown") {
    return (
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={result.yearlyBreakdown}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="year" stroke={CHART_COLORS.textMuted} fontSize={11} />
          <YAxis stroke={CHART_COLORS.textMuted} fontSize={11} tickFormatter={(v: number) => fmtCompact(v)} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill={CHART_COLORS.teal} />
          <Bar dataKey="replacement" name="Replacements" stackId="a" fill={CHART_COLORS.purple} />
          <Bar dataKey="consumables" name="Consumables" stackId="a" fill={CHART_COLORS.yellow} />
          <Bar dataKey="failures" name="Failures" stackId="a" fill={CHART_COLORS.red} />
          <Bar dataKey="downtime" name="Downtime" stackId="a" fill={CHART_COLORS.blue} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (tab === "By Component") {
    const treeData = COMPONENTS.map((c) => ({
      name: c.name,
      size: c.replacementCost * Math.max(1, Math.floor(params.N / c.lifeYears)),
    }));
    return (
      <ResponsiveContainer width="100%" height={340}>
        <Treemap data={treeData} dataKey="size" stroke="#04070F" fill={CHART_COLORS.blue} />
      </ResponsiveContainer>
    );
  }

  if (tab === "Sensitivity") {
    return (
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={SENSITIVITY_DATA} layout="vertical" margin={{ left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
          <XAxis type="number" stroke={CHART_COLORS.textMuted} fontSize={11} unit="%" />
          <YAxis type="category" dataKey="param" stroke={CHART_COLORS.textMuted} fontSize={10} width={110} />
          <Tooltip content={<ChartTooltip formatter={(v) => `±${v}%`} />} />
          <Bar dataKey="impact" name="TCO impact" fill={CHART_COLORS.blue} radius={[0, 4, 4, 0]}>
            {SENSITIVITY_DATA.map((d, i) => (
              <Cell key={i} fill={i < 3 ? CHART_COLORS.orange : CHART_COLORS.blue} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Inflation impact
  const withInf = result;
  const withoutInf = runTCOSimulation({ ...params, inflationEnabled: false });
  const merged = withInf.yearlyBreakdown.map((y, i) => ({
    year: y.year,
    inflated: y.cumulative,
    nominal: withoutInf.yearlyBreakdown[i]?.cumulative ?? 0,
  }));
  const delta = withInf.totalTCO - withoutInf.totalTCO;
  return (
    <div>
      <ResponsiveContainer width="100%" height={310}>
        <LineChart data={merged}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis dataKey="year" stroke={CHART_COLORS.textMuted} fontSize={11} />
          <YAxis stroke={CHART_COLORS.textMuted} fontSize={11} tickFormatter={(v: number) => fmtCompact(v)} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="inflated" name="With inflation" stroke={CHART_COLORS.yellow} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="nominal" name="Without inflation" stroke={CHART_COLORS.blue} strokeWidth={2} dot={false} strokeDasharray="5 3" />
        </LineChart>
      </ResponsiveContainer>
      <p className="font-mono-data mt-1 text-center text-xs text-yellow">
        Inflation adds {fmtCompact(Math.abs(delta))} over {params.N} years
      </p>
    </div>
  );
}

/**
 * Maintenance is part-specific: pick the part being serviced and the card shows
 * its interval, quantity, price, warranty and derived labour.
 */
function MaintenancePartCard() {
  const { parts, laborPct } = usePartsStore();
  const { params } = useSimulationStore();
  const [partId, setPartId] = useState<string>(parts[0]?.id ?? "");

  const part = parts.find((p) => p.id === partId) ?? parts[0];
  if (!part) return null;

  const tco = partTCO(part, params.N, laborPct);
  const partsCost = eventPartsCost(part);

  return (
    <GlassCard className="space-y-3">
      <SectionTitle>Maintenance Part</SectionTitle>
      <select
        value={part.id}
        onChange={(e) => setPartId(e.target.value)}
        className="w-full rounded-md border border-border bg-surface-2 px-2 py-1.5 text-xs outline-none focus:border-primary/50"
      >
        {COMPONENTS.map((c) => {
          const group = parts.filter((p) => p.componentId === c.id);
          if (group.length === 0) return null;
          return (
            <optgroup key={c.id} label={c.name}>
              {group.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
          );
        })}
      </select>

      <div className="font-mono-data space-y-1.5 rounded-md bg-surface-2 p-2.5 text-[11px]">
        <SimRow label="Interval" value={formatInterval(part)} />
        <SimRow label="Quantity" value={`${part.maintQty} ${part.uom}`} />
        <SimRow label="Price" value={fmtUSD(part.unitPriceNew)} />
        <SimRow label="Parts / event" value={fmtUSD(partsCost)} />
        <SimRow label={`Labour @ ${laborPct}%`} value={fmtUSD(partsCost * (laborPct / 100))} accent />
        <div className="border-t border-border pt-1.5">
          <SimRow label="Cost / event" value={fmtUSD(partsCost * (1 + laborPct / 100))} bold />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-md bg-surface-2/70 p-2">
          <p className="text-[9px] uppercase tracking-wider text-text-muted">Warranty</p>
          <p className="font-mono-data mt-0.5 text-[11px] font-semibold">
            {part.warrantyYears}yr · {(part.warrantyKm / 1000).toFixed(0)}k km
          </p>
        </div>
        <div className="rounded-md bg-surface-2/70 p-2">
          <p className="text-[9px] uppercase tracking-wider text-text-muted">Failure Prob.</p>
          <p className="font-mono-data mt-0.5 text-[11px] font-semibold text-orange">{part.failureProbabilityPct}%</p>
        </div>
      </div>

      <p className="text-[10px] text-text-muted">
        {tco.eventCount} events over {params.N}yr · {fmtCompact(tco.customerCost)} customer / {fmtCompact(tco.companyCost)} company
      </p>
    </GlassCard>
  );
}

function SimRow({ label, value, accent, bold }: { label: string; value: string; accent?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className={cn("tabular-nums", accent && "text-primary", bold && "font-bold text-foreground")}>{value}</span>
    </div>
  );
}

/** Customer TCO vs Organization TCO — shown separately, never merged. */
function TCOSplitCard() {
  const { params, result } = useSimulationStore();
  const { parts, laborPct } = usePartsStore();
  const partRoll = useMemo(() => fleetTCO(parts, params.N, laborPct), [parts, params.N, laborPct]);

  const cards = [
    {
      title: "Customer TCO",
      value: result.split.customerTCO,
      hint: "What the operator pays — warranty-covered failures excluded",
      color: CHART_COLORS.teal,
      rows: [
        ["Gross lifecycle cost", result.totalTCO + result.split.warrantyCovered],
        ["Less warranty covered", -result.split.warrantyCovered],
      ] as Array<[string, number]>,
    },
    {
      title: "Organization TCO",
      value: result.split.organizationTCO,
      hint: "What the manufacturer carries — replacements plus reserve",
      color: CHART_COLORS.purple,
      rows: [
        ["Warranty replacement", result.split.warrantyCovered],
        ["Company warranty reserve", result.split.warrantyReserve],
      ] as Array<[string, number]>,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((c) => (
        <GlassCard key={c.title} className="space-y-2">
          <div className="flex items-baseline justify-between">
            <SectionTitle>{c.title}</SectionTitle>
            <span className="font-display font-mono-data text-lg font-bold tabular-nums" style={{ color: c.color }}>
              {fmtCompact(c.value)}
            </span>
          </div>
          <p className="text-[10px] text-text-muted">{c.hint}</p>
          <div className="font-mono-data space-y-1 text-[11px]">
            {c.rows.map(([label, v]) => (
              <div key={label} className="flex justify-between">
                <span className="text-text-secondary">{label}</span>
                <span className={cn("tabular-nums", v < 0 && "text-green")}>{fmtCompact(v)}</span>
              </div>
            ))}
          </div>
          {c.title === "Organization TCO" && (
            <p className="text-[10px] text-text-muted">
              Reserve = Σ (part cost × failure probability) across {parts.length} parts · part-level maintenance{" "}
              {fmtCompact(partRoll.totalCost)}
            </p>
          )}
        </GlassCard>
      ))}
    </div>
  );
}

function CostBySystem() {
  const sys = SYSTEMS.filter((s) => s.locomotiveId === "loco-001").map((s) => {
    const asmIds = ASSEMBLIES.filter((a) => a.systemId === s.id).map((a) => a.id);
    const cost = COMPONENTS.filter((c) => asmIds.includes(c.assemblyId)).reduce(
      (sum, c) => sum + c.replacementCost * Math.max(1, Math.floor(20 / c.lifeYears)),
      0,
    );
    return { ...s, cost };
  });
  const max = Math.max(...sys.map((s) => s.cost));
  return (
    <GlassCard>
      <SectionTitle className="mb-3">Cost by System (20yr)</SectionTitle>
      <div className="space-y-2.5">
        {sys.sort((a, b) => b.cost - a.cost).map((s) => (
          <div key={s.id}>
            <div className="flex justify-between text-[11px]">
              <span className="text-text-secondary">{s.name}</span>
              <span className="font-mono-data">{fmtCompact(s.cost)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(s.cost / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function RiskMatrix() {
  const data = COMPONENTS.map((c) => ({
    x: weibullFailureProb(c.currentHours + 5500, c.weibullBeta, c.weibullEta) * 100,
    y: c.replacementCost * (1 + c.laborCostPct / 100),
    name: c.name,
  }));
  return (
    <GlassCard>
      <SectionTitle className="mb-2">Risk Matrix</SectionTitle>
      <ResponsiveContainer width="100%" height={190}>
        <ScatterChart margin={{ left: 0, right: 8, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
          <XAxis type="number" dataKey="x" name="Failure prob" stroke={CHART_COLORS.textMuted} fontSize={9} unit="%" />
          <YAxis type="number" dataKey="y" name="Cost impact" stroke={CHART_COLORS.textMuted} fontSize={9} tickFormatter={(v: number) => fmtCompact(v)} width={48} />
          <ZAxis range={[40, 41]} />
          <Tooltip content={<ChartTooltip formatter={(v) => (v > 1000 ? fmtUSD(v) : `${v.toFixed(1)}%`)} />} />
          <Scatter data={data} fill={CHART_COLORS.orange} fillOpacity={0.85} />
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-text-muted">Failure probability (next year) × cost impact — all 16 components</p>
    </GlassCard>
  );
}
