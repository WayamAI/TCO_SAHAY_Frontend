import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import { useSimulationStore } from "@/store/simulationStore";
import { CHART_COLORS } from "@/data/syntheticData";
import { fmtCompact, fmtUSD, fmtNum } from "@/utils/formatters";
import {
  replacementByComponent,
  consumablesBreakdown,
  failureByComponent,
  downtimeByComponent,
  warrantyByComponent,
  fuelAndFluids,
  maintenanceDrivers,
} from "@/utils/componentAnalytics";
import { cn } from "@/lib/utils";
import { AppIcon } from "@/components/icons/AppIcon";

const SUBTABS = [
  { key: "replacement", label: "Replacement by Part", icon: "maintenance" },
  { key: "consumables", label: "Consumables", icon: "fluid" },
  { key: "fuel", label: "Fluids & Filters", icon: "filter" },
  { key: "failure", label: "Failure Analysis", icon: "warning" },
  { key: "downtime", label: "Downtime", icon: "clock" },
  { key: "warranty", label: "Warranty", icon: "warrantyActive" },
] as const;

type SubTab = (typeof SUBTABS)[number]["key"];

export function critColor(c: string): string {
  const v = c.toLowerCase();
  if (v === "critical" || v === "vital") return CHART_COLORS.red;
  if (v === "high" || v === "essential") return CHART_COLORS.orange;
  if (v === "medium") return CHART_COLORS.yellow;
  return CHART_COLORS.green;
}

export function MaintenanceAnalytics() {
  const { params } = useSimulationStore();
  const [tab, setTab] = useState<SubTab>("replacement");

  return (
    <GlassCard className="min-w-0" scanline>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SectionTitle>Component &amp; Consumable Analytics — {params.N}yr horizon</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {SUBTABS.map((t) => {
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-mini transition-colors",
                  tab === t.key
                    ? "bg-raised-2 font-medium text-fg-primary"
                    : "transition-ui bg-action text-fg-tertiary hover:bg-raised-2 hover:text-fg-secondary",
                )}
              >
                <AppIcon name={t.icon} size="xs" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "replacement" && <ReplacementPanel params={params} />}
      {tab === "consumables" && <ConsumablesPanel params={params} />}
      {tab === "fuel" && <FuelFluidsPanel params={params} />}
      {tab === "failure" && <FailurePanel params={params} />}
      {tab === "downtime" && <DowntimePanel params={params} />}
      {tab === "warranty" && <WarrantyPanel params={params} />}
    </GlassCard>
  );
}

type P = { params: ReturnType<typeof useSimulationStore.getState>["params"] };

/* ───────────────────────── Replacement ───────────────────────── */

function ReplacementPanel({ params }: P) {
  const rows = useMemo(() => replacementByComponent(params), [params]);
  const top = rows.slice(0, 12);
  const total = rows.reduce((s, r) => s + r.totalCost, 0);
  const partLevel = rows.some((r) => r.isPart);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <p className="mb-2 text-mini text-text-secondary">
          {partLevel ? "Part-level" : "Component-level"} replacement spend over {params.N}yr ·{" "}
          <span className="font-mono-data text-foreground">{fmtCompact(total)}</span> total
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={top} layout="vertical" margin={{ left: 8, right: 28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
            <XAxis
              type="number"
              stroke={CHART_COLORS.textMuted}
              fontSize={9}
              tickFormatter={(v: number) => fmtCompact(v)}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke={CHART_COLORS.textMuted}
              fontSize={9}
              width={128}
              tickFormatter={(v: string) => (v.length > 20 ? v.slice(0, 19) + "…" : v)}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "var(--ref-gray-850)", fillOpacity: 0.6 }}
            />
            <Bar dataKey="totalCost" name="Replacement cost" radius={[0, 3, 3, 0]}>
              {top.map((r) => (
                <Cell key={r.id} fill={critColor(r.criticality)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="max-h-[340px] overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-surface-1">
            <tr className="border-b border-border text-micro uppercase text-text-muted">
              {["Part / Component", "System", "Ivl", "Events", "Per Event", "Total"].map((h) => (
                <th key={h} className="px-2 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/40">
                <td className="px-2 py-1.5">
                  <span className="flex items-center gap-1.5">
                    <span style={{ color: critColor(r.criticality) }}>◆</span>
                    <span className="truncate">{r.name}</span>
                  </span>
                </td>
                <td className="px-2 py-1.5 text-mini text-text-muted">{r.system}</td>
                <td className="font-mono-data px-2 py-1.5 text-text-secondary">
                  {r.intervalYears}y
                </td>
                <td className="font-mono-data px-2 py-1.5">{r.events}</td>
                <td className="font-mono-data px-2 py-1.5 text-text-secondary">
                  {fmtCompact(r.perEvent)}
                </td>
                <td className="font-mono-data px-2 py-1.5">{fmtCompact(r.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────────────────── Consumables ───────────────────────── */

function ConsumablesPanel({ params }: P) {
  const rows = useMemo(() => consumablesBreakdown(params), [params]);
  const annualTotal = rows.reduce((s, r) => s + r.annualCost, 0);
  const pie = rows.map((r) => ({ name: r.category, value: r.annualCost, color: r.color }));

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <div>
        <p className="mb-1 text-mini text-text-secondary">Annual consumables spend</p>
        <p className="font-display mb-2 text-xl font-bold text-yellow">
          {fmtUSD(annualTotal)}
          <span className="text-xs text-text-muted">/yr</span>
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pie}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={80}
              paddingAngle={2}
              strokeWidth={0}
            >
              {pie.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.category} className="rounded-lg bg-surface-2/50 p-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />
                {r.category}
              </span>
              <span className="font-mono-data">
                {fmtUSD(r.annualCost)}
                <span className="text-text-muted">/yr</span> ·{" "}
                <span className="text-text-secondary">
                  {fmtCompact(r.totalCost)} / {params.N}yr
                </span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${annualTotal ? (r.annualCost / annualTotal) * 100 : 0}%`,
                  background: r.color,
                }}
              />
            </div>
            <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-mini text-text-muted">
              {r.items.slice(0, 4).map((it) => (
                <span key={it.name}>
                  {it.name}{" "}
                  <span className="font-mono-data text-text-secondary">
                    {fmtCompact(it.annualCost)}
                  </span>
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Fluids & Filters ───────────────────────── */

function FuelFluidsPanel({ params }: P) {
  const { rows, annualTotal } = useMemo(() => fuelAndFluids(params), [params]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <div>
        <p className="mb-1 text-mini text-text-secondary">
          Annual fluids &amp; filters — oils, lubricants, coolant, refrigerant &amp; filter elements
        </p>
        <p className="font-display mb-2 text-xl font-bold text-orange">
          {fmtUSD(annualTotal)}
          <span className="text-xs text-text-muted">/yr</span>
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
            <XAxis
              type="number"
              stroke={CHART_COLORS.textMuted}
              fontSize={9}
              tickFormatter={(v: number) => fmtCompact(v)}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke={CHART_COLORS.textMuted}
              fontSize={9}
              width={120}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "var(--ref-gray-850)", fillOpacity: 0.6 }}
            />
            <Bar dataKey="annual" name="Annual cost" radius={[0, 3, 3, 0]}>
              {rows.map((r) => (
                <Cell key={r.name} fill={r.color} />
              ))}
              <LabelList
                dataKey="share"
                position="right"
                formatter={(v: number) => `${v.toFixed(0)}%`}
                style={{ fontSize: 9, fill: CHART_COLORS.textSecondary }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="max-h-[300px] overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-surface-1">
            <tr className="border-b border-border text-micro uppercase text-text-muted">
              {["Line Item", "Share", "Annual", `${params.N}yr Total`].map((h) => (
                <th key={h} className="px-2 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-border/40">
                <td className="px-2 py-2">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />
                    <span>{r.name}</span>
                  </span>
                  {r.note && <span className="ml-4 text-micro text-text-muted">{r.note}</span>}
                </td>
                <td className="font-mono-data px-2 py-2 text-text-secondary">
                  {r.share.toFixed(1)}%
                </td>
                <td className="font-mono-data px-2 py-2">{fmtUSD(r.annual)}</td>
                <td className="font-mono-data px-2 py-2 text-text-secondary">
                  {fmtCompact(r.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-mini text-text-muted">
          Fluids &amp; filters are the recurring MRO tail that part-level maintenance costing makes
          visible.
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────── Failure Analysis ───────────────────────── */

function FailurePanel({ params }: P) {
  const rows = useMemo(() => failureByComponent(params), [params]);
  const top = rows.slice(0, 12).map((r) => ({ ...r, combined: r.failureCost + r.downtimeCost }));

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <p className="mb-2 text-mini text-text-secondary">
          Expected failure + downtime cost by component ({params.N}yr)
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={top} layout="vertical" margin={{ left: 8, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
            <XAxis
              type="number"
              stroke={CHART_COLORS.textMuted}
              fontSize={9}
              tickFormatter={(v: number) => fmtCompact(v)}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke={CHART_COLORS.textMuted}
              fontSize={9}
              width={128}
              tickFormatter={(v: string) => (v.length > 20 ? v.slice(0, 19) + "…" : v)}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "var(--ref-gray-850)", fillOpacity: 0.6 }}
            />
            <Bar
              dataKey="failureCost"
              name="Repair cost"
              stackId="a"
              fill={CHART_COLORS.red}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="downtimeCost"
              name="Downtime cost"
              stackId="a"
              fill={CHART_COLORS.orange}
              radius={[0, 3, 3, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="max-h-[340px] overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-surface-1">
            <tr className="border-b border-border text-micro uppercase text-text-muted">
              {["Component", "Impact", "Exp. Fails", "Next-yr %", "Repair", "Downtime"].map((h) => (
                <th key={h} className="px-2 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border/40"
                style={{ background: `${critColor(r.criticality)}0d` }}
              >
                <td className="px-2 py-1.5 truncate">{r.name}</td>
                <td className="px-2 py-1.5">
                  <span
                    className="rounded px-1 py-0.5 text-micro font-semibold"
                    style={{
                      background: `${critColor(r.criticality)}22`,
                      color: critColor(r.criticality),
                    }}
                  >
                    {r.criticality}
                  </span>
                </td>
                <td className="font-mono-data px-2 py-1.5">{r.expectedFailures.toFixed(2)}</td>
                <td className="font-mono-data px-2 py-1.5 text-text-secondary">
                  {r.nextYearProb}%
                </td>
                <td className="font-mono-data px-2 py-1.5">{fmtCompact(r.failureCost)}</td>
                <td className="font-mono-data px-2 py-1.5 text-orange">
                  {fmtCompact(r.downtimeCost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────────────────── Downtime ───────────────────────── */

function DowntimePanel({ params }: P) {
  const rows = useMemo(() => downtimeByComponent(params), [params]);
  const top = rows.slice(0, 12);
  const totalDays = rows.reduce((s, r) => s + r.downtimeDays, 0);
  const totalCost = rows.reduce((s, r) => s + r.downtimeCost, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <div className="mb-2 flex gap-4 text-mini">
          <span className="text-text-secondary">
            Total downtime{" "}
            <span className="font-mono-data text-foreground">{totalDays.toFixed(0)} days</span>
          </span>
          <span className="text-text-secondary">
            Lost revenue <span className="font-mono-data text-red">{fmtCompact(totalCost)}</span>
          </span>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={top} layout="vertical" margin={{ left: 8, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
            <XAxis
              type="number"
              stroke={CHART_COLORS.textMuted}
              fontSize={9}
              tickFormatter={(v: number) => fmtCompact(v)}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke={CHART_COLORS.textMuted}
              fontSize={9}
              width={128}
              tickFormatter={(v: string) => (v.length > 20 ? v.slice(0, 19) + "…" : v)}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "var(--ref-gray-850)", fillOpacity: 0.6 }}
            />
            <Bar dataKey="downtimeCost" name="Downtime cost" radius={[0, 3, 3, 0]}>
              {top.map((r) => (
                <Cell key={r.id} fill={critColor(r.criticality)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="max-h-[340px] overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-surface-1">
            <tr className="border-b border-border text-micro uppercase text-text-muted">
              {["Component", "System", "MTTR", "Downtime", "Cost"].map((h) => (
                <th key={h} className="px-2 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/40">
                <td className="px-2 py-1.5 truncate">{r.name}</td>
                <td className="px-2 py-1.5 text-mini text-text-muted">{r.system}</td>
                <td className="font-mono-data px-2 py-1.5 text-text-secondary">{r.mttrHours}h</td>
                <td className="font-mono-data px-2 py-1.5">{r.downtimeDays.toFixed(1)}d</td>
                <td className="font-mono-data px-2 py-1.5 text-red">
                  {fmtCompact(r.downtimeCost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────────────────── Warranty ───────────────────────── */

function WarrantyPanel({ params }: P) {
  const rows = useMemo(() => warrantyByComponent(params), [params]);
  const scaleMax = Math.max(params.N, ...rows.map((r) => r.totalCoverage), 5);
  const totalCovered = rows.reduce((s, r) => s + r.coveredValue, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <div>
        <p className="mb-3 text-mini text-text-secondary">
          Warranty coverage timeline · base +{" "}
          <span className="text-teal">extended {params.warrantyExtendedYears}yr</span> · shields{" "}
          <span className="font-mono-data text-foreground">{fmtCompact(totalCovered)}</span>
        </p>
        <div className="max-h-[320px] space-y-1.5 overflow-auto pr-1">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-2 text-mini">
              <span className="w-36 shrink-0 truncate text-text-secondary">{r.name}</span>
              <div className="relative h-4 flex-1 overflow-hidden rounded-md bg-surface-3">
                <div
                  className="absolute inset-y-0 left-0 rounded-l-md bg-primary/70"
                  style={{ width: `${(r.baseWarranty / scaleMax) * 100}%` }}
                  title={`Base ${r.baseWarranty}yr`}
                />
                {r.extended > 0 && (
                  <div
                    className="absolute inset-y-0 bg-teal/70"
                    style={{
                      left: `${(r.baseWarranty / scaleMax) * 100}%`,
                      width: `${(r.extended / scaleMax) * 100}%`,
                    }}
                    title={`Extended ${r.extended}yr`}
                  />
                )}
              </div>
              <span className="font-mono-data w-10 text-right text-text-secondary">
                {r.totalCoverage}y
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-mini text-text-muted">
          <span>
            <span className="mr-1 inline-block h-2 w-3 rounded-sm bg-primary/70" />
            Base warranty
          </span>
          <span>
            <span className="mr-1 inline-block h-2 w-3 rounded-sm bg-teal/70" />
            Extended
          </span>
          <span className="ml-auto">Axis: 0 → {scaleMax}yr</span>
        </div>
      </div>
      <div className="max-h-[340px] overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-surface-1">
            <tr className="border-b border-border text-micro uppercase text-text-muted">
              {["Component", "Base", "Ext", "Coverage", "Value Shielded"].map((h) => (
                <th key={h} className="px-2 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/40">
                <td className="px-2 py-1.5 truncate">{r.name}</td>
                <td className="font-mono-data px-2 py-1.5 text-text-secondary">
                  {r.baseWarranty}y
                </td>
                <td className="font-mono-data px-2 py-1.5 text-teal">
                  {r.extended ? `+${r.extended}y` : "—"}
                </td>
                <td className="font-mono-data px-2 py-1.5">{r.totalCoverage}y</td>
                <td className="font-mono-data px-2 py-1.5">{fmtCompact(r.coveredValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────────────────── Left-column maintenance-driver summary ───────────────────────── */

export function MaintDriverSummary() {
  const { params } = useSimulationStore();
  const drivers = useMemo(() => maintenanceDrivers(params, 6), [params]);
  const max = Math.max(...drivers.map((d) => d.annualMaint), 1);

  return (
    <GlassCard>
      <div className="mb-3 flex items-baseline justify-between">
        <SectionTitle>Top Maintenance Drivers</SectionTitle>
        <span className="text-mini text-text-muted">
          Annualized replace + failure + downtime, by component
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 sm:grid-cols-3 2xl:grid-cols-6">
        {drivers.map((d) => (
          <div key={d.id}>
            <div className="flex items-center justify-between text-mini">
              <span className="truncate text-text-secondary" title={d.name}>
                {d.name}
              </span>
              <span className="font-mono-data ml-2 shrink-0">{fmtCompact(d.annualMaint)}/yr</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(d.annualMaint / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
