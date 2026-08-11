import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import {
  LOCOMOTIVES,
  SYSTEMS,
  ASSEMBLIES,
  COMPONENTS,
  healthColor,
  CHART_COLORS,
  type Component,
} from "@/data/syntheticData";
import { weibullReliability } from "@/utils/simulationEngine";
import { fmtUSD, fmtCompact } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fleet-explorer")({
  head: () => ({
    meta: [
      { title: "Fleet Explorer | TCO Intelligence" },
      { name: "description", content: "Explore the locomotive → system → assembly → component hierarchy with health and reliability detail." },
    ],
  }),
  component: FleetExplorer,
});

type NodeKind = "loco" | "system" | "assembly" | "component";

interface RadialNode {
  id: string;
  name: string;
  kind: NodeKind;
  ring: number; // 0 loco, 1 system, 2 assembly, 3 component
  angle: number;
  color: string;
  dim: boolean;
  parentId?: string;
  component?: Component;
}

/**
 * Lay the hierarchy out as nested angular sectors: each system owns a slice of
 * the circle, its assemblies split that slice, and components split their
 * assembly's slice. Laying children out by a flat global index (the previous
 * approach) put unrelated nodes on top of each other, which made most of them
 * impossible to click.
 */
function buildRadial(locoId: string, search: string): RadialNode[] {
  const loco = LOCOMOTIVES.find((l) => l.id === locoId)!;
  const systems = SYSTEMS.filter((s) => s.locomotiveId === locoId);
  const nodes: RadialNode[] = [
    { id: loco.id, name: loco.model, kind: "loco", ring: 0, angle: 0, color: CHART_COLORS.blue, dim: false },
  ];

  const q = search.trim().toLowerCase();
  const matches = (name: string) => !q || name.toLowerCase().includes(q);

  const sectorPer = 360 / Math.max(1, systems.length);

  systems.forEach((s, si) => {
    const sysStart = si * sectorPer;
    // Centre the system node in its own sector.
    nodes.push({
      id: s.id,
      name: s.name,
      kind: "system",
      ring: 1,
      angle: sysStart + sectorPer / 2,
      color: healthColor(s.healthScore),
      dim: !matches(s.name),
      parentId: loco.id,
    });

    const asms = ASSEMBLIES.filter((a) => a.systemId === s.id);
    const asmPer = sectorPer / Math.max(1, asms.length);

    asms.forEach((a, ai) => {
      const asmStart = sysStart + ai * asmPer;
      nodes.push({
        id: a.id,
        name: a.name,
        kind: "assembly",
        ring: 2,
        angle: asmStart + asmPer / 2,
        color: CHART_COLORS.textSecondary,
        dim: !matches(a.name),
        parentId: s.id,
      });

      const comps = COMPONENTS.filter((c) => c.assemblyId === a.id);
      const compPer = asmPer / Math.max(1, comps.length);

      comps.forEach((c, ci) => {
        const dim = !matches(c.name);
        nodes.push({
          id: c.id,
          name: c.name,
          kind: "component",
          ring: 3,
          angle: asmStart + ci * compPer + compPer / 2,
          color: dim ? "#22304a" : healthColor(c.healthScore),
          dim,
          parentId: a.id,
          component: c,
        });
      });
    });
  });

  return nodes;
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

const RING_R = [0, 70, 130, 195];

function FleetExplorer() {
  const [locoId, setLocoId] = useState("loco-001");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>("cmp-005");

  const nodes = useMemo(() => buildRadial(locoId, search), [locoId, search]);
  const selected = nodes.find((n) => n.id === selectedId);
  const selectedComp = selected?.component ?? COMPONENTS.find((c) => c.id === selectedId);

  const size = 440;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      {/* Radial tree */}
      <GlassCard className="xl:col-span-2">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {LOCOMOTIVES.map((l) => (
            <button
              key={l.id}
              onClick={() => { setLocoId(l.id); setSelectedId(null); }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                locoId === l.id ? "border-primary bg-primary/15 font-semibold text-primary" : "border-border text-text-secondary hover:text-foreground",
              )}
            >
              {l.model.split(" ")[0]}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search components…"
          className="mb-3 w-full rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs outline-none placeholder:text-text-muted focus:border-primary/50"
        />
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full">
          {/* ring guides */}
          {RING_R.slice(1).map((r) => (
            <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={CHART_COLORS.grid} strokeDasharray="2 4" />
          ))}
          {/* links */}
          {nodes
            .filter((n) => n.parentId)
            .map((n) => {
              const parent = nodes.find((p) => p.id === n.parentId);
              if (!parent) return null;
              const p1 = polar(cx, cy, RING_R[parent.ring], parent.angle);
              const p2 = polar(cx, cy, RING_R[n.ring], n.angle);
              return <line key={`l-${n.id}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={CHART_COLORS.grid} strokeWidth={1} />;
            })}
          {/* nodes */}
          {nodes.map((n) => {
            const pos = polar(cx, cy, RING_R[n.ring], n.angle);
            const rNode = n.ring === 0 ? 22 : n.ring === 1 ? 10 : n.ring === 2 ? 6 : 8;
            const isSel = n.id === selectedId;
            return (
              <g
                key={n.id}
                className="cursor-pointer"
                onClick={() => setSelectedId(n.id)}
                role="button"
                tabIndex={0}
                aria-label={n.name}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(n.id);
                  }
                }}
              >
                {/* Transparent hit target — the visible dots are far too small to click reliably */}
                <circle cx={pos.x} cy={pos.y} r={Math.max(rNode + 7, 13)} fill="transparent" />
                {isSel && <circle cx={pos.x} cy={pos.y} r={rNode + 5} fill="none" stroke={CHART_COLORS.blue} strokeWidth={2} opacity={0.8} />}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={rNode}
                  fill={n.color}
                  opacity={n.dim ? 0.25 : n.ring === 2 ? 0.6 : 0.95}
                  style={{ filter: isSel ? `drop-shadow(0 0 8px ${n.color})` : undefined, transition: "all 0.2s" }}
                  className="pointer-events-none"
                />
                {n.ring === 0 && (
                  <text x={pos.x} y={pos.y + 3} textAnchor="middle" fontSize={9} fill="#04070F" fontWeight={700} className="pointer-events-none">
                    {n.name.split(" ")[0]}
                  </text>
                )}
                <title>{n.name}</title>
              </g>
            );
          })}
        </svg>
        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-text-secondary">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-green" />Health ≥85</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-yellow" />70–84</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-orange" />55–69</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-red" />&lt;55</span>
        </div>
      </GlassCard>

      {/* Detail panel */}
      <div className="space-y-4 xl:col-span-3">
        {selectedComp ? (
          <ComponentDetail comp={selectedComp} />
        ) : selected ? (
          // Systems, assemblies and the locomotive itself have no reliability
          // curve of their own — show what they contain and let the user drill in.
          <GroupDetail node={selected} onSelect={setSelectedId} />
        ) : (
          <GlassCard className="flex h-full min-h-[400px] items-center justify-center">
            <p className="animate-pulse-glow text-sm text-text-secondary">
              Select any node on the radial tree — system, assembly or component
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

/** Summary for a locomotive / system / assembly node: what it holds, and its cost and health. */
function GroupDetail({ node, onSelect }: { node: RadialNode; onSelect: (id: string) => void }) {
  const comps = useMemo(() => {
    if (node.kind === "assembly") return COMPONENTS.filter((c) => c.assemblyId === node.id);
    if (node.kind === "system") {
      const asmIds = ASSEMBLIES.filter((a) => a.systemId === node.id).map((a) => a.id);
      return COMPONENTS.filter((c) => asmIds.includes(c.assemblyId));
    }
    // Locomotive — every component beneath it
    const sysIds = SYSTEMS.filter((s) => s.locomotiveId === node.id).map((s) => s.id);
    const asmIds = ASSEMBLIES.filter((a) => sysIds.includes(a.systemId)).map((a) => a.id);
    return COMPONENTS.filter((c) => asmIds.includes(c.assemblyId));
  }, [node]);

  const replacementValue = comps.reduce((s, c) => s + c.replacementCost, 0);
  const avgHealth = comps.length ? comps.reduce((s, c) => s + c.healthScore, 0) / comps.length : 0;
  const worst = [...comps].sort((a, b) => a.healthScore - b.healthScore).slice(0, 3);

  const kindLabel = node.kind === "loco" ? "Locomotive" : node.kind === "system" ? "System" : "Assembly";

  return (
    <>
      <GlassCard scanline>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-muted">{kindLabel}</p>
            <h2 className="font-display text-lg font-bold">{node.name}</h2>
          </div>
          {comps.length > 0 && (
            <span
              className="font-mono-data rounded-md px-2 py-1 text-xs font-bold"
              style={{ background: `${healthColor(avgHealth)}22`, color: healthColor(avgHealth) }}
            >
              Avg health {avgHealth.toFixed(0)}%
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {[
            { l: "Components", v: `${comps.length}` },
            { l: "Replacement Value", v: fmtCompact(replacementValue) },
            { l: "Shortest Life", v: comps.length ? `${Math.min(...comps.map((c) => c.lifeYears))} yrs` : "—" },
          ].map((x) => (
            <div key={x.l} className="rounded-lg bg-surface-2/70 p-3">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">{x.l}</p>
              <p className="font-mono-data mt-1 text-sm font-semibold">{x.v}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle className="mb-3">Components — select one to inspect reliability and cost</SectionTitle>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {comps.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className="flex items-center gap-2 rounded-md bg-surface-2/60 px-2.5 py-2 text-left text-xs transition-colors hover:bg-surface-2"
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: healthColor(c.healthScore) }} />
              <span className="flex-1 truncate">{c.name}</span>
              <span className="font-mono-data text-[10px] text-text-secondary">{c.healthScore}%</span>
              <span className="font-mono-data w-14 text-right text-[10px] text-text-muted">{fmtCompact(c.replacementCost)}</span>
            </button>
          ))}
          {comps.length === 0 && <p className="text-xs text-text-muted">No components under this node.</p>}
        </div>

        {worst.length > 0 && (
          <>
            <SectionTitle className="mb-2 mt-4">Lowest Health</SectionTitle>
            <div className="space-y-1.5">
              {worst.map((c) => (
                <div key={c.id}>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text-secondary">{c.name}</span>
                    <span className="font-mono-data" style={{ color: healthColor(c.healthScore) }}>{c.healthScore}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <div className="h-full rounded-full" style={{ width: `${c.healthScore}%`, background: healthColor(c.healthScore) }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </GlassCard>
    </>
  );
}

function ComponentDetail({ comp }: { comp: Component }) {
  const reliability = weibullReliability(comp.currentHours, comp.weibullBeta, comp.weibullEta) * 100;
  const rulPct = Math.min(100, (comp.rulYears / comp.lifeYears) * 100);
  const affected = comp.affectsIfFails.map((id) => COMPONENTS.find((c) => c.id === id)?.name).filter(Boolean);
  const dependsOn = comp.dependsOn.map((id) => COMPONENTS.find((c) => c.id === id)?.name).filter(Boolean);

  const triggers = [
    { label: "Calendar", value: comp.pmTrigger.intervalMonths ? `${comp.pmTrigger.intervalMonths} months` : "—", pct: 62 },
    { label: "Distance", value: comp.pmTrigger.intervalKm ? `${comp.pmTrigger.intervalKm.toLocaleString()} km` : "—", pct: 48 },
    { label: "Hours", value: comp.pmTrigger.intervalHours ? `${comp.pmTrigger.intervalHours.toLocaleString()} hrs` : "—", pct: 74 },
  ];

  // Semicircle gauge geometry
  const gaugeR = 60;
  const gaugeC = Math.PI * gaugeR;

  return (
    <>
      <GlassCard scanline>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">{comp.name}</h2>
            <p className="text-xs text-text-secondary">{comp.category} · Impact: {comp.failureImpact}</p>
          </div>
          <span className="font-mono-data rounded-md px-2 py-1 text-xs font-bold" style={{ background: `${healthColor(comp.healthScore)}22`, color: healthColor(comp.healthScore) }}>
            Health {comp.healthScore}%
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { l: "Purchase", v: fmtUSD(comp.purchaseCost) },
            { l: "Replacement", v: fmtUSD(comp.replacementCost) },
            { l: "Design Life", v: `${comp.lifeYears} yrs` },
            { l: "MTBF / MTTR", v: `${(comp.mtbfHours / 1000).toFixed(0)}k / ${comp.mttrHours}h` },
          ].map((x) => (
            <div key={x.l} className="rounded-lg bg-surface-2/70 p-3">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">{x.l}</p>
              <p className="font-mono-data mt-1 text-sm font-semibold">{x.v}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard>
          <SectionTitle className="mb-3">Weibull Reliability</SectionTitle>
          <div className="flex items-center justify-center">
            <svg width={160} height={95} viewBox="0 0 160 95">
              <path d="M 20 85 A 60 60 0 0 1 140 85" fill="none" strokeWidth={12} className="stroke-surface-3" strokeLinecap="round" />
              <path
                d="M 20 85 A 60 60 0 0 1 140 85"
                fill="none"
                strokeWidth={12}
                stroke={healthColor(reliability)}
                strokeLinecap="round"
                strokeDasharray={gaugeC}
                strokeDashoffset={gaugeC * (1 - reliability / 100)}
                style={{ transition: "stroke-dashoffset 0.8s ease", filter: `drop-shadow(0 0 6px ${healthColor(reliability)}66)` }}
              />
              <text x={80} y={72} textAnchor="middle" fontSize={22} fontWeight={700} fill="#E8F0FE" fontFamily="Inter">
                {reliability.toFixed(1)}%
              </text>
              <text x={80} y={90} textAnchor="middle" fontSize={9} fill="#7B9CC8">
                β={comp.weibullBeta} · η={comp.weibullEta.toLocaleString()}h · {comp.currentHours.toLocaleString()}h run
              </text>
            </svg>
          </div>

          <SectionTitle className="mb-2 mt-4">Remaining Useful Life</SectionTitle>
          <div className="h-3 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full rounded-full" style={{ width: `${rulPct}%`, background: healthColor(rulPct), transition: "width 0.6s" }} />
          </div>
          <p className="font-mono-data mt-1.5 text-xs text-text-secondary">
            {comp.rulYears} years remaining — confidence {comp.rulConfidence}%
          </p>
        </GlassCard>

        <GlassCard>
          <SectionTitle className="mb-3">Maintenance Triggers (whichever first)</SectionTitle>
          <div className="space-y-3">
            {triggers.map((t) => (
              <div key={t.label}>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">{t.label}</span>
                  <span className="font-mono-data">{t.value}</span>
                </div>
                {t.value !== "—" && (
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${t.pct}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <SectionTitle className="mb-2 mt-5">Dependency Chain</SectionTitle>
          <div className="space-y-1.5 text-xs">
            {dependsOn.length > 0 && (
              <p className="text-text-secondary">
                Depends on: <span className="text-foreground">{dependsOn.join(", ")}</span>
              </p>
            )}
            {affected.length > 0 ? (
              <p className="text-text-secondary">
                Failure cascades to: <span className="text-orange">{affected.join(", ")}</span>
              </p>
            ) : (
              <p className="text-text-muted">No downstream cascade on failure</p>
            )}
          </div>

          <SectionTitle className="mb-2 mt-5">Warranty & Downtime</SectionTitle>
          <div className="flex h-4 overflow-hidden rounded-md">
            <div className="bg-primary/70" style={{ width: `${(comp.warrantyYears / 20) * 100}%` }} title="Warranty" />
            <div className="flex-1 bg-surface-3" title="Owner cost" />
          </div>
          <p className="font-mono-data mt-1.5 text-xs text-text-secondary">
            {comp.warrantyYears}yr warranty · downtime {fmtCompact(comp.downtimeCostPerDay)}/day
          </p>
        </GlassCard>
      </div>
    </>
  );
}
