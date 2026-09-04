import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import { useSimulationStore } from "@/store/simulationStore";
import { OPERATING_PROFILES, CHART_COLORS } from "@/data/syntheticData";
import { fmtCompact, fmtUSD } from "@/utils/formatters";

export const Route = createFileRoute("/tender")({
  head: () => ({
    meta: [
      { title: "Tender Optimization | TCO Intelligence" },
      {
        name: "description",
        content: "Build commercial locomotive tender proposals from live simulation output.",
      },
    ],
  }),
  component: TenderMode,
});

function TenderMode() {
  const { result } = useSimulationStore();
  const [customer, setCustomer] = useState("XYZ Rail Freight Ltd");
  const [qty, setQty] = useState(12);
  const [profileId, setProfileId] = useState("heavy-freight");
  const [budget, setBudget] = useState(48000000);

  const unitPrice = 2800000;
  const fleetTco = result.totalTCO * qty;
  const vsBudget = ((budget - fleetTco) / budget) * 100;

  const donut = [
    { name: "Capital", value: result.breakdown.capital, color: CHART_COLORS.blue },
    { name: "Maintenance", value: result.breakdown.maintenance, color: CHART_COLORS.teal },
    { name: "Failures", value: result.breakdown.failures, color: CHART_COLORS.red },
    {
      name: "Other",
      value:
        result.breakdown.consumables + result.breakdown.replacements + result.breakdown.downtime,
      color: CHART_COLORS.purple,
    },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-5">
      {/* Customer profile */}
      <GlassCard>
        <SectionTitle className="mb-3">Customer Requirements</SectionTitle>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-xs text-text-secondary">
            Customer
            <input
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary/50"
            />
          </label>
          <label className="text-xs text-text-secondary">
            Locomotives required
            <input
              type="number"
              value={qty}
              min={1}
              max={100}
              onChange={(e) => setQty(Number(e.target.value) || 1)}
              className="font-mono-data mt-1 w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary/50"
            />
          </label>
          <label className="text-xs text-text-secondary">
            Operating profile
            <select
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-foreground outline-none"
            >
              {OPERATING_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-text-secondary">
            Budget target ($)
            <input
              type="number"
              value={budget}
              step={1000000}
              onChange={(e) => setBudget(Number(e.target.value) || 0)}
              className="font-mono-data mt-1 w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary/50"
            />
          </label>
        </div>
      </GlassCard>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Simulation output */}
        <GlassCard className="dot-grid">
          <SectionTitle className="mb-3">Simulation Results for {customer}</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: "TCO / loco", v: fmtCompact(result.totalTCO) },
              { l: "Fleet TCO", v: fmtCompact(fleetTco) },
              { l: "Maint $/km", v: `$${result.financials.costPerKm.toFixed(2)}` },
            ].map((k) => (
              <div key={k.l} className="rounded-md bg-surface-2 p-2.5 text-center">
                <p className="text-micro uppercase text-text-muted">{k.l}</p>
                <p className="font-mono-data mt-1 text-sm font-bold">{k.v}</p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={donut}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
                strokeWidth={0}
              >
                {donut.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
          <div
            className={`rounded-md p-3 text-xs ${vsBudget >= 0 ? "bg-teal/10 text-teal" : "bg-red/10 text-red"}`}
          >
            {vsBudget >= 0
              ? `Your fleet TCO is ${vsBudget.toFixed(1)}% below the customer budget target.`
              : `Fleet TCO exceeds customer budget by ${Math.abs(vsBudget).toFixed(1)}% — consider extended maintenance intervals or warranty options.`}
          </div>
        </GlassCard>

        {/* Proposal */}
        <GlassCard className="border-primary/25" scanline>
          <SectionTitle className="mb-3">Commercial Proposal Summary</SectionTitle>
          <div className="font-mono-data space-y-0 text-xs">
            {[
              ["Customer", customer],
              ["Locomotive", "ES44AC Evolution Series"],
              ["Quantity", `${qty} units`],
              ["Unit Price", fmtUSD(unitPrice)],
              ["Fleet Price", fmtUSD(unitPrice * qty)],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between border-b border-border/40 py-2">
                <span className="font-sans text-text-secondary">{l}</span>
                <span>{v}</span>
              </div>
            ))}
            <p className="pt-3 text-mini font-bold uppercase tracking-wider text-primary">
              Included Warranties
            </p>
            <div className="flex justify-between border-b border-border/40 py-2">
              <span className="font-sans text-text-secondary">Standard</span>
              <span>3 years</span>
            </div>
            <div className="flex justify-between border-b border-border/40 py-2">
              <span className="font-sans text-text-secondary">Extended option</span>
              <span>+2 yr / $85k per loco</span>
            </div>
            <p className="pt-3 text-mini font-bold uppercase tracking-wider text-primary">
              Lifecycle Cost Guarantee
            </p>
            <div className="flex justify-between border-b border-border/40 py-2">
              <span className="font-sans text-text-secondary">20yr Fleet TCO</span>
              <span>{fmtCompact(fleetTco)}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 py-2">
              <span className="font-sans text-text-secondary">Maint $/km</span>
              <span>$0.18 (best in class)</span>
            </div>
            <div className="flex justify-between border-b border-border/40 py-2">
              <span className="font-sans text-text-secondary">Availability SLA</span>
              <span>≥ 94%</span>
            </div>
            <p className="pt-3 text-mini font-bold uppercase tracking-wider text-primary">
              vs Competitors
            </p>
            <div className="flex justify-between py-2">
              <span className="font-sans text-text-secondary">Savings vs GE</span>
              <span className="text-teal">−{fmtCompact(160000 * qty)} fleet TCO</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-sans text-text-secondary">Savings vs Alstom</span>
              <span className="text-teal">−{fmtCompact(230000 * qty)} fleet TCO</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-mini">
            {["📄 Export Tender PDF", "📊 Export Excel Model", "💾 Save Scenario"].map((b) => (
              <button
                key={b}
                className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-text-secondary transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {b}
              </button>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
