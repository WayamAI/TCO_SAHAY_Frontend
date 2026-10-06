import React from "react";
import { Info, ChevronDown, ChevronRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HealthScoreCardProps {
  score?: number;
  healthyCount?: number;
  warningCount?: number;
  criticalCount?: number;
  trend?: string;
  onSeeAllAssets?: () => void;
  className?: string;
}

export function HealthScoreCard({
  score = 99,
  healthyCount = 296,
  warningCount = 3,
  criticalCount = 1,
  trend = "+0.4%",
  onSeeAllAssets,
  className,
}: HealthScoreCardProps) {
  const total = healthyCount + warningCount + criticalCount;
  const healthyPct = (healthyCount / total) * 100;
  const warningPct = (warningCount / total) * 100;
  const criticalPct = (criticalCount / total) * 100;

  return (
    <div
      className={cn(
        "w-full sm:w-[320px] lg:w-[340px] rounded-2xl bg-[#111314]/90 backdrop-blur-md border border-white/[0.08] p-4 flex flex-col gap-3 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.65)] select-none",
        className,
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-white/75">
          <span>Health Score</span>
          <button
            type="button"
            title="Aggregated telemetry health score across all registered active assets"
            className="text-white/35 hover:text-white/60 transition-colors"
          >
            <Info size={13} />
          </button>
        </div>

        {/* Date Filter Dropdown */}
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#181a1b] border border-white/[0.08] text-[11px] font-medium text-white/70 hover:text-white hover:bg-[#202325] transition-colors"
        >
          <span>Today</span>
          <ChevronDown size={12} className="text-white/40" />
        </button>
      </div>

      {/* Primary Score & Trend */}
      <div className="flex items-baseline gap-2.5 my-0.5">
        <span className="text-4xl lg:text-[44px] font-semibold tracking-tight text-white/95 font-mono tabular-nums leading-none">
          {score}%
        </span>
        <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/25 px-1.5 py-0.5 rounded">
          <TrendingUp size={12} />
          <span className="tabular-nums">{trend}</span>
        </div>
      </div>

      {/* Segmented Horizontal Health Bar */}
      <div className="w-full flex h-2 rounded-full overflow-hidden bg-black/40 p-0.5 gap-0.5 border border-white/[0.05]">
        <div
          className="h-full rounded-l-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${healthyPct}%` }}
          title={`Healthy: ${healthyCount}`}
        />
        <div
          className="h-full bg-orange-400 transition-all duration-300"
          style={{ width: `${Math.max(warningPct, 2)}%` }}
          title={`Warning: ${warningCount}`}
        />
        <div
          className="h-full rounded-r-full bg-red-500 transition-all duration-300"
          style={{ width: `${Math.max(criticalPct, 2)}%` }}
          title={`Critical: ${criticalCount}`}
        />
      </div>

      {/* Legend Row */}
      <div className="flex items-center justify-between text-[11px] font-medium text-white/60 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Healthy:</span>
          <span className="font-mono text-white/90 tabular-nums">{healthyCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          <span>Warning:</span>
          <span className="font-mono text-white/90 tabular-nums">{warningCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>Critical:</span>
          <span className="font-mono text-white/90 tabular-nums">{criticalCount}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06] w-full my-0.5" />

      {/* See All Assets Button */}
      <button
        type="button"
        onClick={onSeeAllAssets}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#161819] hover:bg-[#1e2022] text-xs font-medium text-white/75 hover:text-white border border-white/[0.06] transition-all duration-150 group"
      >
        <span>See all assets</span>
        <ChevronRight
          size={14}
          className="text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all"
        />
      </button>
    </div>
  );
}
