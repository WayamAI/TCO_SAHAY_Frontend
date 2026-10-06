// Component- and part-level analytics for the TCO Simulation Playground.
// Bifurcates maintenance spend into replacements, consumables, failures, downtime,
// warranty and fuel/fluids — each resolved to the component (and, for the ES44AC,
// the individual part) that drives it. Pure functions driven by live SimParams.

import {
  COMPONENTS,
  SYSTEMS,
  ASSEMBLIES,
  OPERATING_PROFILES,
  LOCOMOTIVES,
  CHART_COLORS,
  type Component,
} from "@/data/syntheticData";
import { PARTS, partsForComponent, type Part } from "@/data/bomData";
import type { SimParams } from "@/utils/simulationEngine";
import { weibullFailureProb } from "@/utils/simulationEngine";

function profileOf(params: SimParams) {
  return OPERATING_PROFILES.find((p) => p.id === params.operatingProfile) ?? OPERATING_PROFILES[0];
}
function locoOf(params: SimParams) {
  return LOCOMOTIVES.find((l) => l.id === params.locomotiveId) ?? LOCOMOTIVES[0];
}

export function systemForComponent(compId: string) {
  const comp = COMPONENTS.find((c) => c.id === compId);
  const asm = ASSEMBLIES.find((a) => a.id === comp?.assemblyId);
  return SYSTEMS.find((s) => s.id === asm?.systemId);
}

/* ───────────────────────── Consumable classification ───────────────────────── */

export type ConsumableCategory =
  | "Engine & Lube Oil"
  | "Filters"
  | "Grease"
  | "Coolant"
  | "Refrigerant"
  | "Seals & Gaskets"
  | "Brushes & Wear"
  | "Hoses & Lines"
  | "Other";

export function classifyConsumable(name: string): ConsumableCategory {
  const n = name.toLowerCase();
  if (
    n.includes("filter") ||
    n.includes("cartridge") ||
    n.includes("element") ||
    n.includes("separator")
  )
    return "Filters";
  if (n.includes("grease")) return "Grease";
  if (n.includes("coolant")) return "Coolant";
  if (n.includes("refrigerant")) return "Refrigerant";
  if (n.includes("oil")) return "Engine & Lube Oil";
  if (n.includes("gasket") || n.includes("seal") || n.includes("o-ring") || n.includes("fire ring"))
    return "Seals & Gaskets";
  if (n.includes("brush") || n.includes("shoe") || n.includes("pad")) return "Brushes & Wear";
  if (n.includes("hose") || n.includes("line")) return "Hoses & Lines";
  return "Other";
}

export const CONSUMABLE_COLORS: Record<ConsumableCategory, string> = {
  "Engine & Lube Oil": CHART_COLORS.yellow,
  Filters: CHART_COLORS.blue,
  Grease: CHART_COLORS.orange,
  Coolant: CHART_COLORS.teal,
  Refrigerant: CHART_COLORS.green,
  "Seals & Gaskets": CHART_COLORS.purple,
  "Brushes & Wear": CHART_COLORS.red,
  "Hoses & Lines": "var(--ref-gray-400)",
  Other: CHART_COLORS.textMuted,
};

/* ───────────────────────── Replacement by component / part ───────────────────────── */

export interface ReplacementRow {
  id: string;
  name: string;
  system: string;
  events: number; // replacement events over horizon
  perEvent: number;
  totalCost: number;
  criticality: string;
  intervalYears: number;
  isPart: boolean;
}

/** Major replacements (capitalized rotables/components), resolved to parts for the ES44AC. */
export function replacementByComponent(params: SimParams): ReplacementRow[] {
  const profile = profileOf(params);
  const N = params.N;
  const hasParts = params.locomotiveId === "loco-001";

  const rows: ReplacementRow[] = [];

  for (const comp of COMPONENTS) {
    const sys = systemForComponent(comp.id)?.name ?? "—";
    const parts = hasParts ? partsForComponent(comp.id).filter((p) => p.capitalized) : [];

    if (parts.length > 0) {
      for (const p of parts) {
        const effInterval =
          (p.replacementIntervalYears / profile.wearMultiplier) *
          params.maintenanceIntervalMultiplier;
        const events = Math.max(0, Math.floor(N / effInterval));
        if (events === 0) continue;
        const partCost =
          p.repairable && p.unitPriceReman > 0 ? p.unitPriceReman - p.coreCredit : p.unitPriceNew;
        const perEvent =
          partCost * p.qtyPerComponent + p.laborHoursPerReplacement * params.laborRatePerHour;
        rows.push({
          id: p.id,
          name: p.name,
          system: sys,
          events,
          perEvent,
          totalCost: events * perEvent,
          criticality: p.criticality,
          intervalYears: +effInterval.toFixed(1),
          isPart: true,
        });
      }
    } else {
      const effLife =
        (comp.lifeYears / profile.wearMultiplier) * params.maintenanceIntervalMultiplier;
      const events = Math.max(0, Math.floor(N / effLife));
      if (events === 0) continue;
      const perEvent = comp.replacementCost * (1 + comp.laborCostPct / 100);
      rows.push({
        id: comp.id,
        name: comp.name,
        system: sys,
        events,
        perEvent,
        totalCost: events * perEvent,
        criticality: comp.failureImpact,
        intervalYears: +effLife.toFixed(1),
        isPart: false,
      });
    }
  }

  return rows.sort((a, b) => b.totalCost - a.totalCost);
}

/* ───────────────────────── Consumables breakdown ───────────────────────── */

export interface ConsumableRow {
  category: ConsumableCategory;
  annualCost: number;
  totalCost: number;
  color: string;
  items: { name: string; annualCost: number }[];
}

/**
 * Consumables = expensed fluids + wear items. Sourced from COMPONENTS.consumable
 * (engine oil, grease, coolant, refrigerant) and expensed bomData parts
 * (filters, seals, brushes, shoes, gaskets).
 */
export function consumablesBreakdown(params: SimParams): ConsumableRow[] {
  const profile = profileOf(params);
  const N = params.N;
  const qtyMult = params.consumableQtyMultiplier;
  const hasParts = params.locomotiveId === "loco-001";

  const cats = new Map<ConsumableCategory, { annual: number; items: Map<string, number> }>();
  const add = (cat: ConsumableCategory, name: string, annual: number) => {
    if (annual <= 0) return;
    if (!cats.has(cat)) cats.set(cat, { annual: 0, items: new Map() });
    const c = cats.get(cat)!;
    c.annual += annual;
    c.items.set(name, (c.items.get(name) ?? 0) + annual);
  };

  // Fluid consumables tied to components (services per year × qty × unit cost)
  for (const comp of COMPONENTS) {
    if (!comp.consumable) continue;
    const intervalMonths = comp.pmTrigger.intervalMonths ?? 12;
    const servicesPerYear = (12 / intervalMonths) * (1 / params.maintenanceIntervalMultiplier);
    const annual =
      servicesPerYear *
      comp.consumable.qtyPerService *
      comp.consumable.unitCost *
      qtyMult *
      profile.maintenanceFreqMultiplier;
    add(classifyConsumable(comp.consumable.name), comp.consumable.name, annual);
  }

  // Expensed parts (filters, seals, brushes, shoes) — bomData, ES44AC only
  if (hasParts) {
    for (const p of PARTS) {
      if (p.capitalized) continue; // capitalized handled as replacements
      const effInterval =
        (p.replacementIntervalYears / profile.wearMultiplier) *
        params.maintenanceIntervalMultiplier;
      if (effInterval <= 0) continue;
      const annual = (p.qtyPerComponent * p.unitPriceNew * qtyMult) / effInterval;
      add(classifyConsumable(p.name), p.name, annual);
    }
  }

  const rows: ConsumableRow[] = Array.from(cats, ([category, v]) => ({
    category,
    annualCost: v.annual,
    totalCost: v.annual * N,
    color: CONSUMABLE_COLORS[category],
    items: Array.from(v.items, ([name, annualCost]) => ({ name, annualCost })).sort(
      (a, b) => b.annualCost - a.annualCost,
    ),
  }));

  return rows.sort((a, b) => b.annualCost - a.annualCost);
}

/* ───────────────────────── Fuel & fluids (expanded fuel) ───────────────────────── */

export interface FuelFluidRow {
  name: string;
  annual: number;
  total: number;
  color: string;
  share: number; // % of the fuel+fluids total
  note?: string;
}

/** Fluid and consumable spend — energy/fuel is no longer part of the TCO model. */
export function fuelAndFluids(params: SimParams): { rows: FuelFluidRow[]; annualTotal: number } {
  const N = params.N;

  // Fluids from the consumables model (oil, grease, coolant, filters)
  const cons = consumablesBreakdown(params);
  const fluidCats: ConsumableCategory[] = [
    "Engine & Lube Oil",
    "Grease",
    "Coolant",
    "Refrigerant",
    "Filters",
  ];
  const fluidRows = cons.filter((c) => fluidCats.includes(c.category));

  const raw: { name: string; annual: number; color: string; note?: string }[] = fluidRows.map(
    (f) => ({
      name: f.category,
      annual: f.annualCost,
      color: f.color,
    }),
  );

  const annualTotal = raw.reduce((s, r) => s + r.annual, 0);
  const rows: FuelFluidRow[] = raw
    .filter((r) => r.annual > 0)
    .map((r) => ({
      name: r.name,
      annual: r.annual,
      total: r.annual * N,
      color: r.color,
      share: annualTotal > 0 ? (r.annual / annualTotal) * 100 : 0,
      note: r.note,
    }))
    .sort((a, b) => b.annual - a.annual);

  return { rows, annualTotal };
}

/* ───────────────────────── Failure analysis by component ───────────────────────── */

export interface FailureRow {
  id: string;
  name: string;
  system: string;
  expectedFailures: number; // over horizon
  failureCost: number;
  downtimeDays: number;
  downtimeCost: number;
  criticality: string;
  nextYearProb: number; // %
}

export function failureByComponent(params: SimParams): FailureRow[] {
  const profile = profileOf(params);
  const loco = locoOf(params);
  const N = params.N;
  const annualHours = (params.annualHoursOverride ?? loco.annualHours) * profile.wearMultiplier;

  return COMPONENTS.map((comp: Component) => {
    let expected = 0;
    let failCost = 0;
    let downDays = 0;
    for (let t = 1; t <= N; t++) {
      const pStart = weibullFailureProb((t - 1) * annualHours, comp.weibullBeta, comp.weibullEta);
      const pEnd = weibullFailureProb(t * annualHours, comp.weibullBeta, comp.weibullEta);
      const p = (pEnd - pStart) * params.failureRateMultiplier * profile.failureProbMultiplier;
      const inWarranty = t <= comp.warrantyYears + params.warrantyExtendedYears;
      expected += p;
      const repairCost = comp.replacementCost * (1 + comp.laborCostPct / 100) * 1.3;
      if (!inWarranty) failCost += p * repairCost;
      const mttrDays = (comp.mttrHours * params.mttrMultiplier) / 24;
      downDays += p * mttrDays;
    }
    const nextYearProb =
      (weibullFailureProb(comp.currentHours + annualHours, comp.weibullBeta, comp.weibullEta) -
        weibullFailureProb(comp.currentHours, comp.weibullBeta, comp.weibullEta)) *
      params.failureRateMultiplier *
      profile.failureProbMultiplier *
      100;
    return {
      id: comp.id,
      name: comp.name,
      system: systemForComponent(comp.id)?.name ?? "—",
      expectedFailures: +expected.toFixed(2),
      failureCost: failCost,
      downtimeDays: +downDays.toFixed(1),
      downtimeCost: downDays * comp.downtimeCostPerDay,
      criticality: comp.failureImpact,
      nextYearProb: +Math.max(0, nextYearProb).toFixed(1),
    };
  }).sort((a, b) => b.failureCost + b.downtimeCost - (a.failureCost + a.downtimeCost));
}

/* ───────────────────────── Downtime by component ───────────────────────── */

export interface DowntimeRow {
  id: string;
  name: string;
  system: string;
  downtimeDays: number;
  downtimeCost: number;
  mttrHours: number;
  criticality: string;
}

export function downtimeByComponent(params: SimParams): DowntimeRow[] {
  return failureByComponent(params)
    .map((f) => {
      const comp = COMPONENTS.find((c) => c.id === f.id)!;
      return {
        id: f.id,
        name: f.name,
        system: f.system,
        downtimeDays: f.downtimeDays,
        downtimeCost: f.downtimeCost,
        mttrHours: +(comp.mttrHours * params.mttrMultiplier).toFixed(0),
        criticality: f.criticality,
      };
    })
    .filter((d) => d.downtimeDays > 0)
    .sort((a, b) => b.downtimeCost - a.downtimeCost);
}

/* ───────────────────────── Warranty coverage by component ───────────────────────── */

export interface WarrantyRow {
  id: string;
  name: string;
  system: string;
  baseWarranty: number;
  extended: number;
  totalCoverage: number;
  coveredValue: number; // replacement value shielded during warranty
  criticality: string;
}

export function warrantyByComponent(params: SimParams): WarrantyRow[] {
  const profile = profileOf(params);
  return COMPONENTS.map((comp) => {
    const total = comp.warrantyYears + params.warrantyExtendedYears;
    const effLife = comp.lifeYears / profile.wearMultiplier;
    // replacements + expected failures that fall inside the warranty window
    const replInWarranty = Math.floor(total / Math.max(0.5, effLife));
    const perEvent = comp.replacementCost * (1 + comp.laborCostPct / 100);
    return {
      id: comp.id,
      name: comp.name,
      system: systemForComponent(comp.id)?.name ?? "—",
      baseWarranty: comp.warrantyYears,
      extended: params.warrantyExtendedYears,
      totalCoverage: total,
      coveredValue: Math.max(perEvent, replInWarranty * perEvent),
      criticality: comp.failureImpact,
    };
  }).sort((a, b) => b.totalCoverage - a.totalCoverage || b.coveredValue - a.coveredValue);
}

/* ───────────────────────── Maintenance by component (control-panel summary) ───────────────────────── */

export interface MaintDriverRow {
  id: string;
  name: string;
  system: string;
  annualMaint: number; // replacements + consumables + failures + downtime, annualized
  share: number;
}

export function maintenanceDrivers(params: SimParams, limit = 6): MaintDriverRow[] {
  const N = params.N;
  const repl = replacementByComponent(params);
  const fail = failureByComponent(params);
  const hasParts = params.locomotiveId === "loco-001";

  // Aggregate replacement rows back up to their owning component for the summary
  const byComp = new Map<string, { name: string; system: string; cost: number }>();
  const bump = (compId: string, name: string, system: string, cost: number) => {
    const cur = byComp.get(compId) ?? { name, system, cost: 0 };
    cur.cost += cost;
    byComp.set(compId, cur);
  };

  for (const r of repl) {
    // r.id may be a part id; map to component
    let compId = r.id;
    let compName = r.name;
    if (r.isPart && hasParts) {
      const part = PARTS.find((p) => p.id === r.id);
      const comp = COMPONENTS.find((c) => c.id === part?.componentId);
      compId = comp?.id ?? r.id;
      compName = comp?.name ?? r.name;
    }
    bump(compId, compName, r.system, r.totalCost);
  }
  for (const f of fail) bump(f.id, f.name, f.system, f.failureCost + f.downtimeCost);

  const total = Array.from(byComp.values()).reduce((s, v) => s + v.cost, 0) || 1;
  return Array.from(byComp, ([id, v]) => ({
    id,
    name: v.name,
    system: v.system,
    annualMaint: v.cost / N,
    share: (v.cost / total) * 100,
  }))
    .sort((a, b) => b.annualMaint - a.annualMaint)
    .slice(0, limit);
}
