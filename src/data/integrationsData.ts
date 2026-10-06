// Data integration catalog — real rail/enterprise systems that feed a locomotive
// TCO platform. Product names, vendors, protocols and standards are industry-real;
// per-connector sync/volume/error figures are demo-grade illustrative defaults.

export type ConnectorCategory =
  | "ERP"
  | "EAM"
  | "RailOEM"
  | "Telematics"
  | "Wayside"
  | "Historian"
  | "Fuel"
  | "PTC"
  | "Registry";

export type Protocol =
  | "REST"
  | "OData"
  | "SOAP"
  | "SFTP"
  | "Kafka"
  | "MQTT"
  | "OPC-UA"
  | "IDoc"
  | "BAPI"
  | "JDBC"
  | "S3"
  | "EDI";

export type AuthMethod = "OAuth2" | "API Key" | "mTLS" | "SAML" | "Basic" | "Kerberos";
export type ConnectorStatus = "connected" | "degraded" | "down" | "paused";

export interface FieldMapping {
  source: string; // native field/object in source system
  canonical: string; // field in the platform golden model
  entity: string;
}

export interface Connector {
  id: string;
  name: string;
  vendor: string;
  category: ConnectorCategory;
  dataDomain: string;
  protocol: Protocol[];
  auth: AuthMethod;
  syncFrequency: string;
  freshnessSlaMins: number;
  recordsPerDay: number;
  entities: string[];
  standards: string[];
  status: ConnectorStatus;
  lastSyncMinsAgo: number;
  errorRatePct: number;
  latencyMs: number;
  throughputPerMin: number;
  quotaUsedPct: number;
  dlqDepth: number;
  uptimePct: number;
  mappings: FieldMapping[];
  feeds: string[]; // downstream platform domains this connector powers
}

export const CONNECTORS: Connector[] = [
  {
    id: "sap-s4",
    name: "SAP S/4HANA",
    vendor: "SAP SE",
    category: "ERP",
    dataDomain: "Finance, cost centers & asset accounting",
    protocol: ["OData", "IDoc", "BAPI"],
    auth: "OAuth2",
    syncFrequency: "Nightly batch + event",
    freshnessSlaMins: 1440,
    recordsPerDay: 128000,
    entities: [
      "Cost Center",
      "GL Account",
      "Asset Master (ANLA)",
      "Internal Order",
      "WBS Element",
      "Vendor Invoice",
    ],
    standards: ["ISO 55000"],
    status: "connected",
    lastSyncMinsAgo: 42,
    errorRatePct: 0.2,
    latencyMs: 380,
    throughputPerMin: 890,
    quotaUsedPct: 34,
    dlqDepth: 3,
    uptimePct: 99.95,
    mappings: [
      { source: "ANLN1 / ANLN2", canonical: "assetId", entity: "Asset Master" },
      { source: "KOSTL", canonical: "costCenterId", entity: "Cost Center" },
      { source: "AFABE (dep. area)", canonical: "depreciationArea", entity: "Asset Master" },
    ],
    feeds: ["TCO Ledger", "Depreciation", "Forecasting"],
  },
  {
    id: "sap-pm",
    name: "SAP PM (Plant Maintenance)",
    vendor: "SAP SE",
    category: "EAM",
    dataDomain: "Work orders, functional locations & maintenance plans",
    protocol: ["OData", "IDoc", "BAPI"],
    auth: "mTLS",
    syncFrequency: "Hourly + real-time on status",
    freshnessSlaMins: 60,
    recordsPerDay: 24500,
    entities: [
      "Work Order (PM01/02/03)",
      "Notification",
      "Functional Location",
      "Equipment (EQUI)",
      "Maintenance Plan",
      "Measurement Doc",
    ],
    standards: ["ISO 55000", "MIMOSA CCOM"],
    status: "connected",
    lastSyncMinsAgo: 8,
    errorRatePct: 0.6,
    latencyMs: 520,
    throughputPerMin: 410,
    quotaUsedPct: 51,
    dlqDepth: 11,
    uptimePct: 99.9,
    mappings: [
      { source: "AUFNR", canonical: "workOrderId", entity: "Work Order" },
      { source: "EQUNR", canonical: "assetId", entity: "Equipment" },
      { source: "TPLNR", canonical: "functionalLocation", entity: "Functional Location" },
    ],
    feeds: ["Maintenance", "Asset Health", "BOM Consumption"],
  },
  {
    id: "sap-mm",
    name: "SAP MM (Materials Management)",
    vendor: "SAP SE",
    category: "ERP",
    dataDomain: "Spare parts stock, POs & reservations",
    protocol: ["OData", "IDoc"],
    auth: "OAuth2",
    syncFrequency: "Hourly",
    freshnessSlaMins: 120,
    recordsPerDay: 18200,
    entities: ["Material Master (MATMAS)", "Stock", "Purchase Order", "Reservation", "Vendor"],
    standards: ["S2000M"],
    status: "connected",
    lastSyncMinsAgo: 23,
    errorRatePct: 0.4,
    latencyMs: 310,
    throughputPerMin: 300,
    quotaUsedPct: 28,
    dlqDepth: 2,
    uptimePct: 99.92,
    mappings: [
      { source: "MATNR", canonical: "partNumber", entity: "Material Master" },
      { source: "LABST (unrestricted)", canonical: "onHandQty", entity: "Stock" },
      { source: "EKPO", canonical: "purchaseOrderLine", entity: "Purchase Order" },
    ],
    feeds: ["BOM Inventory", "Parts Cost", "Procurement"],
  },
  {
    id: "maximo",
    name: "IBM Maximo",
    vendor: "IBM",
    category: "EAM",
    dataDomain: "Asset registry, work management & condition monitoring",
    protocol: ["REST", "SOAP", "Kafka", "SFTP"],
    auth: "API Key",
    syncFrequency: "Real-time (JMS/REST)",
    freshnessSlaMins: 15,
    recordsPerDay: 41000,
    entities: [
      "Asset (ASSETNUM)",
      "Work Order",
      "Job Plan",
      "PM Schedule",
      "Meter Reading",
      "Inventory Item",
    ],
    standards: ["ISO 55000", "MIMOSA CCOM"],
    status: "degraded",
    lastSyncMinsAgo: 3,
    errorRatePct: 3.8,
    latencyMs: 940,
    throughputPerMin: 620,
    quotaUsedPct: 72,
    dlqDepth: 148,
    uptimePct: 98.4,
    mappings: [
      { source: "ASSETNUM", canonical: "assetId", entity: "Asset" },
      { source: "WONUM", canonical: "workOrderId", entity: "Work Order" },
      { source: "ITEMNUM", canonical: "partNumber", entity: "Inventory Item" },
    ],
    feeds: ["Asset Health", "Maintenance", "BOM Inventory"],
  },
  {
    id: "fdms",
    name: "Wabtec FDMS",
    vendor: "Wabtec Digital",
    category: "RailOEM",
    dataDomain: "Locomotive event-recorder & fault telemetry",
    protocol: ["REST", "MQTT", "S3"],
    auth: "OAuth2",
    syncFrequency: "Streaming + daily rollup",
    freshnessSlaMins: 5,
    recordsPerDay: 2100000,
    entities: ["Fault Code", "Engine Tag", "Mileage/Hours", "Fuel Burn", "Event Snapshot"],
    standards: ["IEC 61375", "EN 15380"],
    status: "connected",
    lastSyncMinsAgo: 1,
    errorRatePct: 0.9,
    latencyMs: 210,
    throughputPerMin: 14800,
    quotaUsedPct: 63,
    dlqDepth: 34,
    uptimePct: 99.7,
    mappings: [
      { source: "unit_road_number", canonical: "assetId", entity: "Engine Tag" },
      { source: "spn/fmi", canonical: "faultCode", entity: "Fault Code" },
      { source: "eng_hours", canonical: "currentHours", entity: "Mileage/Hours" },
    ],
    feeds: ["Reliability", "Asset Health", "Simulation"],
  },
  {
    id: "rmd",
    name: "Wabtec RM&D",
    vendor: "Wabtec Digital",
    category: "RailOEM",
    dataDomain: "Remote diagnostics, prognostics & health advisories",
    protocol: ["REST", "Kafka"],
    auth: "OAuth2",
    syncFrequency: "Real-time alerts + daily",
    freshnessSlaMins: 10,
    recordsPerDay: 8600,
    entities: ["Fault Code", "Health Score", "Recommended Action", "WO Recommendation"],
    standards: ["MIMOSA CCOM"],
    status: "connected",
    lastSyncMinsAgo: 4,
    errorRatePct: 1.1,
    latencyMs: 460,
    throughputPerMin: 90,
    quotaUsedPct: 40,
    dlqDepth: 6,
    uptimePct: 99.6,
    mappings: [
      { source: "health_index", canonical: "healthScore", entity: "Health Score" },
      { source: "advisory_id", canonical: "recommendationId", entity: "Recommended Action" },
    ],
    feeds: ["Asset Health", "Maintenance", "Monte Carlo"],
  },
  {
    id: "healthhub",
    name: "Alstom HealthHub",
    vendor: "Alstom",
    category: "RailOEM",
    dataDomain: "Predictive maintenance & remaining-useful-life",
    protocol: ["REST", "S3"],
    auth: "OAuth2",
    syncFrequency: "Daily + event",
    freshnessSlaMins: 720,
    recordsPerDay: 5400,
    entities: ["Component Health", "RUL Prediction", "Wear Prediction"],
    standards: ["EN 15380", "ISO 55000"],
    status: "connected",
    lastSyncMinsAgo: 96,
    errorRatePct: 0.5,
    latencyMs: 640,
    throughputPerMin: 60,
    quotaUsedPct: 22,
    dlqDepth: 0,
    uptimePct: 99.8,
    mappings: [
      { source: "component_uid", canonical: "componentId", entity: "Component Health" },
      { source: "rul_days", canonical: "rulYears", entity: "RUL Prediction" },
    ],
    feeds: ["Reliability", "Asset Health", "Forecasting"],
  },
  {
    id: "railigent",
    name: "Siemens Railigent X",
    vendor: "Siemens Mobility",
    category: "RailOEM",
    dataDomain: "Fleet asset intelligence & energy analytics",
    protocol: ["REST", "Kafka", "OPC-UA", "S3"],
    auth: "OAuth2",
    syncFrequency: "Streaming + batch",
    freshnessSlaMins: 15,
    recordsPerDay: 940000,
    entities: ["Telemetry", "Prediction", "Energy", "Diagnostic"],
    standards: ["IEC 61375", "ISO 55000"],
    status: "connected",
    lastSyncMinsAgo: 2,
    errorRatePct: 1.4,
    latencyMs: 300,
    throughputPerMin: 6800,
    quotaUsedPct: 55,
    dlqDepth: 22,
    uptimePct: 99.5,
    mappings: [
      { source: "vehicle_evn", canonical: "assetId", entity: "Telemetry" },
      { source: "kwh_consumed", canonical: "energyKWh", entity: "Energy" },
    ],
    feeds: ["Sustainability", "Simulation", "Reliability"],
  },
  {
    id: "icom",
    name: "Knorr-Bremse iCOM",
    vendor: "Knorr-Bremse",
    category: "Telematics",
    dataDomain: "Brake, door & HVAC condition telemetry",
    protocol: ["REST", "MQTT"],
    auth: "OAuth2",
    syncFrequency: "Real-time streaming",
    freshnessSlaMins: 5,
    recordsPerDay: 620000,
    entities: ["Brake Parameter", "Door Event", "HVAC Status", "Sander Telemetry"],
    standards: ["IEC 61375"],
    status: "connected",
    lastSyncMinsAgo: 1,
    errorRatePct: 0.7,
    latencyMs: 180,
    throughputPerMin: 4300,
    quotaUsedPct: 48,
    dlqDepth: 9,
    uptimePct: 99.6,
    mappings: [
      { source: "bcu_pressure", canonical: "brakePressure", entity: "Brake Parameter" },
      { source: "hvac_temp_setpoint", canonical: "hvacStatus", entity: "HVAC Status" },
    ],
    feeds: ["Asset Health", "Maintenance"],
  },
  {
    id: "umler",
    name: "Railinc Umler",
    vendor: "Railinc (AAR)",
    category: "Registry",
    dataDomain: "Equipment registry — master asset identity",
    protocol: ["SOAP", "EDI", "SFTP"],
    auth: "API Key",
    syncFrequency: "Daily",
    freshnessSlaMins: 1440,
    recordsPerDay: 3200,
    entities: ["Reporting Mark", "Dimensions", "Ownership", "Restrictions"],
    standards: ["AAR MSRP", "AAR S-918 (AEI)"],
    status: "connected",
    lastSyncMinsAgo: 210,
    errorRatePct: 0.1,
    latencyMs: 1200,
    throughputPerMin: 40,
    quotaUsedPct: 12,
    dlqDepth: 0,
    uptimePct: 99.99,
    mappings: [
      { source: "equipment_id (mark+no.)", canonical: "assetId", entity: "Reporting Mark" },
      { source: "umler_owner", canonical: "ownerCode", entity: "Ownership" },
    ],
    feeds: ["Master Data (MDM)", "Fleet Explorer"],
  },
  {
    id: "ehms",
    name: "Railinc EHMS",
    vendor: "Railinc (AAR)",
    category: "Wayside",
    dataDomain: "Wayside detector alerts & component tracking",
    protocol: ["SOAP", "SFTP"],
    auth: "API Key",
    syncFrequency: "Event + daily",
    freshnessSlaMins: 60,
    recordsPerDay: 15600,
    entities: ["Detector Alert", "Component Track", "Maintenance Advisory"],
    standards: ["AAR MSRP", "AAR TADS"],
    status: "degraded",
    lastSyncMinsAgo: 34,
    errorRatePct: 4.2,
    latencyMs: 880,
    throughputPerMin: 120,
    quotaUsedPct: 38,
    dlqDepth: 61,
    uptimePct: 98.9,
    mappings: [
      { source: "wild_impact_kip", canonical: "wheelImpactKip", entity: "Detector Alert" },
      { source: "tads_growl_db", canonical: "bearingAcoustic", entity: "Detector Alert" },
    ],
    feeds: ["Asset Health", "Reliability", "Maintenance"],
  },
  {
    id: "crb",
    name: "Railinc CRB",
    vendor: "Railinc (AAR)",
    category: "Registry",
    dataDomain: "Interchange car-repair billing & job codes",
    protocol: ["EDI", "SFTP"],
    auth: "API Key",
    syncFrequency: "Daily batch",
    freshnessSlaMins: 1440,
    recordsPerDay: 4700,
    entities: ["Job Code", "Why Made Code", "Repair Cost", "Condition Code"],
    standards: ["AAR Interchange Rules", "EDI 414/417"],
    status: "connected",
    lastSyncMinsAgo: 180,
    errorRatePct: 0.3,
    latencyMs: 1500,
    throughputPerMin: 55,
    quotaUsedPct: 18,
    dlqDepth: 4,
    uptimePct: 99.9,
    mappings: [
      { source: "job_code", canonical: "repairJobCode", entity: "Job Code" },
      { source: "why_made_code", canonical: "failureReasonCode", entity: "Why Made Code" },
    ],
    feeds: ["Maintenance", "TCO Ledger", "BOM Consumption"],
  },
  {
    id: "trip-opt",
    name: "Wabtec Trip Optimizer",
    vendor: "Wabtec",
    category: "Telematics",
    dataDomain: "Energy management & fuel-burn trip data",
    protocol: ["SFTP", "REST"],
    auth: "API Key",
    syncFrequency: "Per-trip batch",
    freshnessSlaMins: 240,
    recordsPerDay: 9800,
    entities: ["Trip Summary", "Fuel Burn", "Notch Profile", "GPS Track"],
    standards: ["IEC 61375"],
    status: "connected",
    lastSyncMinsAgo: 52,
    errorRatePct: 0.8,
    latencyMs: 700,
    throughputPerMin: 110,
    quotaUsedPct: 30,
    dlqDepth: 7,
    uptimePct: 99.4,
    mappings: [
      { source: "fuel_gal_burned", canonical: "fuelLiters", entity: "Fuel Burn" },
      { source: "trip_id", canonical: "tripId", entity: "Trip Summary" },
    ],
    feeds: ["Sustainability", "Simulation", "Forecasting"],
  },
  {
    id: "fuel-mgmt",
    name: "Fuel Management System",
    vendor: "Mansfield / FuelMaster",
    category: "Fuel",
    dataDomain: "Depot fueling transactions",
    protocol: ["SFTP", "REST"],
    auth: "API Key",
    syncFrequency: "Nightly",
    freshnessSlaMins: 1440,
    recordsPerDay: 2400,
    entities: ["Loco ID", "Gallons", "Location", "Unit Price"],
    standards: [],
    status: "connected",
    lastSyncMinsAgo: 320,
    errorRatePct: 0.6,
    latencyMs: 540,
    throughputPerMin: 30,
    quotaUsedPct: 14,
    dlqDepth: 1,
    uptimePct: 99.7,
    mappings: [
      { source: "loco_id", canonical: "assetId", entity: "Loco ID" },
      { source: "gallons", canonical: "fuelLiters", entity: "Gallons" },
    ],
    feeds: ["TCO Ledger", "Sustainability"],
  },
  {
    id: "ptc-bos",
    name: "PTC Back Office (I-ETMS)",
    vendor: "Wabtec / Meteorcomm",
    category: "PTC",
    dataDomain: "Movement authorities & enforcement events",
    protocol: ["REST", "Kafka"],
    auth: "mTLS",
    syncFrequency: "Real-time",
    freshnessSlaMins: 2,
    recordsPerDay: 380000,
    entities: ["Authority", "Enforcement", "Brake Application", "Location"],
    standards: ["ITC Messaging", "IEC 61375"],
    status: "connected",
    lastSyncMinsAgo: 1,
    errorRatePct: 1.0,
    latencyMs: 150,
    throughputPerMin: 2900,
    quotaUsedPct: 44,
    dlqDepth: 18,
    uptimePct: 99.8,
    mappings: [
      { source: "enforcement_event", canonical: "enforcementId", entity: "Enforcement" },
      { source: "gps_pos", canonical: "location", entity: "Location" },
    ],
    feeds: ["Reliability", "Simulation"],
  },
  {
    id: "pi",
    name: "AVEVA PI System",
    vendor: "AVEVA (OSIsoft)",
    category: "Historian",
    dataDomain: "OT historian — high-frequency sensor tags",
    protocol: ["REST", "OPC-UA", "JDBC"],
    auth: "Kerberos",
    syncFrequency: "1–15 min interpolated",
    freshnessSlaMins: 15,
    recordsPerDay: 5800000,
    entities: ["PI Point (Tag)", "Timestamp", "Value", "Quality", "AF Element"],
    standards: ["MIMOSA CCOM", "OPC-UA"],
    status: "connected",
    lastSyncMinsAgo: 6,
    errorRatePct: 0.2,
    latencyMs: 90,
    throughputPerMin: 42000,
    quotaUsedPct: 68,
    dlqDepth: 0,
    uptimePct: 99.95,
    mappings: [
      { source: "PI tag path", canonical: "sensorTag", entity: "PI Point" },
      { source: "AF element template", canonical: "assetId", entity: "AF Element" },
    ],
    feeds: ["Asset Health", "Simulation", "Reliability"],
  },
];

// ── Rail data & interchange standards referenced by the connectors ──
export interface DataStandard {
  code: string;
  name: string;
  body: string;
  scope: string;
  adoptionPct: number;
}

export const DATA_STANDARDS: DataStandard[] = [
  {
    code: "ISO 55000",
    name: "Asset Management",
    body: "ISO",
    scope: "Whole-life asset management governance",
    adoptionPct: 88,
  },
  {
    code: "AAR MSRP",
    name: "Manual of Standards & Recommended Practices",
    body: "AAR",
    scope: "Mechanical interchange standards",
    adoptionPct: 95,
  },
  {
    code: "Umler",
    name: "Equipment Registry",
    body: "Railinc",
    scope: "Master equipment identity & characteristics",
    adoptionPct: 99,
  },
  {
    code: "EHMS",
    name: "Equipment Health Management System",
    body: "Railinc",
    scope: "Wayside detector alert aggregation",
    adoptionPct: 82,
  },
  {
    code: "IEC 61375",
    name: "Train Communication Network (TCN)",
    body: "IEC",
    scope: "Onboard WTB/MVB/ETB data bus",
    adoptionPct: 76,
  },
  {
    code: "MIMOSA CCOM",
    name: "Common Conceptual Object Model",
    body: "MIMOSA",
    scope: "OT ⇄ EAM condition-data interchange",
    adoptionPct: 54,
  },
  {
    code: "EN 15380",
    name: "Rail Vehicle Classification",
    body: "CEN",
    scope: "Component taxonomy & designation",
    adoptionPct: 61,
  },
  {
    code: "S2000M",
    name: "Material / Spare-Parts Management",
    body: "ASD/AIA",
    scope: "Provisioning & codification of spares",
    adoptionPct: 47,
  },
  {
    code: "S1000D",
    name: "Technical Publications",
    body: "ASD/AIA",
    scope: "Modular IETP data modules",
    adoptionPct: 52,
  },
  {
    code: "railML",
    name: "Railway Markup Language",
    body: "railML.org",
    scope: "XML exchange — infra, rollingstock, timetable",
    adoptionPct: 44,
  },
];

// ── Pipeline stages for the data-flow / lineage view ──
export interface PipelineStage {
  id: string;
  name: string;
  description: string;
  recordsPerDay: number;
  healthPct: number;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "ingest",
    name: "Ingest",
    description: "Connectors land raw events (CDC, batch, stream)",
    recordsPerDay: 10600000,
    healthPct: 99.4,
  },
  {
    id: "validate",
    name: "Validate",
    description: "Schema & data-contract checks; DLQ on failure",
    recordsPerDay: 10580000,
    healthPct: 98.1,
  },
  {
    id: "map",
    name: "Map & Normalize",
    description: "Field mapping to canonical model",
    recordsPerDay: 10420000,
    healthPct: 99.0,
  },
  {
    id: "mdm",
    name: "MDM Resolve",
    description: "Reconcile asset IDs → golden record",
    recordsPerDay: 10420000,
    healthPct: 99.6,
  },
  {
    id: "load",
    name: "Load",
    description: "Publish to TCO warehouse & analytics marts",
    recordsPerDay: 10390000,
    healthPct: 99.8,
  },
];

// Master-data cross-reference: one locomotive identity across every source system.
export interface GoldenRecordXref {
  assetId: string;
  model: string;
  sapEqunr: string;
  maximoAssetnum: string;
  umlerMark: string;
  oemSerial: string;
  uicEvn: string;
}

export const GOLDEN_RECORDS: GoldenRecordXref[] = [
  {
    assetId: "loco-001",
    model: "ES44AC Evolution Series",
    sapEqunr: "10004411",
    maximoAssetnum: "LOCO-ES44-4411",
    umlerMark: "JTWX 4411",
    oemSerial: "WT-GEVO-88214",
    uicEvn: "92 80 1247 411-3",
  },
  {
    assetId: "loco-002",
    model: "FLXdrive Battery-Electric",
    sapEqunr: "10005027",
    maximoAssetnum: "LOCO-FLX-5027",
    umlerMark: "JTWX 5027",
    oemSerial: "WT-FLX-10027",
    uicEvn: "92 80 1288 027-9",
  },
  {
    assetId: "loco-003",
    model: "AC4400CW Legacy",
    sapEqunr: "10002215",
    maximoAssetnum: "LOCO-AC44-2215",
    umlerMark: "JTWX 2215",
    oemSerial: "GE-AC44-77215",
    uicEvn: "92 80 1244 215-6",
  },
];

// 24h ingest volume trend for the pipeline throughput sparkline (records/hr, ×1000).
export const INGEST_TREND = [
  388, 356, 342, 331, 349, 402, 511, 642, 720, 758, 741, 769, 780, 772, 758, 766, 781, 802, 774,
  690, 601, 528, 466, 410,
].map((v, i) => ({ hour: i, kRecords: v }));
