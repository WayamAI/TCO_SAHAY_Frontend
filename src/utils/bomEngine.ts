// Part-level BOM roll-up, depreciation and inventory math.
// Pure functions — no state, no API calls.

import type { Part } from "@/data/bomData";

/** Straight-line annual depreciation charge for a part line (qty-extended). */
export function annualDepreciation(part: Part): number {
  const base = extendedCost(part) - salvageValue(part);
  return base / part.usefulLifeYears;
}

/** Salvage is the core-return credit (reman parts) plus scrap value, qty-extended. */
export function salvageValue(part: Part): number {
  return (part.coreCredit + part.scrapValue) * part.qtyPerComponent;
}

/** Total acquisition cost for the line = unit price x qty. */
export function extendedCost(part: Part): number {
  return part.unitPriceNew * part.qtyPerComponent;
}

/**
 * Net book value after `years` in service.
 * Straight-line clamps at salvage; units-of-production scales by actual usage
 * against the part's lifetime output capacity.
 */
export function netBookValue(part: Part, years: number, utilisation = 1): number {
  const cost = extendedCost(part);
  const salvage = salvageValue(part);
  const depreciable = cost - salvage;

  if (part.depreciationMethod === "units-of-production") {
    const consumed = Math.min(1, (years * utilisation) / part.usefulLifeYears);
    return cost - depreciable * consumed;
  }

  const charged = Math.min(depreciable, annualDepreciation(part) * years);
  return cost - charged;
}

/** Depreciation schedule for charting NBV decline across a planning horizon. */
export function depreciationSchedule(
  part: Part,
  horizonYears: number,
  utilisation = 1,
): Array<{ year: number; nbv: number; accumulated: number; charge: number }> {
  const cost = extendedCost(part);
  return Array.from({ length: horizonYears + 1 }, (_, year) => {
    const nbv = netBookValue(part, year, utilisation);
    const prev = year === 0 ? cost : netBookValue(part, year - 1, utilisation);
    return {
      year,
      nbv: +nbv.toFixed(0),
      accumulated: +(cost - nbv).toFixed(0),
      charge: +(prev - nbv).toFixed(0),
    };
  });
}

/**
 * Annualised maintenance cost for a part: replacement events amortised over the
 * replacement interval, plus the labour to fit each one.
 */
export function annualMaintenanceCost(part: Part, laborRatePerHour = 95): number {
  if (part.replacementIntervalYears <= 0) return 0;
  const partCost = part.repairable ? part.unitPriceReman - part.coreCredit : part.unitPriceNew;
  const perEvent = partCost * part.qtyPerComponent + part.laborHoursPerReplacement * laborRatePerHour;
  return perEvent / part.replacementIntervalYears;
}

/** Lifetime cost of ownership for one part line over the horizon. */
export function lifecycleCost(part: Part, horizonYears: number, laborRatePerHour = 95): number {
  return extendedCost(part) + annualMaintenanceCost(part, laborRatePerHour) * horizonYears;
}

/** Inventory carrying cost — value on hand x annual carrying rate. */
export function carryingCost(part: Part, carryingRatePct = 22): number {
  return part.onHandQty * part.unitPriceNew * (carryingRatePct / 100);
}

/** Inventory turns = annual usage / average stock on hand. */
export function inventoryTurns(part: Part): number {
  const avgStock = (part.minStock + part.maxStock) / 2;
  if (avgStock <= 0) return 0;
  return +(part.annualUsageQty / avgStock).toFixed(1);
}

/** Stock status vs reorder point — drives the replenishment signal in the UI. */
export function stockStatus(part: Part): "Critical" | "Reorder" | "Healthy" | "Excess" {
  if (part.onHandQty <= part.safetyStock) return "Critical";
  if (part.onHandQty <= part.reorderPoint) return "Reorder";
  if (part.onHandQty > part.maxStock) return "Excess";
  return "Healthy";
}

/** ABC classification by annual spend contribution (Pareto). */
export function abcClassify(parts: Part[]): Map<string, "A" | "B" | "C"> {
  const spend = parts.map((p) => ({ id: p.id, value: p.annualUsageQty * p.unitPriceNew }));
  const total = spend.reduce((s, x) => s + x.value, 0);
  const sorted = [...spend].sort((a, b) => b.value - a.value);

  const out = new Map<string, "A" | "B" | "C">();
  let cumulative = 0;
  for (const item of sorted) {
    cumulative += item.value;
    const pct = total > 0 ? (cumulative / total) * 100 : 0;
    out.set(item.id, pct <= 80 ? "A" : pct <= 95 ? "B" : "C");
  }
  return out;
}
