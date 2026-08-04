import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { KPICard } from "@/components/shared/KPICard";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import { COMPONENTS, RELIABILITY_CURVE_DATA, CHART_COLORS, healthColor } from "@/data/syntheticData";
import { weibullFailureProb } from "@/utils/simulationEngine";
import { fmtCompact } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reliability")({
  head: () => ({
    meta: [
      { title: "Reliability & Warranty Analytics | Locomotive Wayam Intelligence" },
      { name: "description", content: "RAMS dashboard, remaining useful life, warranty analytics and failure heatmap." },
    ],
  }),
  component: ReliabilityPage,
});

const TABS = ["RAMS Dashboard", "Remaining Useful Life", "Warranty Analytics", "Failure Heatmap"] as const;

function ReliabilityPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("RAMS Dashboard");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs transition-colors",
              tab === t ? "bg-primary font-semibold text-primary-foreground" : "bg-surface-2 text-text-secondary hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "RAMS Dashboard" && <RamsTab />}
      {tab === "Remaining Useful Life" && <RulTab />}
      {tab === "Warranty Analytics" && <WarrantyTab />}
      {tab === "Failure Heatmap" && <HeatmapTab />}
    </div>
  );
}

function RamsTab() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KPICard label="Reliability (R)" value={87.4} suffix="%" decimals={1} glow="blue" sub="Fleet mean, current age" />
        <KPICard label="Availability (A)" value={94.2} suffix="%" decimals={1} glow="teal" sub="A = MTBF / (MTBF + MTTR)" delay={100} />
        <KPICard label="Maintainability (M)" value={96.1} suffix="%" decimals={1} glow="purple" sub="% completed in planned window" delay={200} />
        <KPICard label="Safety Score" value={99.2} suffix="%" decimals={1} glow="teal" sub="Critical failures avoided" delay={300} />
      </div>
      <p className="text-[11px] text-text-secondary">Aligned with EN 50126 / ISO 55000 / IEC 60300 framework</p>
      <GlassCard className="dot-grid">
        <SectionTitle className="mb-3">Weibull Reliability Curves — Fleet vs Competitors</SectionTitle>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={RELIABILITY_CURVE_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis dataKey="year" stroke={CHART_COLORS.textMuted} fontSize={11} />
            <YAxis stroke={CHART_COLORS.textMuted} fontSize={11} unit="%" />
            <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="es44ac" name="ES44AC (β=2.2, η=88k)" stroke={CHART_COLORS.blue} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="flxdrive" name="FLXdrive (β=1.8, η=90k)" stroke={CHART_COLORS.teal} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="ac4400" name="AC4400 (β=2.0, η=70k)" stroke={CHART_COLORS.orange} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="ge_t4" name="GE T4" stroke={CHART_COLORS.red} strokeDasharray="5 3" dot={false} />
            <Line type="monotone" dataKey="siemens" name="Siemens" stroke={CHART_COLORS.purple} strokeDasharray="5 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>
      <GlassCard>
        <SectionTitle className="mb-3">Component MTBF Table</SectionTitle>
        <div className="max-h-[360px] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-surface-1">
              <tr className="border-b border-border text-[10px] uppercase text-text-muted">
                {["Component", "MTBF (hrs)", "MTTR (hrs)", "Hours", "RUL (yrs)", "Confidence", "Health"].map((h) => (
                  <th key={h} className="px-2 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono-data">
              {COMPONENTS.map((c) => (
                <tr key={c.id} className="border-b border-border/40">
                  <td className="px-2 py-2 font-sans">{c.name}</td>
                  <td className="px-2 py-2">{c.mtbfHours.toLocaleString()}</td>
                  <td className="px-2 py-2">{c.mttrHours}</td>
                  <td className="px-2 py-2">{c.currentHours.toLocaleString()}</td>
                  <td className="px-2 py-2">{c.rulYears}</td>
                  <td className="px-2 py-2">{c.rulConfidence}%</td>
                  <td className="px-2 py-2" style={{ color: healthColor(c.healthScore) }}>{c.healthScore}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </>
  );
}

function RulTab() {
  const sorted = [...COMPONENTS].sort((a, b) => a.rulYears - b.rulYears);
  const maxRul = Math.max(...sorted.map((c) => c.rulYears));
  return (
    <GlassCard scanline>
      <SectionTitle className="mb-4">Remaining Useful Life — Ranked by Urgency</SectionTitle>
      <div className="space-y-3">
        {sorted.map((c) => {
          const pct = (c.rulYears / maxRul) * 100;
          const urgent = c.rulYears < 1;
          return (
            <div key={c.id} className="flex items-center gap-3 text-xs">
              <span className="w-52 shrink-0 truncate">
                {urgent ? "⚠ " : ""}{c.name}
              </span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full rounded-full" style={{ width: `${Math.max(2, pct)}%`, background: healthColor(pct) }} />
              </div>
              <span className="font-mono-data w-20 text-right">{c.rulYears} yrs</span>
              <span className="font-mono-data w-16 text-right text-text-muted">{c.rulConfidence}%</span>
              {urgent && <span className="rounded bg-red/15 px-1.5 py-0.5 text-[9px] font-bold text-red">URGENT</span>}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function WarrantyTab() {
  const YEARS = 10;
  return (
    <>
      <GlassCard>
        <SectionTitle className="mb-3">Warranty Coverage Map (Years 0–10)</SectionTitle>
        <div className="space-y-1.5">
          {COMPONENTS.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-[10px]">
              <span className="w-48 shrink-0 truncate text-text-secondary">{c.name}</span>
              <div className="flex h-4 flex-1 overflow-hidden rounded">
                {Array.from({ length: YEARS }, (_, y) => {
                  const covered = y < c.warrantyYears;
                  const extended = !covered && y < c.warrantyYears + 2;
                  return (
                    <div
                      key={y}
                      className="flex-1 border-r border-background"
                      style={{ background: covered ? CHART_COLORS.blue : extended ? `${CHART_COLORS.blue}55` : "#111E35" }}
                      title={covered ? "Full warranty" : extended ? "Extended option" : `Owner cost if failure: ${fmtCompact(c.replacementCost * 1.3)}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-4 text-[10px] text-text-secondary">
          <span><span className="mr-1 inline-block h-2 w-3 rounded-sm bg-primary" />Full warranty</span>
          <span><span className="mr-1 inline-block h-2 w-3 rounded-sm bg-primary/40" />Extended option</span>
          <span><span className="mr-1 inline-block h-2 w-3 rounded-sm bg-surface-3" />Owner cost</span>
        </div>
      </GlassCard>
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard>
          <p className="text-xs text-text-secondary">Standard Warranty (3yr)</p>
          <p className="font-display mt-1 text-xl font-bold text-primary">$420,000</p>
          <p className="text-[11px] text-text-muted">component savings</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-text-secondary">Extended Warranty (5yr)</p>
          <p className="font-display mt-1 text-xl font-bold text-teal">$680,000</p>
          <p className="text-[11px] text-text-muted">total savings · cost $85,000 one-time</p>
        </GlassCard>
        <GlassCard className="border-teal/30">
          <p className="text-xs text-text-secondary">Net Benefit</p>
          <p className="font-display mt-1 text-xl font-bold text-teal">$595,000 ★</p>
          <p className="text-[11px] font-semibold text-teal">RECOMMENDED</p>
        </GlassCard>
      </div>
    </>
  );
}

function HeatmapTab() {
  const YEARS = 20;
  return (
    <GlassCard>
      <SectionTitle className="mb-3">Failure Probability Heatmap — 1 − R(t) per Year</SectionTitle>
      <div className="space-y-1">
        {COMPONENTS.map((c) => (
          <div key={c.id} className="flex items-center gap-2 text-[10px]">
            <span className="w-48 shrink-0 truncate text-text-secondary">{c.name}</span>
            <div className="flex h-5 flex-1 gap-px">
              {Array.from({ length: YEARS }, (_, y) => {
                const p = weibullFailureProb((y + 1) * 5500, c.weibullBeta, c.weibullEta);
                const color =
                  p < 0.25 ? `rgba(30,138,255,${0.15 + p})` : p < 0.6 ? `rgba(245,158,11,${0.3 + p * 0.5})` : `rgba(239,68,68,${0.35 + p * 0.5})`;
                return <div key={y} className="flex-1 rounded-[2px]" style={{ background: color }} title={`Year ${y + 1}: ${(p * 100).toFixed(0)}%`} />;
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-text-secondary">
        <span>Low</span>
        <div className="h-2 w-40 rounded-full" style={{ background: "linear-gradient(90deg, rgba(30,138,255,0.4), rgba(245,158,11,0.7), rgba(239,68,68,0.9))" }} />
        <span>High</span>
        <span className="ml-4 text-text-muted">Assumes 5,500 operating hours / year</span>
      </div>
    </GlassCard>
  );
}
