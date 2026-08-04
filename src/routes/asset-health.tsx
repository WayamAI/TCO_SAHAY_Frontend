import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import { HealthRing } from "@/components/shared/HealthRing";
import { LOCOMOTIVES, SYSTEMS, ASSEMBLIES, COMPONENTS, healthColor } from "@/data/syntheticData";
import { weibullFailureProb } from "@/utils/simulationEngine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/asset-health")({
  head: () => ({
    meta: [
      { title: "Asset Health Index | Locomotive TCO Intelligence" },
      { name: "description", content: "Hierarchical health scores: component → system → locomotive → fleet." },
    ],
  }),
  component: AssetHealth,
});

function AssetHealth() {
  const [locoId, setLocoId] = useState("loco-001");
  const fleetHealth =
    LOCOMOTIVES.reduce((s, l) => s + l.currentHealthScore * l.fleetCount, 0) /
    LOCOMOTIVES.reduce((s, l) => s + l.fleetCount, 0);

  const systems = SYSTEMS.filter((s) => s.locomotiveId === locoId);
  const loco = LOCOMOTIVES.find((l) => l.id === locoId)!;

  return (
    <div className="space-y-6">
      {/* Rings */}
      <GlassCard className="flex flex-wrap items-center justify-center gap-10 py-8" scanline>
        <div className="text-center">
          <HealthRing score={fleetHealth} size={140} stroke={12} color="#1E8AFF" />
          <p className="font-display mt-2 text-sm font-semibold">Fleet Health Index</p>
        </div>
        {LOCOMOTIVES.map((l) => (
          <button key={l.id} onClick={() => setLocoId(l.id)} className={cn("rounded-xl p-3 text-center transition-colors", locoId === l.id && "bg-surface-2")}>
            <HealthRing score={l.currentHealthScore} size={92} stroke={8} color={l.color} />
            <p className="mt-2 text-xs font-medium">{l.model.split(" ")[0]}</p>
            {l.currentHealthScore < 75 && <p className="text-[10px] font-bold text-orange">⚠ ATTENTION</p>}
          </button>
        ))}
      </GlassCard>

      {/* System bars */}
      <GlassCard>
        <SectionTitle className="mb-4">System Health — {loco.model}</SectionTitle>
        <div className="space-y-3">
          {systems.map((s) => {
            const asmIds = ASSEMBLIES.filter((a) => a.systemId === s.id).map((a) => a.id);
            const comps = COMPONENTS.filter((c) => asmIds.includes(c.assemblyId));
            const topRisk = comps.sort((a, b) => a.rulYears - b.rulYears)[0];
            const tier = s.healthScore >= 90 ? "● Healthy" : s.healthScore >= 82 ? "● Good" : "◐ Watch";
            return (
              <div key={s.id} className="flex items-center gap-3 text-xs">
                <span className="w-40 shrink-0 text-text-secondary">{s.name}</span>
                <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full" style={{ width: `${s.healthScore}%`, background: healthColor(s.healthScore), transition: "width 0.6s" }} />
                </div>
                <span className="font-mono-data w-12 text-right">{s.healthScore}%</span>
                <span className="w-20" style={{ color: healthColor(s.healthScore) }}>{tier}</span>
                <span className="hidden w-56 truncate text-text-muted lg:block">
                  {topRisk ? `Top risk: ${topRisk.name} — RUL ${topRisk.rulYears}yr` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Component table */}
      <GlassCard>
        <SectionTitle className="mb-3">Component Health Detail</SectionTitle>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-surface-1">
              <tr className="border-b border-border text-[10px] uppercase text-text-muted">
                {["Component", "Health", "Current Hours", "RUL", "Failure Prob (1yr)", "Action"].map((h) => (
                  <th key={h} className="px-2 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPONENTS.map((c) => {
                const p = (weibullFailureProb(c.currentHours + 5500, c.weibullBeta, c.weibullEta) - weibullFailureProb(c.currentHours, c.weibullBeta, c.weibullEta)) * 100;
                return (
                  <tr key={c.id} className="border-b border-border/40" style={{ background: `${healthColor(c.healthScore)}0d` }}>
                    <td className="px-2 py-2.5">{c.name}</td>
                    <td className="font-mono-data px-2 py-2.5" style={{ color: healthColor(c.healthScore) }}>{c.healthScore}%</td>
                    <td className="font-mono-data px-2 py-2.5">{c.currentHours.toLocaleString()}</td>
                    <td className="font-mono-data px-2 py-2.5">{c.rulYears} yr</td>
                    <td className="font-mono-data px-2 py-2.5">{p.toFixed(1)}%</td>
                    <td className="px-2 py-2.5">
                      <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-semibold", c.rulYears < 1 ? "bg-red/15 text-red" : "bg-primary/15 text-primary")}>
                        {c.rulYears < 1 ? "Schedule Maint" : "Monitor"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
