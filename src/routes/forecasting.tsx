import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  ScatterChart,
  Scatter,
} from "recharts";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import { HISTORICAL_TCO, FORECAST_TCO, CHART_COLORS } from "@/data/syntheticData";
import { fmtCompact } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/forecasting")({
  head: () => ({
    meta: [
      { title: "Forecasting Engine | Locomotive TCO Intelligence" },
      { name: "description", content: "Trend-based lifecycle cost forecasting with confidence intervals and calibration." },
    ],
  }),
  component: ForecastingEngine,
});

const METHODS = ["Linear Trend", "Exponential", "Moving Avg"] as const;

const CATEGORY_META = [
  { key: "maintenance", label: "Maintenance", icon: "🔧", conf: 91 },
  { key: "labor", label: "Labor", icon: "👷", conf: 93 },
  { key: "consumables", label: "Consumables", icon: "🛢", conf: 95 },
  { key: "failures", label: "Failures", icon: "⚠️", conf: 74 },
  { key: "downtime", label: "Downtime", icon: "⏸", conf: 78 },
] as const;

function cagr(a: number, b: number, years: number) {
  return (Math.pow(b / a, 1 / years) - 1) * 100;
}

function ForecastingEngine() {
  const [method, setMethod] = useState<(typeof METHODS)[number]>("Linear Trend");
  const [withInflation, setWithInflation] = useState(true);
  const [showCompetitors, setShowCompetitors] = useState(false);

  const methodMult = method === "Exponential" ? 1.05 : method === "Moving Avg" ? 0.97 : 1;
  const infMult = withInflation ? 1 : 0.94;

  const data = [
    ...HISTORICAL_TCO.map((h) => ({
      year: h.year,
      total: h.maintenance + h.consumables + h.labor + h.failures + h.fuel + h.downtime,
      p10: undefined as number | undefined,
      p90: undefined as number | undefined,
      geForecast: undefined as number | undefined,
      siemensForecast: undefined as number | undefined,
    })),
    ...FORECAST_TCO.map((f) => {
      const total = (f.maintenance + f.consumables + f.labor + f.failures + f.fuel + f.downtime) * methodMult * infMult;
      return {
        year: f.year,
        total,
        p10: f.p10 * methodMult * infMult,
        p90: f.p90 * methodMult * infMult,
        geForecast: showCompetitors ? total * 1.07 : undefined,
        siemensForecast: showCompetitors ? total * 1.04 : undefined,
      };
    }),
  ];

  const calibration = [
    { metric: "2023 Total Cost", forecast: 848000, actual: 834000 },
    { metric: "2023 Maintenance", forecast: 162000, actual: 165000 },
    { metric: "2023 Fuel Cost", forecast: 428000, actual: 435000 },
    { metric: "2024 Total Cost", forecast: 821000, actual: 881000 },
  ];

  return (
    <div className="space-y-5">
      {/* Controls */}
      <GlassCard className="flex flex-wrap items-center gap-3">
        <span className="rounded-lg border border-purple/40 bg-purple/15 px-3 py-1.5">
          <span className="text-[10px] uppercase tracking-wider text-text-secondary">Forecast Accuracy </span>
          <span className="font-mono-data text-sm font-bold text-chart-4">94.2%</span>
        </span>
        <div className="flex overflow-hidden rounded-md border border-border text-[11px]">
          {METHODS.map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={cn("px-3 py-1.5", method === m ? "bg-primary font-semibold text-primary-foreground" : "bg-surface-2 text-text-secondary")}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex overflow-hidden rounded-md border border-border text-[11px]">
          <button onClick={() => setWithInflation(true)} className={withInflation ? "bg-primary px-3 py-1.5 text-primary-foreground" : "bg-surface-2 px-3 py-1.5 text-text-secondary"}>
            With Inflation
          </button>
          <button onClick={() => setWithInflation(false)} className={!withInflation ? "bg-primary px-3 py-1.5 text-primary-foreground" : "bg-surface-2 px-3 py-1.5 text-text-secondary"}>
            Without
          </button>
        </div>
        <button
          onClick={() => setShowCompetitors(!showCompetitors)}
          className={cn(
            "rounded-md border px-3 py-1.5 text-[11px]",
            showCompetitors ? "border-orange/40 bg-orange/15 text-orange" : "border-border text-text-secondary",
          )}
        >
          Competitor overlay
        </button>
      </GlassCard>

      {/* Main chart */}
      <GlassCard className="dot-grid" scanline>
        <SectionTitle className="mb-3">Historical vs Forecast — Annual Operating Cost</SectionTitle>
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis dataKey="year" stroke={CHART_COLORS.textMuted} fontSize={11} />
            <YAxis stroke={CHART_COLORS.textMuted} fontSize={11} tickFormatter={(v: number) => fmtCompact(v)} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine
              x={2024.5}
              stroke={CHART_COLORS.blue}
              strokeWidth={2}
              label={{ value: "TODAY", fill: CHART_COLORS.blue, fontSize: 10, position: "top" }}
            />
            <Area type="monotone" dataKey="p90" name="90% confidence" stroke="none" fill={CHART_COLORS.blue} fillOpacity={0.12} />
            <Area type="monotone" dataKey="p10" name=" " legendType="none" stroke="none" fill="#04070F" fillOpacity={0.5} />
            <Line type="monotone" dataKey="total" name="Total annual cost" stroke={CHART_COLORS.teal} strokeWidth={2.5} dot={{ r: 3 }} />
            {showCompetitors && (
              <>
                <Line type="monotone" dataKey="geForecast" name="GE T4 forecast" stroke={CHART_COLORS.orange} strokeDasharray="5 3" dot={false} />
                <Line type="monotone" dataKey="siemensForecast" name="Siemens forecast" stroke={CHART_COLORS.purple} strokeDasharray="5 3" dot={false} />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </GlassCard>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Category cards */}
        <div>
          <SectionTitle className="mb-3">Per-Category Forecasts</SectionTitle>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {CATEGORY_META.map((c) => {
              const h2024 = HISTORICAL_TCO[4][c.key as keyof (typeof HISTORICAL_TCO)[0]] as number;
              const f2025 = FORECAST_TCO[0][c.key as keyof (typeof FORECAST_TCO)[0]] as number;
              const f2026 = FORECAST_TCO[1][c.key as keyof (typeof FORECAST_TCO)[0]] as number;
              const f2029 = FORECAST_TCO[4][c.key as keyof (typeof FORECAST_TCO)[0]] as number;
              const g = cagr(h2024, f2029, 5);
              return (
                <GlassCard key={c.key} className="p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                    {c.icon} {c.label}
                  </p>
                  <div className="font-mono-data mt-2 space-y-0.5 text-[11px]">
                    <p className="text-text-secondary">2024: <span className="text-foreground">{fmtCompact(h2024)}</span></p>
                    <p className="text-text-secondary">2025f: <span className="text-foreground">{fmtCompact(f2025)}</span></p>
                    <p className="text-text-secondary">2026f: <span className="text-foreground">{fmtCompact(f2026)}</span></p>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className={g > 8 ? "text-red" : g > 4 ? "text-yellow" : "text-teal"}>
                      ↑ {g.toFixed(1)}% CAGR
                    </span>
                    <span className="text-text-muted">{c.conf}% conf</span>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Calibration */}
        <GlassCard>
          <SectionTitle className="mb-3">Forecast Accuracy & Calibration</SectionTitle>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase text-text-muted">
                <th className="py-2">Metric</th>
                <th className="py-2">Forecast</th>
                <th className="py-2">Actual</th>
                <th className="py-2">Accuracy</th>
              </tr>
            </thead>
            <tbody className="font-mono-data">
              {calibration.map((c) => {
                const acc = 100 - Math.abs((c.forecast - c.actual) / c.actual) * 100;
                return (
                  <tr key={c.metric} className="border-b border-border/40">
                    <td className="py-2 font-sans text-text-secondary">{c.metric}</td>
                    <td className="py-2">{fmtCompact(c.forecast)}</td>
                    <td className="py-2">{fmtCompact(c.actual)}</td>
                    <td className={cn("py-2", acc > 97 ? "text-teal" : "text-yellow")}>{acc.toFixed(1)}% {acc > 97 ? "✓" : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <SectionTitle className="mb-1 mt-5">Forecast vs Actual</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart margin={{ top: 10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis type="number" dataKey="forecast" name="Forecast" stroke={CHART_COLORS.textMuted} fontSize={9} tickFormatter={(v: number) => fmtCompact(v)} domain={[100000, 900000]} />
              <YAxis type="number" dataKey="actual" name="Actual" stroke={CHART_COLORS.textMuted} fontSize={9} tickFormatter={(v: number) => fmtCompact(v)} domain={[100000, 900000]} />
              <Tooltip content={<ChartTooltip />} />
              <Scatter data={calibration} fill={CHART_COLORS.teal} />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-text-muted">Dots near the diagonal = high accuracy</p>
        </GlassCard>
      </div>
    </div>
  );
}
