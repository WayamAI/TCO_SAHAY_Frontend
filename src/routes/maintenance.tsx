import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ShieldCheck, ShieldOff, Wrench } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import { COMPONENTS, CHART_COLORS } from "@/data/syntheticData";
import type { Part } from "@/data/bomData";
import { usePartsStore } from "@/store/partsStore";
import {
  maintenanceEvents,
  partTCO,
  formatInterval,
  partIntervalYears,
  DEFAULT_DUTY,
  type MaintenanceEvent,
} from "@/utils/tcoEngine";
import { fmtCompact, fmtUSD } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance & Service | TCO Intelligence" },
      {
        name: "description",
        content: "Part-specific maintenance schedule — what is serviced at each event, with quantity, price, labour and warranty status.",
      },
    ],
  }),
  component: MaintenancePage,
});

/** Proper English ordinal — 1st, 2nd, 3rd, 4th … 21st, 22nd, 23rd. */
function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix}`;
}

function fmtKm(km: number): string {
  return km >= 1e6 ? `${(km / 1e6).toFixed(2)}M km` : `${(km / 1000).toFixed(0)}k km`;
}

type WarrantyStatus = "covered" | "partial" | "expired";

/**
 * One part's work inside a single visit. A fast-wearing part (brake shoes every
 * 25,000 km) can be due several times within the same window — those collapse
 * into one line with an occurrence count rather than repeating identically.
 */
interface VisitLine {
  part: Part;
  occurrences: number;
  qty: number;
  partsCost: number;
  laborCost: number;
  totalCost: number;
  warrantyCovered: number;
  status: WarrantyStatus;
}

/** One service visit: every part due at roughly the same point in the life. */
interface ServiceVisit {
  label: string;
  atYear: number;
  atKm: number;
  lines: VisitLine[];
  partsCost: number;
  laborCost: number;
  totalCost: number;
  warrantyCovered: number;
  customerCost: number;
}

/**
 * Group individual part events into service visits. Parts due within the same
 * half-year window are worked together, which is how a depot actually schedules.
 */
function buildVisits(parts: Part[], horizon: number, laborPct: number): ServiceVisit[] {
  const buckets = new Map<number, Map<string, { part: Part; events: MaintenanceEvent[] }>>();

  for (const part of parts) {
    for (const event of maintenanceEvents(part, horizon, laborPct)) {
      const key = Math.max(0.5, Math.round(event.atYear * 2) / 2); // half-year buckets
      const byPart = buckets.get(key) ?? new Map();
      const entry = byPart.get(part.id) ?? { part, events: [] };
      entry.events.push(event);
      byPart.set(part.id, entry);
      buckets.set(key, byPart);
    }
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([atYear, byPart], i) => {
      const lines: VisitLine[] = Array.from(byPart.values()).map(({ part, events }) => {
        const partsCost = events.reduce((s, e) => s + e.partsCost, 0);
        const laborCost = events.reduce((s, e) => s + e.laborCost, 0);
        const covered = events.filter((e) => e.underWarranty);
        return {
          part,
          occurrences: events.length,
          qty: part.maintQty * events.length,
          partsCost,
          laborCost,
          totalCost: partsCost + laborCost,
          warrantyCovered: covered.reduce((s, e) => s + e.totalCost, 0),
          status: covered.length === events.length ? "covered" : covered.length === 0 ? "expired" : "partial",
        };
      });

      const partsCost = lines.reduce((s, l) => s + l.partsCost, 0);
      const laborCost = lines.reduce((s, l) => s + l.laborCost, 0);
      const warrantyCovered = lines.reduce((s, l) => s + l.warrantyCovered, 0);
      const totalCost = partsCost + laborCost;

      return {
        label: `${ordinal(i + 1)} maintenance`,
        atYear,
        atKm: Math.round(atYear * DEFAULT_DUTY.annualKm),
        lines: lines.sort((a, b) => b.totalCost - a.totalCost),
        partsCost,
        laborCost,
        totalCost,
        warrantyCovered,
        customerCost: totalCost - warrantyCovered,
      };
    });
}

function MaintenancePage() {
  const { parts, laborPct } = usePartsStore();
  const [range, setRange] = useState(20);
  const [componentId, setComponentId] = useState<string>("all");
  const [openVisit, setOpenVisit] = useState<number>(0);

  const scoped = useMemo(
    () => (componentId === "all" ? parts : parts.filter((p) => p.componentId === componentId)),
    [parts, componentId],
  );

  const visits = useMemo(() => buildVisits(scoped, range, laborPct), [scoped, range, laborPct]);

  const costPerYear = useMemo(() => {
    const customer = new Map<number, number>();
    const company = new Map<number, number>();
    for (const v of visits) {
      const y = Math.max(1, Math.ceil(v.atYear));
      customer.set(y, (customer.get(y) ?? 0) + v.customerCost);
      company.set(y, (company.get(y) ?? 0) + v.warrantyCovered);
    }
    return Array.from({ length: range }, (_, i) => ({
      year: i + 1,
      customer: customer.get(i + 1) ?? 0,
      company: company.get(i + 1) ?? 0,
    }));
  }, [visits, range]);

  // Highest-cost parts across the horizon — the maintenance drivers.
  const drivers = useMemo(
    () =>
      scoped
        .map((p) => ({ part: p, tco: partTCO(p, range, laborPct) }))
        .filter((d) => d.tco.eventCount > 0)
        .sort((a, b) => b.tco.totalCost - a.tco.totalCost)
        .slice(0, 12),
    [scoped, range, laborPct],
  );

  const totals = visits.reduce(
    (acc, v) => ({
      total: acc.total + v.totalCost,
      warranty: acc.warranty + v.warrantyCovered,
      customer: acc.customer + v.customerCost,
      labor: acc.labor + v.laborCost,
    }),
    { total: 0, warranty: 0, customer: 0, labor: 0 },
  );

  return (
    <div className="space-y-5">
      {/* Controls */}
      <GlassCard className="flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden rounded-md border border-border text-[11px]">
          {[5, 10, 20, 30].map((r) => (
            <button
              key={r}
              onClick={() => { setRange(r); setOpenVisit(0); }}
              className={cn("px-3 py-1.5", range === r ? "bg-primary font-semibold text-primary-foreground" : "bg-surface-2 text-text-secondary")}
            >
              {r}yr
            </button>
          ))}
        </div>
        <select
          value={componentId}
          onChange={(e) => { setComponentId(e.target.value); setOpenVisit(0); }}
          className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs outline-none focus:border-primary/50"
        >
          <option value="all">All components ({parts.length} parts)</option>
          {COMPONENTS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({parts.filter((p) => p.componentId === c.id).length})
            </option>
          ))}
        </select>
        <span className="ml-auto flex flex-wrap gap-3 text-[10px] text-text-secondary">
          <span><ShieldCheck size={11} className="mr-1 inline text-blue" />Under warranty — company pays</span>
          <span><ShieldOff size={11} className="mr-1 inline text-orange" />Out of warranty — customer pays</span>
        </span>
      </GlassCard>

      {/* Roll-up strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { l: `Total maintenance (${range}yr)`, v: fmtCompact(totals.total), c: CHART_COLORS.teal },
          { l: `Labour @ ${laborPct}%`, v: fmtCompact(totals.labor), c: CHART_COLORS.purple },
          { l: "Warranty covered", v: fmtCompact(totals.warranty), c: CHART_COLORS.blue },
          { l: "Customer pays", v: fmtCompact(totals.customer), c: CHART_COLORS.orange },
        ].map((k) => (
          <div key={k.l} className="glass-card p-2.5 text-center">
            <p className="text-[9px] uppercase tracking-wider text-text-muted">{k.l}</p>
            <p className="font-display font-mono-data mt-1 text-sm font-bold tabular-nums" style={{ color: k.c }}>{k.v}</p>
          </div>
        ))}
      </div>

      {/* Service events — what gets done at the 1st, 2nd, 3rd maintenance */}
      <GlassCard className="dot-grid" scanline>
        <SectionTitle className="mb-3 flex items-center gap-1.5">
          <Wrench size={13} /> Service Events — which parts are replaced at each maintenance
        </SectionTitle>
        <div className="space-y-2">
          {visits.slice(0, 24).map((v, i) => (
            <div key={v.label} className="overflow-hidden rounded-lg border border-border/60">
              <button
                onClick={() => setOpenVisit(openVisit === i ? -1 : i)}
                className={cn(
                  "flex w-full flex-wrap items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-2/60",
                  openVisit === i && "bg-surface-2/70",
                )}
              >
                <span className="font-display w-36 shrink-0 text-xs font-semibold">{v.label}</span>
                <span className="font-mono-data w-32 shrink-0 text-[10px] text-text-muted">
                  Yr {v.atYear.toFixed(1)} · {fmtKm(v.atKm)}
                </span>
                <span className="text-[10px] text-text-secondary">{v.lines.length} parts</span>
                <span className="ml-auto flex items-center gap-3 text-[11px]">
                  <span className="font-mono-data text-text-secondary">parts {fmtCompact(v.partsCost)}</span>
                  <span className="font-mono-data text-purple">labour {fmtCompact(v.laborCost)}</span>
                  {v.warrantyCovered > 0 && (
                    <span className="font-mono-data rounded bg-blue/15 px-1.5 py-0.5 text-blue">
                      warranty {fmtCompact(v.warrantyCovered)}
                    </span>
                  )}
                  <span className="font-mono-data font-bold tabular-nums">{fmtCompact(v.totalCost)}</span>
                </span>
              </button>

              {openVisit === i && (
                <div className="overflow-x-auto border-t border-border/60 bg-surface-1/60">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-border/50 text-[9px] uppercase tracking-wider text-text-muted">
                        {["Part", "Interval", "Qty", "Unit", "Price", "Parts cost", "Labour", "Total", "Warranty"].map((h) => (
                          <th key={h} className="px-2.5 py-1.5 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {v.lines.map((l) => (
                        <tr key={l.part.id} className="border-b border-border/30">
                          <td className="px-2.5 py-1.5">
                            <span className="block max-w-[220px] truncate" title={l.part.name}>
                              {l.part.name}
                              {l.occurrences > 1 && (
                                <span className="ml-1.5 rounded bg-surface-3 px-1 text-[9px] text-text-secondary">×{l.occurrences} due</span>
                              )}
                            </span>
                            <span className="text-[9px] text-text-muted">
                              {COMPONENTS.find((c) => c.id === l.part.componentId)?.name ?? "—"}
                            </span>
                          </td>
                          <td className="font-mono-data px-2.5 py-1.5 text-text-secondary">{formatInterval(l.part)}</td>
                          <td className="font-mono-data px-2.5 py-1.5">{l.qty}</td>
                          <td className="px-2.5 py-1.5 text-text-secondary">{l.part.uom}</td>
                          <td className="font-mono-data px-2.5 py-1.5">{fmtUSD(l.part.unitPriceNew)}</td>
                          <td className="font-mono-data px-2.5 py-1.5">{fmtUSD(l.partsCost)}</td>
                          <td className="font-mono-data px-2.5 py-1.5 text-purple">{fmtUSD(l.laborCost)}</td>
                          <td className="font-mono-data px-2.5 py-1.5 font-semibold">{fmtUSD(l.totalCost)}</td>
                          <td className="px-2.5 py-1.5">
                            {l.status === "covered" && (
                              <span className="inline-flex items-center gap-1 rounded bg-blue/15 px-1.5 py-0.5 text-[9px] font-semibold text-blue">
                                <ShieldCheck size={10} /> {l.part.warrantyYears}yr / {(l.part.warrantyKm / 1000).toFixed(0)}k km
                              </span>
                            )}
                            {l.status === "partial" && (
                              <span className="inline-flex items-center gap-1 rounded bg-yellow/15 px-1.5 py-0.5 text-[9px] font-semibold text-yellow">
                                <ShieldCheck size={10} /> partly covered
                              </span>
                            )}
                            {l.status === "expired" && (
                              <span className="inline-flex items-center gap-1 rounded bg-orange/15 px-1.5 py-0.5 text-[9px] font-semibold text-orange">
                                <ShieldOff size={10} /> expired
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
          {visits.length === 0 && (
            <p className="py-6 text-center text-xs text-text-muted">
              No maintenance falls inside a {range}-year horizon for this selection.
            </p>
          )}
        </div>
        {visits.length > 24 && (
          <p className="mt-2 text-[10px] text-text-muted">
            Showing the first 24 of {visits.length} service visits — narrow the horizon or pick a component to see the rest.
          </p>
        )}
      </GlassCard>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Cost calendar split by who pays */}
        <GlassCard>
          <SectionTitle className="mb-3">Cost Calendar — who pays each year</SectionTitle>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={costPerYear}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="year" stroke={CHART_COLORS.textMuted} fontSize={10} tickFormatter={(v) => `Y${v}`} />
              <YAxis stroke={CHART_COLORS.textMuted} fontSize={10} tickFormatter={(v: number) => fmtCompact(v)} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="company" name="Company (warranty)" stackId="a" fill={CHART_COLORS.blue} radius={[0, 0, 0, 0]} />
              <Bar dataKey="customer" name="Customer" stackId="a" fill={CHART_COLORS.orange} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Part-level maintenance drivers */}
        <GlassCard>
          <SectionTitle className="mb-3">Maintenance Drivers — cost by part ({range}yr)</SectionTitle>
          <div className="max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
            {drivers.map(({ part, tco }) => {
              const max = drivers[0].tco.totalCost;
              const every = partIntervalYears(part);
              return (
                <div key={part.id} className="rounded-md bg-surface-2/50 px-2.5 py-1.5">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="flex-1 truncate" title={part.name}>{part.name}</span>
                    <span className="font-mono-data text-[9px] text-text-muted">
                      every {every < 1 ? `${(every * 12).toFixed(0)}mo` : `${every.toFixed(1)}y`} · {tco.eventCount}×
                    </span>
                    <span className="font-mono-data w-16 text-right tabular-nums">{fmtCompact(tco.totalCost)}</span>
                  </div>
                  <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full bg-blue"
                      style={{ width: `${(tco.warrantyCoveredCost / max) * 100}%` }}
                      title={`Warranty ${fmtCompact(tco.warrantyCoveredCost)}`}
                    />
                    <div
                      className="h-full bg-orange"
                      style={{ width: `${(tco.customerCost / max) * 100}%` }}
                      title={`Customer ${fmtCompact(tco.customerCost)}`}
                    />
                  </div>
                </div>
              );
            })}
            {drivers.length === 0 && <p className="py-6 text-center text-xs text-text-muted">No parts due in this horizon.</p>}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
