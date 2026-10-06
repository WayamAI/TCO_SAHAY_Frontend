import React from "react";
import { Plus, Minus, Layers, Maximize2, Compass, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthScoreCard } from "./health-score-card";

export interface MapStageProps {
  children?: React.ReactNode;
  onSelectIncidentAsset?: (assetId: string) => void;
  className?: string;
}

export function MapStage({ children, onSelectIncidentAsset, className }: MapStageProps) {
  return (
    <div
      className={cn(
        "relative w-full min-h-[360px] lg:h-[400px] rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0a0c0d] flex flex-col justify-between shadow-inner select-none",
        className,
      )}
    >
      {/* Visual Telemetry Map Placeholder Canvas */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-90">
        {/* Subtle coordinate grid lines */}
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="telemetry-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="rgba(255, 255, 255, 0.035)"
                strokeWidth="1"
              />
            </pattern>
            {/* Subtle glow filter */}
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#telemetry-grid)" />

          {/* Simulated highway/corridor veins (M7 Highway) */}
          <path
            d="M 50 380 Q 280 260 480 230 T 780 180 T 1100 120 T 1400 90"
            fill="none"
            stroke="rgba(255, 255, 255, 0.09)"
            strokeWidth="3"
            strokeDasharray="4 4"
          />
          <path
            d="M 200 420 Q 380 320 620 280 T 950 210 T 1300 160"
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="2"
          />
          <path
            d="M 680 0 Q 710 150 780 240 T 840 400"
            fill="none"
            stroke="rgba(255, 255, 255, 0.04)"
            strokeWidth="1.5"
          />

          {/* Highway label */}
          <text
            x="520"
            y="218"
            fill="rgba(255, 255, 255, 0.28)"
            fontSize="10"
            fontFamily="monospace"
            letterSpacing="0.08em"
          >
            M7 HIGHWAY • KM 45
          </text>

          {/* Muted green asset dots across network */}
          <circle cx="210" cy="330" r="3.5" fill="#22c55e" opacity="0.65" />
          <circle cx="340" cy="275" r="3.5" fill="#22c55e" opacity="0.65" />
          <circle cx="640" cy="210" r="3.5" fill="#22c55e" opacity="0.75" />
          <circle cx="890" cy="190" r="3.5" fill="#22c55e" opacity="0.65" />
          <circle cx="1020" cy="140" r="3.5" fill="#22c55e" opacity="0.75" />

          {/* Warning orange asset dot */}
          <circle cx="410" cy="290" r="4" fill="#f97316" opacity="0.85" />

          {/* Pulsing Critical Incident Node: SIM-0001 at M7 Highway KM 45 */}
          <circle
            cx="505"
            cy="226"
            r="16"
            fill="rgba(239, 68, 68, 0.15)"
            stroke="rgba(239, 68, 68, 0.4)"
            strokeWidth="1"
          >
            <animate attributeName="r" values="8;20;8" dur="2.4s" repeatCount="indefinite" />
            <animate
              attributeName="opacity"
              values="0.7;0.1;0.7"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="505" cy="226" r="5" fill="#ef4444" filter="url(#glow-red)" />
        </svg>

        {/* Dark radial fade at bottom and corners for cinematic telemetry depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c0d] via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c0d]/60 via-transparent to-[#0a0c0d]/60 pointer-events-none" />
      </div>

      {/* Floating Card Slot (Health Score Card sits upper-left) */}
      <div className="relative z-10 p-4 lg:p-5 flex flex-col sm:flex-row justify-between items-start gap-4">
        {children ? children : <HealthScoreCard />}

        {/* Incident quick badge over map */}
        <div
          onClick={() => onSelectIncidentAsset?.("SIM-0001")}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161819]/90 backdrop-blur-md border border-red-500/30 text-xs text-white/90 shadow-lg cursor-pointer hover:border-red-500/50 hover:bg-[#1e2022] transition-all duration-150"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="font-mono text-red-300 font-semibold">SIM-0001: Critical</span>
          <span className="text-white/40">|</span>
          <span className="text-white/70">M7 Highway KM 45</span>
        </div>
      </div>

      {/* Bottom map overlay metadata and map controls */}
      <div className="relative z-10 p-3 lg:p-4 flex items-center justify-between text-xs text-white/45 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#121415]/85 backdrop-blur-sm border border-white/[0.07] px-2.5 py-1 rounded-md text-[11px] font-mono text-white/60">
            <Compass size={12} className="text-white/40" />
            <span>45.742° N, 11.890° E</span>
          </div>
          <span className="text-[11px] font-mono text-white/40 hidden sm:inline">
            300 ASSETS MONITORED
          </span>
        </div>

        {/* Mapbox placeholder controls */}
        <div className="flex items-center gap-1 bg-[#121415]/90 backdrop-blur-sm border border-white/[0.08] p-0.5 rounded-lg shadow-sm">
          <button
            type="button"
            title="Layer View"
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Layers size={13} />
          </button>
          <div className="w-px h-3.5 bg-white/10" />
          <button
            type="button"
            title="Zoom In"
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Plus size={13} />
          </button>
          <button
            type="button"
            title="Zoom Out"
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Minus size={13} />
          </button>
          <div className="w-px h-3.5 bg-white/10" />
          <button
            type="button"
            title="Full Screen Map"
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
