import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import { CHART_COLORS } from "@/data/syntheticData";
import { alpha, cn } from "@/lib/utils";
import { AppIcon } from "@/components/icons/AppIcon";
import type { IconName } from "@/components/icons/registry";

export const Route = createFileRoute("/glossary")({
  head: () => ({
    meta: [
      { title: "Glossary & Definitions | TCO Intelligence" },
      {
        name: "description",
        content:
          "What every TCO cost category includes — maintenance, labour, consumables, failures, downtime, warranty reserve.",
      },
    ],
  }),
  component: Glossary,
});

type Group = "Cost categories" | "Warranty & risk" | "TCO views" | "Rates & intervals";

interface Definition {
  term: string;
  group: Group;
  icon: IconName;
  color: string;
  summary: string;
  includes: string[];
  excludes?: string[];
  formula?: string;
}

const DEFINITIONS: Definition[] = [
  {
    term: "Maintenance",
    group: "Cost categories",
    icon: "maintenance",
    color: CHART_COLORS.teal,
    summary:
      "Planned, part-level work carried out at a fixed interval. Every maintenance record belongs to a specific part — never to the locomotive as a whole.",
    includes: [
      "Parts consumed at each service (quantity × unit price)",
      "Scheduled inspections, overhauls and rebuilds",
      "Both time-based (months) and usage-based (hours / km) intervals",
    ],
    excludes: ["Labour — calculated separately as a percentage", "Unplanned failure repairs"],
    formula: "Maintenance Cost = Quantity × Price, once per interval",
  },
  {
    term: "Labour",
    group: "Cost categories",
    icon: "users",
    color: CHART_COLORS.purple,
    summary:
      "The workshop cost of performing maintenance. It is never entered by hand — it is derived from the parts spend on every occurrence.",
    includes: ["Technician time to fit the parts", "Applied at every maintenance event"],
    excludes: ["Parts cost itself", "Overheads billed separately"],
    formula: "Labour Cost = Sum(Part Prices) × 18%  (percentage editable in the Library)",
  },
  {
    term: "Consumables",
    group: "Cost categories",
    icon: "fluid",
    color: CHART_COLORS.yellow,
    summary:
      "Fluids and short-life items replaced on a fixed cadence rather than on condition. Expensed, not capitalised.",
    includes: [
      "Oils, coolants, greases, refrigerant",
      "Filters and gaskets",
      "Anything with a sub-year replacement interval",
    ],
    excludes: ["Rotables and unit-exchange parts", "Anything carrying a core credit"],
  },
  {
    term: "Failures",
    group: "Cost categories",
    icon: "warning",
    color: CHART_COLORS.red,
    summary:
      "Unplanned breakdowns — the expected cost of parts failing before their scheduled replacement, weighted by how likely each failure is.",
    includes: [
      "Replacement part plus the labour to fit it",
      "A cascade premium where one failure damages downstream parts",
      "Weighted by failure probability, not counted as a certainty",
    ],
    excludes: ["Failures still inside the warranty window — those sit under Warranty"],
    formula: "Failure Cost = Failure Probability × Repair Cost",
  },
  {
    term: "Downtime",
    group: "Cost categories",
    icon: "clock",
    color: CHART_COLORS.orange,
    summary:
      "Revenue lost while the locomotive is out of service. Measured from the moment the unit stops earning to the moment it returns to traffic.",
    includes: [
      "Time to repair (MTTR) valued at the daily revenue rate",
      "Both planned service windows and unplanned outages",
      "Warranty outages counted at half rate — the unit is still unavailable even when the repair is free",
    ],
    excludes: ["The repair cost itself — that is Maintenance or Failures"],
    formula: "Downtime Cost = Days Out of Service × Revenue per Active Day",
  },
  {
    term: "Warranty",
    group: "Warranty & risk",
    icon: "warrantyActive",
    color: CHART_COLORS.blue,
    summary:
      "The period during which the manufacturer, not the operator, pays for a failure. Cover has two limits and ends at whichever is reached first.",
    includes: [
      "Warranty in years — for parts that age",
      "Warranty in kilometres — for parts that wear with use",
    ],
    formula: "Covered = (Years elapsed ≤ Warranty Years) AND (Km run ≤ Warranty Km)",
  },
  {
    term: "Failure Probability",
    group: "Warranty & risk",
    icon: "percent",
    color: CHART_COLORS.red,
    summary:
      "How likely a given part is to fail within its warranty window, expressed as a percentage. Trended against hours in service rather than held as a fixed number.",
    includes: [
      "Derived from criticality and replacement cadence",
      "Rises with accumulated wear",
      "Editable per part in the Library",
    ],
  },
  {
    term: "Company Buffer (Warranty Reserve)",
    group: "Warranty & risk",
    icon: "savings",
    color: CHART_COLORS.orange,
    summary:
      "The money the organization should set aside per part to cover warranty claims it expects to receive.",
    includes: [
      "Held per part, then rolled up across the BOM",
      "Recalculates whenever price or failure probability changes",
    ],
    formula: "Company Buffer = Part Cost × Failure Probability",
  },
  {
    term: "Customer TCO",
    group: "TCO views",
    icon: "gauge",
    color: CHART_COLORS.teal,
    summary: "Everything the operator actually pays across the planning horizon.",
    includes: [
      "Maintenance parts and derived labour",
      "Consumables",
      "Out-of-warranty failures",
      "Downtime",
    ],
    excludes: ["Anything the warranty covers", "The manufacturer's warranty reserve"],
    formula: "Customer TCO = Total Cost − Warranty-Covered Cost",
  },
  {
    term: "Organization TCO",
    group: "TCO views",
    icon: "calculator",
    color: CHART_COLORS.purple,
    summary: "What the manufacturer carries — the mirror image of the customer's bill.",
    includes: [
      "Warranty replacement cost",
      "Service forecasting",
      "Company warranty reserve across all parts",
    ],
    formula: "Organization TCO = Warranty-Covered Cost + Company Buffer",
  },
  {
    term: "Maintenance Interval",
    group: "Rates & intervals",
    icon: "clock",
    color: CHART_COLORS.blue,
    summary:
      "How often a part needs attention, expressed in the unit that actually governs it. Where several limits apply, whichever is reached first triggers the work.",
    includes: [
      "Running hours — engine internals",
      "Kilometres — running gear and brakes",
      "Months — calendar-driven inspections",
    ],
  },
  {
    term: "Extended Cost",
    group: "Rates & intervals",
    icon: "package",
    color: CHART_COLORS.green,
    summary: "The cost of a whole part line rather than a single unit.",
    formula: "Extended Cost = Unit Price × Quantity per Component",
    includes: ["Used for BOM roll-ups and depreciation"],
  },
  {
    term: "Depreciation",
    group: "Rates & intervals",
    icon: "trendDown",
    color: CHART_COLORS.purple,
    summary:
      "How a capitalised part loses book value over its useful life. Each part depreciates on its own schedule (IAS 16 component approach).",
    includes: [
      "Straight-line for steady-wear parts",
      "Units-of-production where charge scales with utilisation",
    ],
    excludes: ["Consumables — expensed as incurred, never capitalised"],
  },
];

const GROUPS: Group[] = ["Cost categories", "Warranty & risk", "TCO views", "Rates & intervals"];

function Glossary() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<Group | "All">("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEFINITIONS.filter((d) => {
      if (group !== "All" && d.group !== group) return false;
      if (!q) return true;
      return (
        d.term.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q) ||
        d.includes.some((i) => i.toLowerCase().includes(q))
      );
    });
  }, [query, group]);

  return (
    <div className="space-y-5">
      <GlassCard className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search definitions…"
          className="min-w-[200px] flex-1 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs outline-none placeholder:text-text-muted focus:border-primary/50"
        />
        <div className="flex flex-wrap gap-1">
          {(["All", ...GROUPS] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g as Group | "All")}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-mini transition-colors",
                group === g
                  ? "bg-raised-2 font-medium text-fg-primary"
                  : "transition-ui bg-action text-fg-tertiary hover:bg-raised-2 hover:text-fg-secondary",
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {filtered.map((d) => {
          return (
            <GlassCard key={d.term} className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                  style={{ background: alpha(d.color, 12), color: d.color }}
                >
                  <AppIcon name={d.icon} size="sm" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-bold leading-tight">{d.term}</h3>
                  <p className="text-micro uppercase tracking-wider text-text-muted">{d.group}</p>
                </div>
              </div>

              <p className="text-mini leading-relaxed text-text-secondary">{d.summary}</p>

              {d.formula && (
                <p
                  className="font-mono-data rounded-md bg-surface-2/80 px-2 py-1.5 text-mini leading-relaxed"
                  style={{ color: d.color }}
                >
                  {d.formula}
                </p>
              )}

              <div>
                <p className="text-micro uppercase tracking-wider text-text-muted">Includes</p>
                <ul className="mt-1 space-y-0.5">
                  {d.includes.map((i) => (
                    <li key={i} className="flex gap-1.5 text-mini text-text-secondary">
                      <span className="text-green">+</span>
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {d.excludes && (
                <div>
                  <p className="text-micro uppercase tracking-wider text-text-muted">Excludes</p>
                  <ul className="mt-1 space-y-0.5">
                    {d.excludes.map((i) => (
                      <li key={i} className="flex gap-1.5 text-mini text-text-muted">
                        <span className="text-red">−</span>
                        <span>{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <GlassCard className="py-10 text-center text-sm text-text-muted">
          No definition matches “{query}”.
        </GlassCard>
      )}
    </div>
  );
}
