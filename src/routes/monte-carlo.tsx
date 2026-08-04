import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Zap } from "lucide-react";
import { KPICard } from "@/components/shared/KPICard";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import { MONTE_CARLO_RESULTS, CHART_COLORS } from "@/data/syntheticData";
import { fmtCompact } from "@/utils/formatters";

export const Route = createFileRoute("/monte-carlo")({
  head: () => ({
    meta: [
      { title: "Monte Carlo Risk Simulation | Locomotive Wayam Intelligence" },
      { name: "description", content: "1,000-run probabilistic TCO simulation with percentile bands and variance drivers." },
    ],
  }),
  component: MonteCarloPage,
});

const MC = MONTE_CARLO_RESULTS;

function MonteCarloPage() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(100);

  const rerun = () => {
    if (running) return;
    setRunning(true);
    setProgress(0);
    const start = Date.now();
    const iv = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / 2000) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(iv);
        setRunning(false);
      }
    }, 40);
  };

  const barColor = (i: number) => {
    if (i <= 1) return CHART_COLORS.green;
    if (i <= 4) return CHART_COLORS.blue;
    if (i <= 6) return CHART_COLORS.orange;
    return CHART_COLORS.red;
  };

  const percentiles = [
    { p: "P5 (Best)", v: MC.p5 },
    { p: "P10", v: MC.p10 },
    { p: "P25", v: MC.p25 },
    { p: "P50 (Median)", v: MC.p50 },
    { p: "P75", v: MC.p75 },
    { p: "P90", v: MC.p90 },
    { p: "P95 (Worst)", v: MC.p95 },
  ];

  const inputRanges = [
    { input: "Fuel Price", dist: "Log-normal", min: "$1.10", max: "$2.80", sd: "$0.35" },
    { input: "Failure Rate", dist: "Gamma", min: "0.5×", max: "3.0×", sd: "0.4×" },
    { input: "Labor Rate", dist: "Normal", min: "$75", max: "$145", sd: "$18" },
    { input: "Inflation (Labor)", dist: "Normal", min: "1.5%", max: "6.5%", sd: "1.0%" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KPICard label="P50 Median TCO" value={3.82} prefix="$" suffix="M" decimals={2} glow="blue" sub="Most likely outcome" />
        <KPICard label="P90 (Worst 10%)" value={4.35} prefix="$" suffix="M" decimals={2} glow="red" sub="+$530k vs baseline" delay={100} />
        <KPICard label="P10 (Best 10%)" value={3.42} prefix="$" suffix="M" decimals={2} glow="teal" sub="−$400k vs baseline" delay={200} />
        <KPICard label="Risk Range P10→P90" value={930} prefix="$" suffix="K" glow="purple" sub={`σ = ${fmtCompact(MC.stdDev)} · n=${MC.n}`} delay={300} />
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        {/* Histogram */}
        <GlassCard className="dot-grid xl:col-span-3" scanline>
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle>TCO Outcome Distribution</SectionTitle>
            <button
              onClick={rerun}
              disabled={running}
              className="flex items-center gap-1.5 rounded-md bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/25 disabled:opacity-50"
            >
              <Zap size={12} /> {running ? "Running…" : "Re-run Monte Carlo"}
            </button>
          </div>
          {running && (
            <div className="mb-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="font-mono-data mt-1 text-[10px] text-text-secondary">
                {Math.round((progress / 100) * 1000)} / 1,000 simulations
              </p>
            </div>
          )}
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={MC.histogram} style={{ opacity: running ? 0.3 : 1, transition: "opacity 0.3s" }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="bin" stroke={CHART_COLORS.textMuted} fontSize={9} angle={-20} textAnchor="end" height={50} />
              <YAxis stroke={CHART_COLORS.textMuted} fontSize={10} label={{ value: "Runs", angle: -90, fontSize: 10, fill: CHART_COLORS.textMuted, position: "insideLeft" }} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v} runs`} />} />
              <ReferenceLine x="$3.8M – $4.0M" stroke="#E8F0FE" strokeDasharray="3 3" label={{ value: "P50", fill: "#E8F0FE", fontSize: 10 }} />
              <Bar dataKey="count" name="Simulation runs" radius={[4, 4, 0, 0]}>
                {MC.histogram.map((_, i) => (
                  <Cell key={i} fill={barColor(i)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-center text-[10px] text-text-muted">Based on 1,000 Monte Carlo simulations · 20yr horizon</p>
        </GlassCard>

        {/* Variance drivers */}
        <GlassCard className="xl:col-span-2">
          <SectionTitle className="mb-3">Risk Contribution to TCO Variance</SectionTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={MC.varianceDrivers} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
              <XAxis type="number" stroke={CHART_COLORS.textMuted} fontSize={10} unit="%" />
              <YAxis type="category" dataKey="param" stroke={CHART_COLORS.textMuted} fontSize={10} width={100} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v}%`} />} />
              <Bar dataKey="contribution" name="Variance share" radius={[0, 4, 4, 0]}>
                {MC.varianceDrivers.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? CHART_COLORS.red : i < 3 ? CHART_COLORS.orange : CHART_COLORS.blue} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-[11px] leading-relaxed text-text-secondary">
            Failure-rate uncertainty is now the largest driver (22%). Condition-based maintenance and reman parts tighten this distribution the most.
          </p>
        </GlassCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Percentile table */}
        <GlassCard>
          <SectionTitle className="mb-3">Percentile Outcomes</SectionTitle>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase text-text-muted">
                <th className="py-2">Percentile</th>
                <th className="py-2">TCO</th>
                <th className="py-2">vs Baseline</th>
              </tr>
            </thead>
            <tbody className="font-mono-data">
              {percentiles.map((row) => {
                const d = row.v - MC.p50;
                return (
                  <tr key={row.p} className="border-b border-border/40">
                    <td className="py-2 font-sans text-text-secondary">{row.p}</td>
                    <td className="py-2">{fmtCompact(row.v)}</td>
                    <td className={`py-2 ${d < 0 ? "text-teal" : d > 0 ? "text-red" : "text-text-muted"}`}>
                      {d === 0 ? "—" : `${d > 0 ? "+" : "−"}${fmtCompact(Math.abs(d))} (${d > 0 ? "+" : "−"}${Math.abs((d / MC.p50) * 100).toFixed(0)}%)`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </GlassCard>

        {/* Input ranges */}
        <GlassCard>
          <SectionTitle className="mb-3">Randomized Input Distributions</SectionTitle>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase text-text-muted">
                <th className="py-2">Input</th>
                <th className="py-2">Distribution</th>
                <th className="py-2">Min</th>
                <th className="py-2">Max</th>
                <th className="py-2">Std Dev</th>
              </tr>
            </thead>
            <tbody className="font-mono-data">
              {inputRanges.map((r) => (
                <tr key={r.input} className="border-b border-border/40">
                  <td className="py-2.5 font-sans text-text-secondary">{r.input}</td>
                  <td className="py-2.5">{r.dist}</td>
                  <td className="py-2.5">{r.min}</td>
                  <td className="py-2.5">{r.max}</td>
                  <td className="py-2.5">{r.sd}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-text-secondary">
            Each run samples all four inputs and re-computes the full 20-year TCO with Weibull failure draws.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
