import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import { LOCOMOTIVES, SYSTEMS, ASSEMBLIES, COMPONENTS, STANDARDS_COMPLIANCE, type Component } from "@/data/syntheticData";
import { fmtUSD } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/configure")({
  head: () => ({
    meta: [
      { title: "Configuration | Locomotive Wayam Intelligence" },
      { name: "description", content: "Product hierarchy configuration, maintenance rule builder and standards compliance." },
    ],
  }),
  component: ConfigurePage,
});

const TABS = ["Product Configuration", "Maintenance Rules", "Standards Compliance"] as const;

function ConfigurePage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Product Configuration");
  const [selected, setSelected] = useState<Component | null>(COMPONENTS[4]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("rounded-md px-3 py-1.5 text-xs", tab === t ? "bg-primary font-semibold text-primary-foreground" : "bg-surface-2 text-text-secondary hover:text-foreground")}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Product Configuration" && (
        <div className="grid gap-5 xl:grid-cols-2">
          <GlassCard>
            <SectionTitle className="mb-3">Product Hierarchy</SectionTitle>
            <div className="max-h-[480px] space-y-1 overflow-y-auto text-xs">
              {LOCOMOTIVES.map((l) => (
                <div key={l.id}>
                  <p className="font-display py-1 font-semibold text-primary">{l.model}</p>
                  {SYSTEMS.filter((s) => s.locomotiveId === l.id).map((s) => (
                    <div key={s.id} className="ml-3">
                      <p className="py-0.5 text-text-secondary">{s.name}</p>
                      {ASSEMBLIES.filter((a) => a.systemId === s.id).map((a) => (
                        <div key={a.id} className="ml-3">
                          <p className="py-0.5 text-text-muted">{a.name}</p>
                          {COMPONENTS.filter((c) => c.assemblyId === a.id).map((c) => (
                            <button
                              key={c.id}
                              onClick={() => setSelected(c)}
                              className={cn("ml-3 block w-full rounded px-1.5 py-0.5 text-left", selected?.id === c.id ? "bg-primary/15 text-primary" : "text-foreground/80 hover:bg-surface-2")}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard>
            <SectionTitle className="mb-3">Component Editor</SectionTitle>
            {selected ? (
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ["Name", selected.name],
                  ["Category", selected.category],
                  ["Purchase Cost", fmtUSD(selected.purchaseCost)],
                  ["Replacement Cost", fmtUSD(selected.replacementCost)],
                  ["Design Life", `${selected.lifeYears} yrs`],
                  ["Weibull β / η", `${selected.weibullBeta} / ${selected.weibullEta.toLocaleString()}h`],
                  ["MTBF / MTTR", `${selected.mtbfHours.toLocaleString()}h / ${selected.mttrHours}h`],
                  ["Warranty", `${selected.warrantyYears} yrs`],
                  ["PM: Time", selected.pmTrigger.intervalMonths ? `${selected.pmTrigger.intervalMonths} mo` : "—"],
                  ["PM: Distance", selected.pmTrigger.intervalKm ? `${selected.pmTrigger.intervalKm.toLocaleString()} km` : "—"],
                  ["PM: Hours", selected.pmTrigger.intervalHours ? `${selected.pmTrigger.intervalHours.toLocaleString()} hrs` : "—"],
                  ["Downtime $/day", fmtUSD(selected.downtimeCostPerDay)],
                ].map(([l, v]) => (
                  <label key={l} className="text-text-secondary">
                    {l}
                    <input readOnly value={v as string} className="font-mono-data mt-1 w-full rounded-md border border-border bg-surface-2 px-2 py-1.5 text-foreground outline-none" />
                  </label>
                ))}
                <p className="col-span-2 text-[10px] text-text-muted">In-memory demo data — edits persist for the session only.</p>
              </div>
            ) : (
              <p className="text-xs text-text-muted">Select a component from the tree.</p>
            )}
          </GlassCard>
        </div>
      )}

      {tab === "Maintenance Rules" && (
        <div className="grid gap-4 md:grid-cols-2">
          {COMPONENTS.filter((c) => c.pmTrigger.intervalMonths).slice(0, 8).map((c) => (
            <GlassCard key={c.id}>
              <p className="font-display text-sm font-semibold">{c.name}</p>
              <div className="font-mono-data mt-3 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-text-secondary">Rule 1 · Time</span><span>every {c.pmTrigger.intervalMonths} months</span></div>
                {c.pmTrigger.intervalKm && <div className="flex justify-between"><span className="text-text-secondary">Rule 2 · Km</span><span>every {c.pmTrigger.intervalKm.toLocaleString()} km</span></div>}
                {c.pmTrigger.intervalHours && <div className="flex justify-between"><span className="text-text-secondary">Rule 3 · Hours</span><span>every {c.pmTrigger.intervalHours.toLocaleString()} hrs</span></div>}
                <div className="flex justify-between border-t border-border/40 pt-2"><span className="text-text-secondary">Logic</span><span className="text-primary">Whichever comes first</span></div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {tab === "Standards Compliance" && (
        <GlassCard>
          <SectionTitle className="mb-4">Railway Standards Alignment</SectionTitle>
          <div className="space-y-3">
            {STANDARDS_COMPLIANCE.map((s) => (
              <div key={s.standard} className="flex items-center gap-3 text-xs">
                <span className="font-mono-data w-28 shrink-0 font-semibold">{s.standard}</span>
                <span className="w-64 shrink-0 text-text-secondary">{s.name}</span>
                <span className={cn("w-20 shrink-0 rounded px-1.5 py-0.5 text-center text-[10px] font-semibold", s.status === "Aligned" ? "bg-teal/15 text-teal" : s.status === "Partial" ? "bg-yellow/15 text-yellow" : "bg-surface-3 text-text-secondary")}>
                  {s.status}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${s.coverage}%` }} />
                </div>
                <span className="font-mono-data w-10 text-right">{s.coverage}%</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-text-muted">
            This platform is designed in alignment with RAMS methodology (EN 50126), LCC methodology (IEC 60300), and Asset Management principles (ISO 55000).
          </p>
        </GlassCard>
      )}
    </div>
  );
}
