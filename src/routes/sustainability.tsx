import { createFileRoute } from "@tanstack/react-router";
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { KPICard } from "@/components/shared/KPICard";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import { SUSTAINABILITY_DATA, CHART_COLORS } from "@/data/syntheticData";

export const Route = createFileRoute("/sustainability")({
  head: () => ({
    meta: [
      { title: "Sustainability Dashboard | TCO Intelligence" },
      { name: "description", content: "Fleet CO₂ emissions, carbon cost and sustainability scoring." },
    ],
  }),
  component: Sustainability,
});

const EMISSIONS_TIMELINE = [
  { year: 2020, es44ac: 2930, ac4400: 1980, flxdrive: 0 },
  { year: 2021, es44ac: 2950, ac4400: 1995, flxdrive: 0 },
  { year: 2022, es44ac: 2933, ac4400: 1981, flxdrive: 262 },
  { year: 2023, es44ac: 2910, ac4400: 1960, flxdrive: 262 },
  { year: 2024, es44ac: 2933, ac4400: 1981, flxdrive: 262 },
  { year: 2026, es44ac: 2850, ac4400: 1500, flxdrive: 520 },
  { year: 2028, es44ac: 2700, ac4400: 990, flxdrive: 790 },
  { year: 2030, es44ac: 2550, ac4400: 500, flxdrive: 1050 },
];

const CO2_PER_KM = [
  { name: "FLXdrive", v: 233, color: CHART_COLORS.teal },
  { name: "Siemens Vectron", v: 890, color: CHART_COLORS.purple },
  { name: "Alstom Prima", v: 960, color: CHART_COLORS.yellow },
  { name: "Wabtec ES44AC", v: 970, color: CHART_COLORS.blue },
  { name: "AC4400 Legacy", v: 1005, color: CHART_COLORS.orange },
  { name: "GE T4", v: 1020, color: CHART_COLORS.red },
];

function Sustainability() {
  const rows = [
    { model: "FLXdrive", co2: "233g ★", eff: SUSTAINABILITY_DATA.flxdrive.energyEfficiencyScore, cost: SUSTAINABILITY_DATA.flxdrive.annualCarbonCost, score: SUSTAINABILITY_DATA.flxdrive.sustainabilityScore },
    { model: "ES44AC", co2: "970g", eff: SUSTAINABILITY_DATA.es44ac.energyEfficiencyScore, cost: SUSTAINABILITY_DATA.es44ac.annualCarbonCost, score: SUSTAINABILITY_DATA.es44ac.sustainabilityScore },
    { model: "AC4400", co2: "1,005g", eff: SUSTAINABILITY_DATA.ac4400.energyEfficiencyScore, cost: SUSTAINABILITY_DATA.ac4400.annualCarbonCost, score: SUSTAINABILITY_DATA.ac4400.sustainabilityScore },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KPICard label="Fleet CO₂ (annual)" value={2844} suffix=" t" glow="yellow" sub="vs target 2,500t — above target ⚠" />
        <KPICard label="FLXdrive Savings" value={192} prefix="−" suffix=" t CO₂/yr" glow="teal" sub="vs diesel equivalent" delay={100} />
        <KPICard label="Carbon Cost (annual)" value={136512} prefix="$" glow="orange" sub="at $48/tonne" delay={200} />
        <KPICard label="Sustainability Score" value={68} suffix="/100" glow="blue" sub="Partially aligned with EU Green Deal" delay={300} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <GlassCard className="dot-grid">
          <SectionTitle className="mb-3">Fleet Emissions Timeline (tonnes CO₂)</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={EMISSIONS_TIMELINE}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="year" stroke={CHART_COLORS.textMuted} fontSize={11} />
              <YAxis stroke={CHART_COLORS.textMuted} fontSize={11} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v.toLocaleString()} t`} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={2500} stroke={CHART_COLORS.yellow} strokeDasharray="5 3" label={{ value: "Target 2,500t", fill: CHART_COLORS.yellow, fontSize: 10 }} />
              <Area type="monotone" dataKey="es44ac" name="ES44AC fleet" stackId="1" stroke={CHART_COLORS.blue} fill={CHART_COLORS.blue} fillOpacity={0.4} />
              <Area type="monotone" dataKey="ac4400" name="AC4400 fleet" stackId="1" stroke={CHART_COLORS.orange} fill={CHART_COLORS.orange} fillOpacity={0.4} />
              <Area type="monotone" dataKey="flxdrive" name="FLXdrive fleet" stackId="1" stroke={CHART_COLORS.teal} fill={CHART_COLORS.teal} fillOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-text-muted">FLXdrive fleet added 2022 — CO₂ trajectory drops 22% by 2030</p>
        </GlassCard>

        <GlassCard>
          <SectionTitle className="mb-3">CO₂ per km — Fleet vs Competitors</SectionTitle>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={CO2_PER_KM} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
              <XAxis type="number" stroke={CHART_COLORS.textMuted} fontSize={10} unit="g" />
              <YAxis type="category" dataKey="name" stroke={CHART_COLORS.textMuted} fontSize={10} width={110} />
              <Tooltip content={<ChartTooltip formatter={(v) => `${v} g/km`} />} />
              <Bar dataKey="v" name="CO₂ g/km" radius={[0, 4, 4, 0]}>
                {CO2_PER_KM.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <GlassCard>
          <SectionTitle className="mb-3">Sustainability Scoring</SectionTitle>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase text-text-muted">
                {["Model", "CO₂/km", "Fuel Eff", "Carbon Cost/yr", "Score"].map((h) => (
                  <th key={h} className="py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono-data">
              {rows.map((r) => (
                <tr key={r.model} className="border-b border-border/40">
                  <td className="py-2.5 font-sans">{r.model}</td>
                  <td className="py-2.5">{r.co2}</td>
                  <td className="py-2.5">{r.eff}/100</td>
                  <td className="py-2.5">${r.cost.toLocaleString()}</td>
                  <td className="py-2.5">
                    <span className="mr-2 inline-block h-1.5 w-20 overflow-hidden rounded-full bg-surface-3 align-middle">
                      <span className="block h-full rounded-full bg-teal" style={{ width: `${r.score}%` }} />
                    </span>
                    {r.score}/100
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>

        <GlassCard className="border-teal/25">
          <SectionTitle className="mb-3">Fuel Savings Calculator</SectionTitle>
          <p className="text-sm text-text-secondary">By switching 4 AC4400 locos to FLXdrive, the fleet saves:</p>
          <div className="font-mono-data mt-3 space-y-2 text-sm">
            <p className="text-teal">• $328,000/year fuel cost</p>
            <p className="text-teal">• 780 tonnes CO₂/year</p>
            <p className="text-teal">• $37,440/year carbon tax avoided</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
