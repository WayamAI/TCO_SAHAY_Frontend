import React from "react";
import {
  AlertTriangle,
  MapPin,
  Bot,
  Thermometer,
  Zap,
  Droplet,
  Gauge,
  Phone,
  FileText,
  User,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricCard } from "@/components/ui/metric-card";
import { cn } from "@/lib/utils";

export interface DriverInfo {
  name: string;
  avatar?: string;
  initials?: string;
  conciergeStatus?: string;
  phone?: string;
}

export interface IncidentData {
  id: string;
  title: string;
  priority: "critical" | "warning" | "info";
  location: string;
  assetModel: string;
  vin: string;
  driver: DriverInfo;
  primaryIssue: string;
  primaryIssueDetail: string;
  telemetry: {
    temperature: { value: string; status: "normal" | "warning" | "critical"; subtext: string };
    voltage: { value: string; status: "normal" | "warning" | "critical"; subtext: string };
    coolantLevel: { value: string; status: "normal" | "warning" | "critical"; subtext: string };
    speed: { value: string; status: "normal" | "warning" | "critical"; subtext: string };
  };
}

import { DEFAULT_INCIDENT } from "./mock-data";

export interface DriverCardProps {
  driver: DriverInfo;
  className?: string;
}

export function DriverCard({ driver, className }: DriverCardProps) {
  return (
    <div
      className={cn(
        "p-3 rounded-xl bg-[#141617] border border-white/[0.08] flex items-center justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#202325] to-[#2d3033] border border-white/10 flex items-center justify-center text-xs font-medium text-white/90">
          {driver.initials || "MR"}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-white/95 leading-tight">{driver.name}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] text-white/50">{driver.conciergeStatus}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          title="Direct Driver Comm"
          className="w-7 h-7 rounded-lg bg-[#1a1d1e] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-[#25282a] transition-colors"
        >
          <Phone size={12} />
        </button>
      </div>
    </div>
  );
}

export interface IncidentPanelProps {
  incident?: IncidentData;
  onConfirmEvacuation?: () => void;
  onViewProfile?: () => void;
  onInsuranceClaim?: () => void;
  className?: string;
}

export function IncidentPanel({
  incident = DEFAULT_INCIDENT,
  onConfirmEvacuation,
  onViewProfile,
  onInsuranceClaim,
  className,
}: IncidentPanelProps) {
  return (
    <aside
      className={cn(
        "w-full lg:w-[320px] xl:w-[340px] flex-shrink-0 bg-[#0c0e0f] border-l border-white/[0.07] p-4 flex flex-col justify-between overflow-y-auto no-scrollbar select-none gap-4",
        className,
      )}
    >
      <div className="flex flex-col gap-4">
        {/* Incident Title & Status Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white/95 tracking-tight font-mono">
              {incident.title}
            </h3>
          </div>
          <StatusBadge status={incident.priority} label="Critical" pulse />
        </div>

        {/* Location Alert Bar */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/25 border border-red-500/25 text-xs text-red-200">
          <MapPin size={14} className="text-red-400 flex-shrink-0" />
          <span className="font-medium truncate">{incident.location}</span>
        </div>

        {/* Vehicle Preview Area */}
        <div className="relative h-32 rounded-xl bg-[#121415] border border-white/[0.08] overflow-hidden flex flex-col justify-between p-3 group">
          {/* Subtle stylized technical wireframe background */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="diag-mesh" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path
                    d="M 0 16 L 16 0 M 0 0 L 16 16"
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#diag-mesh)" />
              {/* Technical locomotive schematic outline */}
              <path
                d="M 30 75 L 70 45 L 200 45 L 240 60 L 270 75 L 270 95 L 30 95 Z"
                fill="none"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="1.5"
              />
              <circle
                cx="70"
                cy="95"
                r="8"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
              />
              <circle
                cx="110"
                cy="95"
                r="8"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
              />
              <circle
                cx="190"
                cy="95"
                r="8"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
              />
              <circle
                cx="230"
                cy="95"
                r="8"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
              />
              {/* Thermal hotspot indicator */}
              <circle
                cx="150"
                cy="65"
                r="14"
                fill="rgba(239, 68, 68, 0.2)"
                stroke="#ef4444"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle cx="150" cy="65" r="3" fill="#ef4444" />
            </svg>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-white/45">
            <span>VEHICLE PREVIEW</span>
            <span className="text-red-400 font-semibold tracking-wider">HOTSPOT DETECTED</span>
          </div>

          <div className="relative z-10 flex flex-col">
            <span className="text-xs font-semibold text-white/90">{incident.assetModel}</span>
            <span className="text-[10px] font-mono text-white/40">{incident.vin}</span>
          </div>
        </div>

        {/* Driver Section */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
            Driver
          </span>
          <DriverCard driver={incident.driver} />
        </div>

        {/* Telemetry Data Section */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
              Telemetry Data
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Live 100Hz Sync</span>
          </div>

          {/* Primary Issue Card */}
          <div className="p-2.5 rounded-lg bg-[#141617] border border-red-500/25 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-red-300">
              <ShieldAlert size={13} className="text-red-400 flex-shrink-0" />
              <span className="truncate">Primary Issue:</span>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed pl-5">
              {incident.primaryIssue}
            </p>
          </div>

          {/* 2x2 Telemetry Metric Grid */}
          <div className="grid grid-cols-2 gap-2">
            <MetricCard
              label="Temperature"
              value={incident.telemetry.temperature.value}
              status={incident.telemetry.temperature.status}
              subtext={incident.telemetry.temperature.subtext}
              icon={<Thermometer size={13} />}
            />
            <MetricCard
              label="Voltage"
              value={incident.telemetry.voltage.value}
              status={incident.telemetry.voltage.status}
              subtext={incident.telemetry.voltage.subtext}
              icon={<Zap size={13} />}
            />
            <MetricCard
              label="Coolant Level"
              value={incident.telemetry.coolantLevel.value}
              status={incident.telemetry.coolantLevel.status}
              subtext={incident.telemetry.coolantLevel.subtext}
              icon={<Droplet size={13} />}
            />
            <MetricCard
              label="Speed"
              value={incident.telemetry.speed.value}
              status={incident.telemetry.speed.status}
              subtext={incident.telemetry.speed.subtext}
              icon={<Gauge size={13} />}
            />
          </div>
        </div>
      </div>

      {/* Bottom Actions Area */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
        {/* Large Primary White CTA */}
        <button
          type="button"
          onClick={onConfirmEvacuation}
          className="w-full h-11 rounded-xl bg-white hover:bg-white/90 text-black font-semibold text-xs tracking-tight transition-all duration-150 flex items-center justify-center gap-1.5 shadow-md shadow-white/5 active:scale-[0.99] select-none"
        >
          <ShieldAlert size={14} className="text-black" />
          <span>Confirm Evacuation</span>
        </button>

        {/* Secondary Buttons Row */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onViewProfile}
            className="h-8 rounded-lg bg-[#141617] hover:bg-[#1c1e20] border border-white/[0.08] text-white/75 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1"
          >
            <User size={12} className="text-white/45" />
            <span>View Profile</span>
          </button>
          <button
            type="button"
            onClick={onInsuranceClaim}
            className="h-8 rounded-lg bg-[#141617] hover:bg-[#1c1e20] border border-white/[0.08] text-white/75 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1"
          >
            <FileText size={12} className="text-white/45" />
            <span>Insurance Claim</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
