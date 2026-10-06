import type { QueueItem } from "./action-table";
import type { IncidentData } from "./incident-panel";

export const INITIAL_QUEUE_DATA: QueueItem[] = [
  {
    id: "SIM-0001",
    priority: "critical",
    asset: "SIM-0001",
    description:
      "Critical telemetry from SIM-0001 — Engine temperature exceeded 104°C on M7 Highway KM 45",
    time: "2m ago",
    driver: "Mike Ross",
  },
  {
    id: "SIM-0014",
    priority: "critical",
    asset: "SIM-0014",
    description: "Main brake pipe differential pressure drop — 3.2 bar threshold crossed",
    time: "14m ago",
    driver: "Rachel Zane",
  },
  {
    id: "SIM-0082",
    priority: "warning",
    asset: "SIM-0082",
    description: "Coolant reserve tank level degraded below 15% safety limit",
    time: "32m ago",
    driver: "Harvey Specter",
  },
  {
    id: "SIM-0105",
    priority: "warning",
    asset: "SIM-0105",
    description: "Traction motor inverter #2 thermal delta rising abnormally (+18°C/hr)",
    time: "1h ago",
    driver: "Donna Paulsen",
  },
  {
    id: "SIM-0219",
    priority: "warning",
    asset: "SIM-0219",
    description: "High particulate matter in fuel recirculation circuit — scheduled check pending",
    time: "2h ago",
    driver: "Louis Litt",
  },
  {
    id: "SIM-0341",
    priority: "info",
    asset: "SIM-0341",
    description:
      "Over-The-Air ECU firmware package 4.2.1 downloaded; telemetry verification pending",
    time: "3h ago",
    driver: "Jessica Pearson",
  },
  {
    id: "SIM-0402",
    priority: "info",
    asset: "SIM-0402",
    description: "Routine diagnostic telemetry handshake completed successfully",
    time: "4h ago",
    driver: "Robert Zane",
  },
];

export const DEFAULT_INCIDENT: IncidentData = {
  id: "SIM-0001",
  title: "SIM-0001: Incident",
  priority: "critical",
  location: "Incident detected: M7 Highway, KM 45",
  assetModel: "Wabtec ES44AC Heavy Haul",
  vin: "WAB-SIM-0001-X",
  driver: {
    name: "Mike Ross",
    initials: "MR",
    conciergeStatus: "AI Concierge is active",
    phone: "+1 (555) 019-2834",
  },
  primaryIssue: "Critical telemetry from SIM-0001",
  primaryIssueDetail:
    "Primary engine cooling jacket breached thermal limit (104°C > 90°C allowable). Immediate shutdown protocol advised.",
  telemetry: {
    temperature: { value: "104°C", status: "critical", subtext: "+14°C above max" },
    voltage: { value: "23.4 V", status: "warning", subtext: "-0.6V nominal" },
    coolantLevel: { value: "12%", status: "critical", subtext: "Below 15% cutoff" },
    speed: { value: "68 km/h", status: "normal", subtext: "Decelerating" },
  },
};
