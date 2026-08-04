// All synthetic data — in-memory only, no API calls.

export interface Locomotive {
  id: string;
  model: string;
  manufacturer: string;
  type: string;
  horsepower: number;
  purchaseCost: number;
  commissionYear: number;
  plannedLifeYears: number;
  currentAgeYears: number;
  annualKm: number;
  annualHours: number;
  fuelType: "Diesel" | "Electric";
  fuelConsumptionLPer100km?: number;
  fuelCostPerLiter?: number;
  energyCostPerKWh?: number;
  energyKWhPer100km?: number;
  status: string;
  fleetCount: number;
  color: string;
  operatingProfile: string;
  co2PerLiter?: number;
  co2PerKWh?: number;
  currentHealthScore: number;
  availabilityPct: number;
}

export const LOCOMOTIVES: Locomotive[] = [
  {
    id: "loco-001",
    model: "ES44AC Evolution Series",
    manufacturer: "Wabtec",
    type: "AC Freight",
    horsepower: 4400,
    purchaseCost: 2800000,
    commissionYear: 2020,
    plannedLifeYears: 30,
    currentAgeYears: 4,
    annualKm: 240000,
    annualHours: 5500,
    fuelType: "Diesel",
    fuelConsumptionLPer100km: 38,
    fuelCostPerLiter: 1.42,
    status: "Active",
    fleetCount: 12,
    color: "#1E8AFF",
    operatingProfile: "heavy-freight",
    co2PerLiter: 2.68,
    currentHealthScore: 88,
    availabilityPct: 94.2,
  },
  {
    id: "loco-002",
    model: "FLXdrive Battery-Electric",
    manufacturer: "Wabtec",
    type: "Battery Electric",
    horsepower: 6200,
    purchaseCost: 5100000,
    commissionYear: 2022,
    plannedLifeYears: 25,
    currentAgeYears: 2,
    annualKm: 180000,
    annualHours: 4200,
    fuelType: "Electric",
    energyCostPerKWh: 0.09,
    energyKWhPer100km: 125,
    status: "Active",
    fleetCount: 5,
    color: "#00D4B4",
    operatingProfile: "passenger",
    co2PerKWh: 0.233,
    currentHealthScore: 96,
    availabilityPct: 97.8,
  },
  {
    id: "loco-003",
    model: "AC4400CW Legacy",
    manufacturer: "Wabtec",
    type: "AC Freight",
    horsepower: 4400,
    purchaseCost: 2200000,
    commissionYear: 2015,
    plannedLifeYears: 30,
    currentAgeYears: 9,
    annualKm: 220000,
    annualHours: 5000,
    fuelType: "Diesel",
    fuelConsumptionLPer100km: 42,
    fuelCostPerLiter: 1.42,
    status: "Maintenance",
    fleetCount: 8,
    color: "#FF6B2B",
    operatingProfile: "heavy-freight",
    co2PerLiter: 2.68,
    currentHealthScore: 71,
    availabilityPct: 88.5,
  },
];

export interface OperatingProfile {
  id: string;
  name: string;
  fuelMultiplier: number;
  wearMultiplier: number;
  maintenanceFreqMultiplier: number;
  failureProbMultiplier: number;
  annualKm: number;
  annualHours: number;
  description: string;
}

export const OPERATING_PROFILES: OperatingProfile[] = [
  { id: "heavy-freight", name: "Heavy Freight", fuelMultiplier: 1.0, wearMultiplier: 1.0, maintenanceFreqMultiplier: 1.0, failureProbMultiplier: 1.0, annualKm: 240000, annualHours: 5500, description: "Standard heavy freight on mainline track" },
  { id: "passenger", name: "Passenger Express", fuelMultiplier: 0.85, wearMultiplier: 0.75, maintenanceFreqMultiplier: 0.9, failureProbMultiplier: 0.8, annualKm: 180000, annualHours: 4200, description: "Passenger service — lower loads, smoother track" },
  { id: "yard-switching", name: "Yard Switching", fuelMultiplier: 1.3, wearMultiplier: 1.8, maintenanceFreqMultiplier: 1.6, failureProbMultiplier: 1.7, annualKm: 60000, annualHours: 3000, description: "Constant stop-start, high brake wear" },
  { id: "metro", name: "Metro / Urban Rail", fuelMultiplier: 0.9, wearMultiplier: 1.4, maintenanceFreqMultiplier: 1.3, failureProbMultiplier: 1.2, annualKm: 120000, annualHours: 5000, description: "High-frequency stops, intensive daily cycles" },
  { id: "mining", name: "Mining / Heavy Haul", fuelMultiplier: 1.4, wearMultiplier: 2.2, maintenanceFreqMultiplier: 1.8, failureProbMultiplier: 2.0, annualKm: 200000, annualHours: 6500, description: "Extreme loads, dusty environment, harsh terrain" },
  { id: "mountain", name: "Mountain Route", fuelMultiplier: 1.25, wearMultiplier: 1.5, maintenanceFreqMultiplier: 1.4, failureProbMultiplier: 1.5, annualKm: 150000, annualHours: 5200, description: "High grade climbs, heavy brake use on descents" },
  { id: "desert", name: "Desert / Hot Climate", fuelMultiplier: 1.1, wearMultiplier: 1.3, maintenanceFreqMultiplier: 1.2, failureProbMultiplier: 1.35, annualKm: 230000, annualHours: 5800, description: "Heat stress on cooling and electrical systems" },
  { id: "cold-climate", name: "Cold Climate / Arctic", fuelMultiplier: 1.2, wearMultiplier: 1.25, maintenanceFreqMultiplier: 1.3, failureProbMultiplier: 1.4, annualKm: 200000, annualHours: 5000, description: "Cold start stress, freeze-thaw on seals and fluids" },
];

export interface SystemNode {
  id: string;
  locomotiveId: string;
  name: string;
  icon: string;
  criticality: string;
  healthScore: number;
}

export const SYSTEMS: SystemNode[] = [
  { id: "sys-eng", locomotiveId: "loco-001", name: "Engine System", icon: "Zap", criticality: "Critical", healthScore: 85 },
  { id: "sys-brk", locomotiveId: "loco-001", name: "Brake System", icon: "Disc", criticality: "Critical", healthScore: 78 },
  { id: "sys-elc", locomotiveId: "loco-001", name: "Electrical System", icon: "Cpu", criticality: "High", healthScore: 92 },
  { id: "sys-fuel", locomotiveId: "loco-001", name: "Fuel System", icon: "Droplets", criticality: "High", healthScore: 88 },
  { id: "sys-hvac", locomotiveId: "loco-001", name: "HVAC & Cooling", icon: "Wind", criticality: "Medium", healthScore: 94 },
  { id: "sys-trc", locomotiveId: "loco-001", name: "Traction System", icon: "Gauge", criticality: "Critical", healthScore: 90 },
  { id: "sys-bat", locomotiveId: "loco-002", name: "Battery Pack", icon: "Battery", criticality: "Critical", healthScore: 97 },
  { id: "sys-inv", locomotiveId: "loco-002", name: "Power Inverter", icon: "Zap", criticality: "Critical", healthScore: 95 },
  { id: "sys-brk2", locomotiveId: "loco-002", name: "Regen Brake System", icon: "Disc", criticality: "High", healthScore: 98 },
  { id: "sys-eng3", locomotiveId: "loco-003", name: "Engine System", icon: "Zap", criticality: "Critical", healthScore: 68 },
  { id: "sys-brk3", locomotiveId: "loco-003", name: "Brake System", icon: "Disc", criticality: "Critical", healthScore: 72 },
  { id: "sys-trc3", locomotiveId: "loco-003", name: "Traction System", icon: "Gauge", criticality: "Critical", healthScore: 75 },
];

export interface Assembly {
  id: string;
  systemId: string;
  name: string;
}

export const ASSEMBLIES: Assembly[] = [
  { id: "asm-ep", systemId: "sys-eng", name: "Engine Power Assembly" },
  { id: "asm-lube", systemId: "sys-eng", name: "Lubrication Assembly" },
  { id: "asm-air", systemId: "sys-eng", name: "Air Intake Assembly" },
  { id: "asm-bfa", systemId: "sys-brk", name: "Brake Foundation Assembly" },
  { id: "asm-bair", systemId: "sys-brk", name: "Brake Air Assembly" },
  { id: "asm-gen", systemId: "sys-elc", name: "Main Generator Assembly" },
  { id: "asm-aux", systemId: "sys-elc", name: "Aux Power Assembly" },
  { id: "asm-ftk", systemId: "sys-fuel", name: "Fuel Tank & Pump Assembly" },
  { id: "asm-inj", systemId: "sys-fuel", name: "Fuel Injection Assembly" },
  { id: "asm-rad", systemId: "sys-hvac", name: "Radiator Assembly" },
  { id: "asm-cpr", systemId: "sys-hvac", name: "Compressor Assembly" },
  { id: "asm-trm", systemId: "sys-trc", name: "Traction Motor Assembly" },
  { id: "asm-axl", systemId: "sys-trc", name: "Axle & Gear Assembly" },
];

export interface Consumable {
  name: string;
  unitCost: number;
  qtyPerService: number;
  unit: string;
}

export interface Component {
  id: string;
  assemblyId: string;
  name: string;
  purchaseCost: number;
  replacementCost: number;
  lifeYears: number;
  pmTrigger: { intervalMonths: number | null; intervalKm: number | null; intervalHours: number | null };
  mtbfHours: number;
  weibullBeta: number;
  weibullEta: number;
  mttrHours: number;
  warrantyYears: number;
  laborCostPct: number;
  consumable: Consumable | null;
  failureImpact: string;
  category: string;
  currentHours: number;
  rulYears: number;
  rulConfidence: number;
  downtimeCostPerDay: number;
  dependsOn: string[];
  affectsIfFails: string[];
  healthScore: number;
}

export const COMPONENTS: Component[] = [
  { id: "cmp-001", assemblyId: "asm-ep", name: "Engine Block (V16 Diesel)", purchaseCost: 320000, replacementCost: 340000, lifeYears: 20, pmTrigger: { intervalMonths: null, intervalKm: null, intervalHours: null }, mtbfHours: 80000, weibullBeta: 2.8, weibullEta: 88000, mttrHours: 96, warrantyYears: 3, laborCostPct: 22, consumable: null, failureImpact: "Critical", category: "Major Component", currentHours: 22000, rulYears: 14.2, rulConfidence: 89, downtimeCostPerDay: 18500, dependsOn: [], affectsIfFails: ["cmp-002", "cmp-011"], healthScore: 86 },
  { id: "cmp-002", assemblyId: "asm-lube", name: "Engine Oil Pump", purchaseCost: 4200, replacementCost: 4500, lifeYears: 8, pmTrigger: { intervalMonths: 6, intervalKm: 120000, intervalHours: 2500 }, mtbfHours: 18000, weibullBeta: 1.8, weibullEta: 20000, mttrHours: 8, warrantyYears: 2, laborCostPct: 18, consumable: { name: "Engine Oil (SAE 40)", unitCost: 4.2, qtyPerService: 220, unit: "L" }, failureImpact: "Critical", category: "Consumable Component", currentHours: 22000, rulYears: 3.6, rulConfidence: 84, downtimeCostPerDay: 12000, dependsOn: ["cmp-001"], affectsIfFails: ["cmp-001"], healthScore: 74 },
  { id: "cmp-003", assemblyId: "asm-air", name: "Primary Air Filter", purchaseCost: 580, replacementCost: 620, lifeYears: 1, pmTrigger: { intervalMonths: 6, intervalKm: 80000, intervalHours: 1500 }, mtbfHours: 10000, weibullBeta: 1.2, weibullEta: 11000, mttrHours: 2, warrantyYears: 1, laborCostPct: 10, consumable: null, failureImpact: "Medium", category: "Filter", currentHours: 3500, rulYears: 0.4, rulConfidence: 92, downtimeCostPerDay: 4000, dependsOn: [], affectsIfFails: ["cmp-001"], healthScore: 61 },
  { id: "cmp-004", assemblyId: "asm-air", name: "Secondary Air Filter", purchaseCost: 320, replacementCost: 340, lifeYears: 1, pmTrigger: { intervalMonths: 12, intervalKm: 120000, intervalHours: 2500 }, mtbfHours: 12000, weibullBeta: 1.2, weibullEta: 13000, mttrHours: 1.5, warrantyYears: 1, laborCostPct: 8, consumable: null, failureImpact: "Low", category: "Filter", currentHours: 3500, rulYears: 0.8, rulConfidence: 94, downtimeCostPerDay: 1500, dependsOn: ["cmp-003"], affectsIfFails: [], healthScore: 80 },
  { id: "cmp-005", assemblyId: "asm-bfa", name: "Brake Pad Set (per axle)", purchaseCost: 2200, replacementCost: 2400, lifeYears: 2, pmTrigger: { intervalMonths: 18, intervalKm: 300000, intervalHours: 5000 }, mtbfHours: 5000, weibullBeta: 3.5, weibullEta: 5500, mttrHours: 6, warrantyYears: 1, laborCostPct: 20, consumable: null, failureImpact: "Critical", category: "Wear Component", currentHours: 22000, rulYears: 0.6, rulConfidence: 82, downtimeCostPerDay: 22000, dependsOn: [], affectsIfFails: [], healthScore: 55 },
  { id: "cmp-006", assemblyId: "asm-bfa", name: "Brake Disc Set", purchaseCost: 8500, replacementCost: 9200, lifeYears: 6, pmTrigger: { intervalMonths: 36, intervalKm: 500000, intervalHours: 12000 }, mtbfHours: 25000, weibullBeta: 2.5, weibullEta: 27000, mttrHours: 12, warrantyYears: 2, laborCostPct: 25, consumable: null, failureImpact: "Critical", category: "Wear Component", currentHours: 22000, rulYears: 2.4, rulConfidence: 87, downtimeCostPerDay: 22000, dependsOn: ["cmp-005"], affectsIfFails: [], healthScore: 70 },
  { id: "cmp-007", assemblyId: "asm-bair", name: "Air Compressor", purchaseCost: 14500, replacementCost: 15800, lifeYears: 12, pmTrigger: { intervalMonths: 12, intervalKm: 200000, intervalHours: 4000 }, mtbfHours: 35000, weibullBeta: 2.0, weibullEta: 38000, mttrHours: 16, warrantyYears: 2, laborCostPct: 15, consumable: { name: "Compressor Oil", unitCost: 12.5, qtyPerService: 8, unit: "L" }, failureImpact: "High", category: "Rotating Equipment", currentHours: 22000, rulYears: 5.2, rulConfidence: 88, downtimeCostPerDay: 8000, dependsOn: [], affectsIfFails: ["cmp-005", "cmp-006"], healthScore: 82 },
  { id: "cmp-008", assemblyId: "asm-gen", name: "Main Alternator", purchaseCost: 185000, replacementCost: 195000, lifeYears: 15, pmTrigger: { intervalMonths: 24, intervalKm: 400000, intervalHours: 8000 }, mtbfHours: 60000, weibullBeta: 2.2, weibullEta: 65000, mttrHours: 48, warrantyYears: 3, laborCostPct: 20, consumable: { name: "Generator Grease", unitCost: 28, qtyPerService: 5, unit: "kg" }, failureImpact: "Critical", category: "Major Component", currentHours: 22000, rulYears: 7.1, rulConfidence: 91, downtimeCostPerDay: 25000, dependsOn: ["cmp-001"], affectsIfFails: ["cmp-009", "cmp-015"], healthScore: 90 },
  { id: "cmp-009", assemblyId: "asm-aux", name: "Auxiliary Power Unit", purchaseCost: 42000, replacementCost: 45000, lifeYears: 10, pmTrigger: { intervalMonths: 12, intervalKm: 200000, intervalHours: 4000 }, mtbfHours: 30000, weibullBeta: 1.8, weibullEta: 33000, mttrHours: 20, warrantyYears: 2, laborCostPct: 18, consumable: null, failureImpact: "High", category: "Power Equipment", currentHours: 22000, rulYears: 4.0, rulConfidence: 85, downtimeCostPerDay: 10000, dependsOn: ["cmp-008"], affectsIfFails: ["cmp-010"], healthScore: 87 },
  { id: "cmp-010", assemblyId: "asm-aux", name: "Control Electronics Module", purchaseCost: 22000, replacementCost: 24000, lifeYears: 8, pmTrigger: { intervalMonths: 24, intervalKm: null, intervalHours: 8000 }, mtbfHours: 45000, weibullBeta: 1.5, weibullEta: 50000, mttrHours: 12, warrantyYears: 3, laborCostPct: 12, consumable: null, failureImpact: "High", category: "Electronics", currentHours: 22000, rulYears: 5.5, rulConfidence: 93, downtimeCostPerDay: 15000, dependsOn: ["cmp-009"], affectsIfFails: [], healthScore: 93 },
  { id: "cmp-011", assemblyId: "asm-inj", name: "Fuel Injectors (set of 16)", purchaseCost: 28000, replacementCost: 30000, lifeYears: 6, pmTrigger: { intervalMonths: 12, intervalKm: 200000, intervalHours: 4000 }, mtbfHours: 20000, weibullBeta: 2.1, weibullEta: 22000, mttrHours: 24, warrantyYears: 2, laborCostPct: 22, consumable: null, failureImpact: "Critical", category: "Fuel Component", currentHours: 22000, rulYears: 2.0, rulConfidence: 80, downtimeCostPerDay: 18000, dependsOn: ["cmp-001"], affectsIfFails: ["cmp-001"], healthScore: 78 },
  { id: "cmp-012", assemblyId: "asm-ftk", name: "Fuel Filter (primary)", purchaseCost: 380, replacementCost: 400, lifeYears: 0.5, pmTrigger: { intervalMonths: 6, intervalKm: 80000, intervalHours: 1500 }, mtbfHours: 8000, weibullBeta: 1.4, weibullEta: 9000, mttrHours: 1, warrantyYears: 1, laborCostPct: 10, consumable: null, failureImpact: "Medium", category: "Filter", currentHours: 3500, rulYears: 0.25, rulConfidence: 96, downtimeCostPerDay: 3000, dependsOn: [], affectsIfFails: ["cmp-011"], healthScore: 65 },
  { id: "cmp-013", assemblyId: "asm-rad", name: "Radiator Core Assembly", purchaseCost: 32000, replacementCost: 34500, lifeYears: 12, pmTrigger: { intervalMonths: 12, intervalKm: 200000, intervalHours: 4000 }, mtbfHours: 40000, weibullBeta: 2.0, weibullEta: 44000, mttrHours: 18, warrantyYears: 2, laborCostPct: 20, consumable: { name: "Coolant (extended life)", unitCost: 3.8, qtyPerService: 180, unit: "L" }, failureImpact: "High", category: "Cooling", currentHours: 22000, rulYears: 4.8, rulConfidence: 90, downtimeCostPerDay: 9000, dependsOn: [], affectsIfFails: ["cmp-001", "cmp-008"], healthScore: 88 },
  { id: "cmp-014", assemblyId: "asm-cpr", name: "A/C Compressor", purchaseCost: 5800, replacementCost: 6200, lifeYears: 7, pmTrigger: { intervalMonths: 12, intervalKm: null, intervalHours: 3000 }, mtbfHours: 15000, weibullBeta: 1.8, weibullEta: 17000, mttrHours: 8, warrantyYears: 2, laborCostPct: 15, consumable: { name: "Refrigerant R-134a", unitCost: 18.5, qtyPerService: 3.2, unit: "kg" }, failureImpact: "Low", category: "HVAC", currentHours: 22000, rulYears: 2.5, rulConfidence: 86, downtimeCostPerDay: 1200, dependsOn: [], affectsIfFails: [], healthScore: 91 },
  { id: "cmp-015", assemblyId: "asm-trm", name: "Traction Motor (per bogie)", purchaseCost: 52000, replacementCost: 55000, lifeYears: 20, pmTrigger: { intervalMonths: 24, intervalKm: 400000, intervalHours: 8000 }, mtbfHours: 70000, weibullBeta: 2.5, weibullEta: 76000, mttrHours: 40, warrantyYears: 3, laborCostPct: 25, consumable: { name: "Motor Grease", unitCost: 32, qtyPerService: 4, unit: "kg" }, failureImpact: "Critical", category: "Major Component", currentHours: 22000, rulYears: 11.0, rulConfidence: 92, downtimeCostPerDay: 28000, dependsOn: ["cmp-008"], affectsIfFails: [], healthScore: 92 },
  { id: "cmp-016", assemblyId: "asm-axl", name: "Axle Bearing Set", purchaseCost: 12000, replacementCost: 13000, lifeYears: 8, pmTrigger: { intervalMonths: 24, intervalKm: 400000, intervalHours: 8000 }, mtbfHours: 40000, weibullBeta: 2.8, weibullEta: 44000, mttrHours: 20, warrantyYears: 2, laborCostPct: 20, consumable: { name: "Axle Grease", unitCost: 25, qtyPerService: 6, unit: "kg" }, failureImpact: "Critical", category: "Rotating Equipment", currentHours: 22000, rulYears: 3.8, rulConfidence: 88, downtimeCostPerDay: 20000, dependsOn: [], affectsIfFails: ["cmp-015"], healthScore: 80 },
];

export interface MaintenanceSchedule {
  id: string;
  locomotiveId: string;
  name: string;
  triggerMonths: number | null;
  triggerKm: number | null;
  triggerHours: number | null;
  rule: string;
  laborHours: number;
  laborRatePerHour: number;
  partsEstimate: number;
  type: "Preventive" | "Overhaul" | "Rebuild";
}

export const MAINTENANCE_SCHEDULES: MaintenanceSchedule[] = [
  { id: "ms-01", locomotiveId: "loco-001", name: "184-Day Inspection", triggerMonths: 6, triggerKm: 120000, triggerHours: 2500, rule: "whichever-first", laborHours: 16, laborRatePerHour: 95, partsEstimate: 3200, type: "Preventive" },
  { id: "ms-02", locomotiveId: "loco-001", name: "Annual Service", triggerMonths: 12, triggerKm: 240000, triggerHours: 5500, rule: "whichever-first", laborHours: 40, laborRatePerHour: 95, partsEstimate: 18500, type: "Preventive" },
  { id: "ms-03", locomotiveId: "loco-001", name: "Bi-Annual Overhaul", triggerMonths: 24, triggerKm: 480000, triggerHours: 11000, rule: "whichever-first", laborHours: 120, laborRatePerHour: 95, partsEstimate: 68000, type: "Overhaul" },
  { id: "ms-04", locomotiveId: "loco-001", name: "5-Year Major Overhaul", triggerMonths: 60, triggerKm: 1200000, triggerHours: 27500, rule: "whichever-first", laborHours: 320, laborRatePerHour: 95, partsEstimate: 185000, type: "Overhaul" },
  { id: "ms-05", locomotiveId: "loco-001", name: "10-Year Full Rebuild", triggerMonths: 120, triggerKm: null, triggerHours: 55000, rule: "whichever-first", laborHours: 800, laborRatePerHour: 95, partsEstimate: 480000, type: "Rebuild" },
];

export const INFLATION_RATES = {
  labor: 3.5,
  fuel: 4.2,
  spareParts: 2.8,
  consumables: 3.0,
};

export const HISTORICAL_TCO = [
  { year: 2020, capex: 2800000, maintenance: 145000, consumables: 52000, labor: 88000, failures: 32000, warranty: -28000, fuel: 390000, downtime: 48000 },
  { year: 2021, capex: 0, maintenance: 152000, consumables: 54000, labor: 91000, failures: 28000, warranty: -22000, fuel: 402000, downtime: 38000 },
  { year: 2022, capex: 0, maintenance: 158000, consumables: 57000, labor: 95000, failures: 35000, warranty: -18000, fuel: 418000, downtime: 52000 },
  { year: 2023, capex: 0, maintenance: 165000, consumables: 59000, labor: 98000, failures: 42000, warranty: -8000, fuel: 435000, downtime: 61000 },
  { year: 2024, capex: 0, maintenance: 172000, consumables: 62000, labor: 102000, failures: 38000, warranty: 0, fuel: 452000, downtime: 55000 },
];

export const FORECAST_TCO = [
  { year: 2025, maintenance: 185000, consumables: 65000, labor: 108000, failures: 44000, fuel: 472000, downtime: 58000, p10: 820000, p90: 1040000 },
  { year: 2026, maintenance: 196000, consumables: 68000, labor: 114000, failures: 46000, fuel: 492000, downtime: 61000, p10: 850000, p90: 1095000 },
  { year: 2027, maintenance: 208000, consumables: 71000, labor: 120000, failures: 52000, fuel: 514000, downtime: 68000, p10: 885000, p90: 1160000 },
  { year: 2028, maintenance: 220000, consumables: 74000, labor: 126000, failures: 55000, fuel: 537000, downtime: 72000, p10: 915000, p90: 1210000 },
  { year: 2029, maintenance: 234000, consumables: 78000, labor: 133000, failures: 60000, fuel: 560000, downtime: 78000, p10: 950000, p90: 1280000 },
  { year: 2030, maintenance: 248000, consumables: 82000, labor: 140000, failures: 420000, fuel: 584000, downtime: 85000, p10: 1200000, p90: 1820000 },
];

export const DOWNTIME_DATA = {
  revenuePerDayActive: 28000,
  penaltyPerDelayedHour: 4500,
  avgUnplannedDowntimeDaysPerYear: 6.2,
  avgPlannedDowntimeDaysPerYear: 12.0,
  unplannedDowntimeCostMultiplier: 2.4,
};

export const MONTE_CARLO_RESULTS = {
  n: 1000,
  planningHorizon: 20,
  p5: 3280000,
  p10: 3420000,
  p25: 3610000,
  p50: 3820000,
  p75: 4080000,
  p90: 4350000,
  p95: 4580000,
  mean: 3840000,
  stdDev: 285000,
  histogram: [
    { bin: "< $3.2M", count: 18 },
    { bin: "$3.2M – $3.4M", count: 62 },
    { bin: "$3.4M – $3.6M", count: 148 },
    { bin: "$3.6M – $3.8M", count: 224 },
    { bin: "$3.8M – $4.0M", count: 231 },
    { bin: "$4.0M – $4.2M", count: 178 },
    { bin: "$4.2M – $4.4M", count: 94 },
    { bin: "$4.4M – $4.6M", count: 31 },
    { bin: "> $4.6M", count: 14 },
  ],
  varianceDrivers: [
    { param: "Failure Rate", contribution: 22 },
    { param: "Labor Rate", contribution: 18 },
    { param: "Maintenance Intv", contribution: 14 },
    { param: "Inflation Rate", contribution: 9 },
    { param: "Downtime Duration", contribution: 6 },
  ],
};

export interface Competitor {
  id: string;
  name: string;
  purchaseCost: number;
  maintenanceCostPerKm: number;
  pmIntervalDays: number;
  overhaul10YrCost: number;
  warrantyYears: number;
  mtbfHoursEngine: number;
  tco20yr: number;
  marketShare: number;
  brakeLifeYears: number;
  tireLifeKm: number;
  reliabilityAt10yr: number;
  availabilityPct: number;
  co2PerKm: number;
  isOwn?: boolean;
}

export const COMPETITORS: Competitor[] = [
  { id: "comp-ge", name: "GE Transportation T4", purchaseCost: 2950000, maintenanceCostPerKm: 0.19, pmIntervalDays: 184, overhaul10YrCost: 520000, warrantyYears: 2, mtbfHoursEngine: 75000, tco20yr: 3980000, marketShare: 32, brakeLifeYears: 1.8, tireLifeKm: 280000, reliabilityAt10yr: 72, availabilityPct: 91.5, co2PerKm: 1.02 },
  { id: "comp-siemens", name: "Siemens Vectron MS", purchaseCost: 3400000, maintenanceCostPerKm: 0.17, pmIntervalDays: 200, overhaul10YrCost: 490000, warrantyYears: 3, mtbfHoursEngine: 90000, tco20yr: 4100000, marketShare: 18, brakeLifeYears: 2.5, tireLifeKm: 350000, reliabilityAt10yr: 80, availabilityPct: 95.1, co2PerKm: 0.89 },
  { id: "comp-alstom", name: "Alstom Prima H3", purchaseCost: 3150000, maintenanceCostPerKm: 0.18, pmIntervalDays: 180, overhaul10YrCost: 505000, warrantyYears: 2, mtbfHoursEngine: 82000, tco20yr: 4050000, marketShare: 14, brakeLifeYears: 2.0, tireLifeKm: 310000, reliabilityAt10yr: 77, availabilityPct: 93.2, co2PerKm: 0.96 },
  { id: "comp-wabtec", name: "Wabtec ES44AC", purchaseCost: 2800000, maintenanceCostPerKm: 0.18, pmIntervalDays: 184, overhaul10YrCost: 480000, warrantyYears: 3, mtbfHoursEngine: 80000, tco20yr: 3820000, marketShare: 36, brakeLifeYears: 2.2, tireLifeKm: 320000, reliabilityAt10yr: 78, availabilityPct: 94.2, co2PerKm: 0.97, isOwn: true },
];

export const RELIABILITY_CURVE_DATA = Array.from({ length: 21 }, (_, i) => ({
  year: i,
  es44ac: +(100 * Math.exp(-Math.pow((i * 5500) / 80000, 2.2))).toFixed(1),
  ac4400: +(100 * Math.exp(-Math.pow((i * 5000) / 70000, 2.0))).toFixed(1),
  flxdrive: +(100 * Math.exp(-Math.pow((i * 4200) / 90000, 1.8))).toFixed(1),
  ge_t4: +(100 * Math.exp(-Math.pow((i * 5500) / 75000, 2.1))).toFixed(1),
  siemens: +(100 * Math.exp(-Math.pow((i * 5500) / 90000, 2.0))).toFixed(1),
}));

export interface Scenario {
  id: string;
  name: string;
  color: string;
  planningHorizonYears: number;
  discountRate: number;
  laborRate: number;
  maintenanceIntervalMultiplier: number;
  failureRateMultiplier: number;
  warrantyExtendedYears: number;
  fuelCostPerLiter: number;
  inflationEnabled: boolean;
  includeDowntime: boolean;
  operatingProfile: string;
  tco: number;
}

export const PREDEFINED_SCENARIOS: Scenario[] = [
  { id: "sc-baseline", name: "Baseline", color: "#1E8AFF", planningHorizonYears: 20, discountRate: 5, laborRate: 95, maintenanceIntervalMultiplier: 1.0, failureRateMultiplier: 1.0, warrantyExtendedYears: 0, fuelCostPerLiter: 1.42, inflationEnabled: false, includeDowntime: false, operatingProfile: "heavy-freight", tco: 3820000 },
  { id: "sc-optimized", name: "Optimized Strategy", color: "#00D4B4", planningHorizonYears: 20, discountRate: 5, laborRate: 95, maintenanceIntervalMultiplier: 1.2, failureRateMultiplier: 0.9, warrantyExtendedYears: 2, fuelCostPerLiter: 1.42, inflationEnabled: true, includeDowntime: true, operatingProfile: "heavy-freight", tco: 3640000 },
  { id: "sc-worst", name: "Worst Case", color: "#EF4444", planningHorizonYears: 20, discountRate: 5, laborRate: 130, maintenanceIntervalMultiplier: 0.8, failureRateMultiplier: 2.0, warrantyExtendedYears: 0, fuelCostPerLiter: 2.1, inflationEnabled: true, includeDowntime: true, operatingProfile: "mining", tco: 5240000 },
  { id: "sc-high-fuel", name: "High Fuel Price", color: "#F59E0B", planningHorizonYears: 20, discountRate: 5, laborRate: 95, maintenanceIntervalMultiplier: 1.0, failureRateMultiplier: 1.0, warrantyExtendedYears: 0, fuelCostPerLiter: 2.2, inflationEnabled: true, includeDowntime: false, operatingProfile: "heavy-freight", tco: 4380000 },
  { id: "sc-ext-warranty", name: "Extended Warranty", color: "#7C3AED", planningHorizonYears: 20, discountRate: 5, laborRate: 95, maintenanceIntervalMultiplier: 1.0, failureRateMultiplier: 1.0, warrantyExtendedYears: 3, fuelCostPerLiter: 1.42, inflationEnabled: false, includeDowntime: false, operatingProfile: "heavy-freight", tco: 3690000 },
  { id: "sc-high-util", name: "High Utilisation", color: "#FF6B2B", planningHorizonYears: 20, discountRate: 5, laborRate: 95, maintenanceIntervalMultiplier: 0.9, failureRateMultiplier: 1.4, warrantyExtendedYears: 0, fuelCostPerLiter: 1.42, inflationEnabled: true, includeDowntime: true, operatingProfile: "heavy-freight", tco: 4120000 },
  { id: "sc-low-util", name: "Low Utilisation", color: "#22C55E", planningHorizonYears: 20, discountRate: 5, laborRate: 95, maintenanceIntervalMultiplier: 1.4, failureRateMultiplier: 0.7, warrantyExtendedYears: 0, fuelCostPerLiter: 1.42, inflationEnabled: false, includeDowntime: false, operatingProfile: "heavy-freight", tco: 3480000 },
  { id: "sc-high-labor", name: "High Labor Cost", color: "#A78BFA", planningHorizonYears: 20, discountRate: 5, laborRate: 155, maintenanceIntervalMultiplier: 1.0, failureRateMultiplier: 1.0, warrantyExtendedYears: 0, fuelCostPerLiter: 1.42, inflationEnabled: true, includeDowntime: false, operatingProfile: "heavy-freight", tco: 4210000 },
];

export const SUSTAINABILITY_DATA = {
  es44ac: { annualFuelLiters: 91200, annualCO2TonnesEmitted: 244.4, annualCO2TonnesVsBaseline: 12.2, energyEfficiencyScore: 72, sustainabilityScore: 58, carbonCostPerTonne: 48, annualCarbonCost: 11731, fuelSavingsVsPrev: 8400 },
  flxdrive: { annualEnergyKWh: 225000, annualCO2TonnesEmitted: 52.4, annualCO2TonnesVsBaseline: -192.0, energyEfficiencyScore: 96, sustainabilityScore: 94, carbonCostPerTonne: 48, annualCarbonCost: 2515, fuelSavingsVsDiesel: 82000 },
  ac4400: { annualFuelLiters: 92400, annualCO2TonnesEmitted: 247.6, annualCO2TonnesVsBaseline: 15.4, energyEfficiencyScore: 65, sustainabilityScore: 48, carbonCostPerTonne: 48, annualCarbonCost: 11885, fuelSavingsVsPrev: 0 },
};

export const FINANCIAL_METRICS_BASELINE = {
  npv20yr: 3820000,
  irr: 8.4,
  roi20yr: 142,
  paybackYears: 7.2,
  breakEvenKm: 1728000,
  cashFlowPositiveYear: 8,
  annualizedCost: 191000,
};

export const STANDARDS_COMPLIANCE = [
  { standard: "ISO 55000", name: "Asset Management", status: "Aligned", coverage: 88 },
  { standard: "EN 50126", name: "Railway RAMS", status: "Partial", coverage: 72 },
  { standard: "IEC 60300", name: "Dependability / LCC", status: "Aligned", coverage: 91 },
  { standard: "ISO 31000", name: "Risk Management", status: "Aligned", coverage: 84 },
  { standard: "MIL-HDBK-217", name: "Reliability Prediction (Electronic)", status: "Reference", coverage: 65 },
];

// Chart color palette (for Recharts props — design token equivalents)
export const CHART_COLORS = {
  blue: "#1E8AFF",
  teal: "#00D4B4",
  orange: "#FF6B2B",
  purple: "#7C3AED",
  yellow: "#F59E0B",
  red: "#EF4444",
  green: "#22C55E",
  textSecondary: "#7B9CC8",
  textMuted: "#3D5A80",
  grid: "rgba(56,139,253,0.12)",
};

export function healthColor(score: number): string {
  if (score >= 85) return CHART_COLORS.green;
  if (score >= 70) return CHART_COLORS.yellow;
  if (score >= 55) return CHART_COLORS.orange;
  return CHART_COLORS.red;
}
