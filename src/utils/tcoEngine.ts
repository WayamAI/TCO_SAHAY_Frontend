// Part-level TCO — the maintenance-library math that drives the dashboard,
// the BOM explorer and the customer/organization cost split.
//
// Three rules govern everything here:
//   1. Maintenance is part-specific: interval × quantity × price, never a
//      product-level lump sum.
//   2. Labour is never entered by hand — it is a fixed percentage of the parts
//      spend on every maintenance event (18% by default, editable).
//   3. A maintenance event inside the warranty window is paid by the
//      organization, not the customer. That split is what separates
//      Customer TCO from Organization TCO.

import type { Part, MaintIntervalUnit } from "@/data/bomData";

export const DEFAULT_LABOR_PCT = 18;

/** Duty cycle the interval conversions run against. */
export interface DutyCycle {
  annualKm: number;
  annualHours: number;
}

export const DEFAULT_DUTY: DutyCycle = { annualKm: 240000, annualHours: 5500 };

/** Convert a maintenance interval into years for the given duty cycle. */
export function intervalYears(
  value: number,
  unit: MaintIntervalUnit,
  duty: DutyCycle = DEFAULT_DUTY,
): number {
  if (value <= 0) return Infinity;
  if (unit === "hrs") return value / duty.annualHours;
  if (unit === "km") return value / duty.annualKm;
  return value / 12;
}

export function partIntervalYears(part: Part, duty: DutyCycle = DEFAULT_DUTY): number {
  return intervalYears(part.maintIntervalValue, part.maintIntervalUnit, duty);
}

/** Human-readable interval, e.g. "40,000 hrs" or "18 months". */
export function formatInterval(part: Part): string {
  return `${part.maintIntervalValue.toLocaleString()} ${part.maintIntervalUnit}`;
}

/** Parts cost of a single maintenance event on this part. */
export function eventPartsCost(part: Part): number {
  return part.maintQty * part.unitPriceNew;
}

/** Labour is derived, never entered: a percentage of the parts spend. */
export function laborFor(partsCost: number, laborPct: number = DEFAULT_LABOR_PCT): number {
  return partsCost * (laborPct / 100);
}

/** Full cost of one maintenance event = parts + derived labour. */
export function eventTotalCost(part: Part, laborPct: number = DEFAULT_LABOR_PCT): number {
  const parts = eventPartsCost(part);
  return parts + laborFor(parts, laborPct);
}

/**
 * Expected warranty reserve the organization should hold for this part:
 * what it costs to replace × how likely it is to fail.
 */
export function companyBuffer(part: Part): number {
  return eventPartsCost(part) * (part.failureProbabilityPct / 100);
}

export interface MaintenanceEvent {
  /** Occurrence number — 1st maintenance, 2nd maintenance, … */
  occurrence: number;
  /** Years into service. */
  atYear: number;
  /** Km travelled by that point. */
  atKm: number;
  partsCost: number;
  laborCost: number;
  totalCost: number;
  /** True when the event falls inside BOTH the year and km warranty limits. */
  underWarranty: boolean;
  /** Which limit ends cover first — shown in the maintenance schedule. */
  warrantyLimit: "years" | "km" | "expired";
}

/**
 * Every maintenance event for a part across the horizon. Warranty is
 * whichever-first: cover ends at the year limit or the km limit, not both.
 */
export function maintenanceEvents(
  part: Part,
  horizonYears: number,
  laborPct: number = DEFAULT_LABOR_PCT,
  duty: DutyCycle = DEFAULT_DUTY,
): MaintenanceEvent[] {
  const every = partIntervalYears(part, duty);
  if (!isFinite(every) || every <= 0) return [];

  const events: MaintenanceEvent[] = [];
  const maxEvents = 400; // guard against a pathological sub-day interval
  for (let n = 1; n <= maxEvents; n++) {
    const atYear = every * n;
    if (atYear > horizonYears) break;

    const atKm = atYear * duty.annualKm;
    const withinYears = atYear <= part.warrantyYears;
    const withinKm = atKm <= part.warrantyKm;
    const underWarranty = withinYears && withinKm;

    const partsCost = eventPartsCost(part);
    const laborCost = laborFor(partsCost, laborPct);

    events.push({
      occurrence: n,
      atYear: +atYear.toFixed(2),
      atKm: Math.round(atKm),
      partsCost,
      laborCost,
      totalCost: partsCost + laborCost,
      underWarranty,
      warrantyLimit: underWarranty ? (withinYears && !withinKm ? "km" : "years") : "expired",
    });
  }
  return events;
}

export interface PartTCO {
  part: Part;
  events: MaintenanceEvent[];
  eventCount: number;
  /** Parts spend across all events. */
  maintenanceCost: number;
  /** Derived labour across all events. */
  laborCost: number;
  /** Maintenance + labour. */
  totalCost: number;
  /** Portion falling inside the warranty window — the organization pays this. */
  warrantyCoveredCost: number;
  /** What the customer actually pays: total minus warranty-covered. */
  customerCost: number;
  /** What the organization carries: warranty replacements + expected reserve. */
  companyCost: number;
  /** Expected warranty reserve = part cost × failure probability. */
  buffer: number;
  /** Average cost per year across the horizon. */
  avgAnnualCost: number;
}

export function partTCO(
  part: Part,
  horizonYears: number,
  laborPct: number = DEFAULT_LABOR_PCT,
  duty: DutyCycle = DEFAULT_DUTY,
): PartTCO {
  const events = maintenanceEvents(part, horizonYears, laborPct, duty);

  let maintenanceCost = 0;
  let laborCost = 0;
  let warrantyCoveredCost = 0;
  for (const e of events) {
    maintenanceCost += e.partsCost;
    laborCost += e.laborCost;
    if (e.underWarranty) warrantyCoveredCost += e.totalCost;
  }

  const totalCost = maintenanceCost + laborCost;
  const buffer = companyBuffer(part);

  return {
    part,
    events,
    eventCount: events.length,
    maintenanceCost,
    laborCost,
    totalCost,
    warrantyCoveredCost,
    customerCost: totalCost - warrantyCoveredCost,
    companyCost: warrantyCoveredCost + buffer,
    buffer,
    avgAnnualCost: horizonYears > 0 ? totalCost / horizonYears : 0,
  };
}

export interface FleetTCO {
  rows: PartTCO[];
  maintenanceCost: number;
  laborCost: number;
  totalCost: number;
  warrantyCoveredCost: number;
  /** Customer TCO — excludes everything the warranty covers. */
  customerTCO: number;
  /** Organization TCO — warranty replacements plus the reserve held against failures. */
  organizationTCO: number;
  buffer: number;
  avgAnnualCost: number;
}

export function fleetTCO(
  parts: Part[],
  horizonYears: number,
  laborPct: number = DEFAULT_LABOR_PCT,
  duty: DutyCycle = DEFAULT_DUTY,
): FleetTCO {
  const rows = parts.map((p) => partTCO(p, horizonYears, laborPct, duty));
  const sum = (pick: (r: PartTCO) => number) => rows.reduce((s, r) => s + pick(r), 0);

  const totalCost = sum((r) => r.totalCost);
  const warrantyCoveredCost = sum((r) => r.warrantyCoveredCost);
  const buffer = sum((r) => r.buffer);

  return {
    rows,
    maintenanceCost: sum((r) => r.maintenanceCost),
    laborCost: sum((r) => r.laborCost),
    totalCost,
    warrantyCoveredCost,
    customerTCO: totalCost - warrantyCoveredCost,
    organizationTCO: warrantyCoveredCost + buffer,
    buffer,
    avgAnnualCost: horizonYears > 0 ? totalCost / horizonYears : 0,
  };
}

/**
 * Failure probability trended over the years already in service — the dashboard
 * shows the historical curve rather than a single static percentage.
 * Probability accumulates with wear and is normalised against the part's own
 * replacement interval, so a 6-month filter climbs far faster than a 20-year motor.
 */
export function failureTrend(part: Part, years: number): Array<{ year: number; probability: number }> {
  const shape = 1.6; // mild wear-out — matches the Weibull betas used elsewhere
  const scale = Math.max(0.5, part.replacementIntervalYears);
  return Array.from({ length: years + 1 }, (_, year) => {
    const wear = Math.pow(year / scale, shape);
    const probability = +(part.failureProbabilityPct * Math.min(2.5, wear)).toFixed(1);
    return { year, probability: Math.min(100, probability) };
  });
}
