import {
  COMPONENTS,
  LOCOMOTIVES,
  MAINTENANCE_SCHEDULES,
  OPERATING_PROFILES,
  INFLATION_RATES,
  DOWNTIME_DATA,
} from "@/data/syntheticData";
import { PARTS } from "@/data/bomData";
import { DEFAULT_LABOR_PCT, companyBuffer } from "@/utils/tcoEngine";

export function weibullReliability(hours: number, beta: number, eta: number): number {
  return Math.exp(-Math.pow(hours / eta, beta));
}

export function weibullFailureProb(hours: number, beta: number, eta: number): number {
  return 1 - weibullReliability(hours, beta, eta);
}

export function inflatedCost(baseCost: number, year: number, inflationPct: number): number {
  return baseCost * Math.pow(1 + inflationPct / 100, year);
}

export interface SimParams {
  locomotiveId: string;
  operatingProfile: string;
  N: number; // planning horizon years
  laborRatePerHour: number;
  maintenanceIntervalMultiplier: number;
  failureRateMultiplier: number;
  mttrMultiplier: number;
  warrantyExtendedYears: number;
  /** Maintenance labour as a percentage of parts spend — never entered by hand. */
  maintenanceLaborPct: number;
  consumableQtyMultiplier: number;
  inflationEnabled: boolean;
  includeDowntime: boolean;
  inflationLabor: number;
  inflationParts: number;
  inflationConsumables: number;
  annualHoursOverride: number | null;
  annualKmOverride: number | null;
}

export const DEFAULT_PARAMS: SimParams = {
  locomotiveId: "loco-001",
  operatingProfile: "heavy-freight",
  N: 20,
  laborRatePerHour: 95,
  maintenanceIntervalMultiplier: 1.0,
  failureRateMultiplier: 1.0,
  mttrMultiplier: 1.0,
  warrantyExtendedYears: 0,
  maintenanceLaborPct: DEFAULT_LABOR_PCT,
  consumableQtyMultiplier: 1.0,
  inflationEnabled: true,
  includeDowntime: true,
  inflationLabor: INFLATION_RATES.labor,
  inflationParts: INFLATION_RATES.spareParts,
  inflationConsumables: INFLATION_RATES.consumables,
  annualHoursOverride: null,
  annualKmOverride: null,
};

export interface YearBreakdown {
  year: number;
  maintenance: number;
  replacement: number;
  consumables: number;
  failures: number;
  downtime: number;
  warranty: number;
  total: number;
  cumulative: number;
}

export interface SimResult {
  totalTCO: number;
  breakdown: {
    capital: number;
    maintenance: number;
    replacements: number;
    consumables: number;
    failures: number;
    downtime: number;
    warrantyOffset: number;
  };
  /**
   * Two views of the same lifecycle. Customer TCO is what the operator pays;
   * Organization TCO is what the manufacturer carries — warranty replacements
   * plus the reserve held against expected failures.
   */
  split: {
    customerTCO: number;
    organizationTCO: number;
    warrantyCovered: number;
    warrantyReserve: number;
  };
  financials: {
    annualAvg: number;
    costPerKm: number;
  };
  availability: {
    mttrAvg: number;
    mtbfFleetAvg: number;
    availabilityPct: number;
  };
  yearlyBreakdown: YearBreakdown[];
}

export function runTCOSimulation(params: SimParams): SimResult {
  const { N, inflationEnabled, includeDowntime } = params;
  const profile =
    OPERATING_PROFILES.find((p) => p.id === params.operatingProfile) ?? OPERATING_PROFILES[0];
  const loco = LOCOMOTIVES.find((l) => l.id === params.locomotiveId) ?? LOCOMOTIVES[0];
  const annualKm = (params.annualKmOverride ?? loco.annualKm) * profile.wearMultiplier;
  const annualHours = (params.annualHoursOverride ?? loco.annualHours) * profile.wearMultiplier;

  const capitalCost = loco.purchaseCost;
  let pmCost = 0,
    replaceCost = 0,
    consumableCost = 0,
    failureCost = 0,
    downtimeCost = 0,
    warrantySavings = 0;

  const yearlyBreakdown: YearBreakdown[] = [];

  for (let t = 1; t <= N; t++) {
    let yearMaint = 0,
      yearConsumable = 0,
      yearReplace = 0,
      yearFailure = 0,
      yearDowntime = 0,
      yearWarranty = 0;

    // Preventive maintenance — whichever-first trigger. Labour is derived from
    // the parts spend (18% by default), never from a manually-entered figure.
    for (const sched of MAINTENANCE_SCHEDULES) {
      const triggerYears =
        Math.min(
          sched.triggerMonths ? sched.triggerMonths / 12 : Infinity,
          sched.triggerKm ? sched.triggerKm / annualKm : Infinity,
          sched.triggerHours ? sched.triggerHours / annualHours : Infinity,
        ) * params.maintenanceIntervalMultiplier;
      const eventsThisYear = t % triggerYears < 1 && t >= triggerYears ? 1 : 0;
      if (eventsThisYear) {
        const partsCost = inflatedCost(
          sched.partsEstimate,
          t,
          inflationEnabled ? params.inflationParts : 0,
        );
        const laborCost = partsCost * (params.maintenanceLaborPct / 100);
        yearMaint += laborCost + partsCost;
      }
    }

    // Components: replacements, consumables, Weibull failures, downtime
    for (const comp of COMPONENTS) {
      const profileWear = profile.wearMultiplier;

      const effectiveLifeYears = comp.lifeYears / profileWear;
      if (t % effectiveLifeYears < 1 && t >= effectiveLifeYears) {
        const isWarranty = t <= comp.warrantyYears + params.warrantyExtendedYears;
        const partsCost = inflatedCost(
          comp.replacementCost,
          t,
          inflationEnabled ? params.inflationParts : 0,
        );
        const laborCost = (partsCost * comp.laborCostPct) / 100;
        const totalRepl = partsCost + laborCost;
        if (isWarranty) yearWarranty -= totalRepl;
        else yearReplace += totalRepl;
      }

      if (comp.consumable && comp.pmTrigger.intervalMonths) {
        const pmIntervalYrs =
          (comp.pmTrigger.intervalMonths / 12) * params.maintenanceIntervalMultiplier;
        const eventsThisYear = Math.floor(1 / pmIntervalYrs);
        const unitCost = inflatedCost(
          comp.consumable.unitCost,
          t,
          inflationEnabled ? params.inflationConsumables : 0,
        );
        yearConsumable +=
          eventsThisYear *
          comp.consumable.qtyPerService *
          params.consumableQtyMultiplier *
          unitCost;
      }

      const hoursStart = (t - 1) * annualHours;
      const hoursEnd = t * annualHours;
      const pFailStart = weibullFailureProb(hoursStart, comp.weibullBeta, comp.weibullEta);
      const pFailEnd = weibullFailureProb(hoursEnd, comp.weibullBeta, comp.weibullEta);
      const pFailThisYear =
        (pFailEnd - pFailStart) * params.failureRateMultiplier * profile.failureProbMultiplier;
      const isWarrantyNow = t <= comp.warrantyYears + params.warrantyExtendedYears;
      if (!isWarrantyNow) {
        const repairCost =
          inflatedCost(comp.replacementCost, t, inflationEnabled ? params.inflationParts : 0) *
          (1 + comp.laborCostPct / 100) *
          1.3;
        yearFailure += pFailThisYear * repairCost;
        if (comp.failureImpact === "Critical" && comp.affectsIfFails.length > 0) {
          yearFailure += pFailThisYear * 0.3 * repairCost;
        }
      }

      if (includeDowntime) {
        const mttrYears = (comp.mttrHours * params.mttrMultiplier) / annualHours;
        yearDowntime +=
          pFailThisYear *
          mttrYears *
          365 *
          DOWNTIME_DATA.revenuePerDayActive *
          (isWarrantyNow ? 0.5 : 1.0);
      }
    }

    pmCost += yearMaint;
    replaceCost += yearReplace;
    consumableCost += yearConsumable;
    failureCost += yearFailure;
    downtimeCost += yearDowntime;
    warrantySavings += yearWarranty;

    yearlyBreakdown.push({
      year: t,
      maintenance: yearMaint,
      replacement: yearReplace,
      consumables: yearConsumable,
      failures: yearFailure,
      downtime: yearDowntime,
      warranty: yearWarranty,
      total: yearMaint + yearReplace + yearConsumable + yearFailure + yearDowntime + yearWarranty,
      cumulative: 0,
    });
  }

  let cumSum = capitalCost;
  yearlyBreakdown.forEach((y) => {
    cumSum += y.total;
    y.cumulative = cumSum;
  });

  const totalTCO =
    capitalCost +
    pmCost +
    replaceCost +
    consumableCost +
    failureCost +
    downtimeCost +
    warrantySavings;

  const mttrAvg =
    (COMPONENTS.reduce((s, c) => s + c.mttrHours, 0) / COMPONENTS.length) * params.mttrMultiplier;
  const mtbfFleetAvg = COMPONENTS.reduce((s, c) => s + c.mtbfHours, 0) / COMPONENTS.length;
  const availabilityPct = (mtbfFleetAvg / (mtbfFleetAvg + mttrAvg)) * 100;

  // Customer vs organization split. `warrantySavings` is accumulated as a
  // negative offset — the cost the customer never sees because warranty absorbed
  // it. The organization carries that plus the reserve held against expected
  // part failures.
  const warrantyCovered = Math.abs(warrantySavings);
  const warrantyReserve = PARTS.reduce((s, p) => s + companyBuffer(p), 0);

  return {
    totalTCO,
    breakdown: {
      capital: capitalCost,
      maintenance: pmCost,
      replacements: replaceCost,
      consumables: consumableCost,
      failures: failureCost,
      downtime: downtimeCost,
      warrantyOffset: warrantySavings,
    },
    split: {
      customerTCO: totalTCO,
      organizationTCO: warrantyCovered + warrantyReserve,
      warrantyCovered,
      warrantyReserve,
    },
    financials: {
      annualAvg: totalTCO / N,
      costPerKm: totalTCO / (loco.annualKm * N),
    },
    availability: { mttrAvg, mtbfFleetAvg, availabilityPct },
    yearlyBreakdown,
  };
}

// Sensitivity data (static tornado) — fuel and discount rate removed with the
// fields that drove them.
export const SENSITIVITY_DATA = [
  { param: "Operating Profile", impact: 19 },
  { param: "Failure Rate", impact: 17 },
  { param: "Labor Escalation", impact: 15 },
  { param: "Maint Interval", impact: 13 },
  { param: "Weibull Beta", impact: 11 },
  { param: "Warranty Cover", impact: 9 },
  { param: "Consumable Qty", impact: 6 },
  { param: "Downtime Cost", impact: 5 },
  { param: "Warranty Period", impact: 4 },
];
