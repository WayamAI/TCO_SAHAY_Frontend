import React from "react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: "normal" | "warning" | "critical";
  subtext?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  status = "normal",
  subtext,
  icon,
  className,
}: MetricCardProps) {
  const statusStyles = {
    normal: {
      border: "border-white/[0.07]",
      bg: "bg-[#141617]",
      indicator: "text-white/40",
      accent: "text-white/90",
    },
    warning: {
      border: "border-orange-500/25",
      bg: "bg-orange-950/15",
      indicator: "text-orange-400",
      accent: "text-orange-300",
    },
    critical: {
      border: "border-red-500/30",
      bg: "bg-red-950/20",
      indicator: "text-red-400",
      accent: "text-red-300",
    },
  }[status];

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all duration-150 flex flex-col justify-between",
        statusStyles.bg,
        statusStyles.border,
        className,
      )}
    >
      <div className="flex items-center justify-between text-xs text-white/50 mb-1.5">
        <span className="font-medium uppercase tracking-wider text-[10px] text-white/45">
          {label}
        </span>
        {icon && <span className={cn("text-xs", statusStyles.indicator)}>{icon}</span>}
      </div>

      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "text-lg font-semibold tracking-tight font-mono tabular-nums",
            status === "critical"
              ? "text-red-300"
              : status === "warning"
                ? "text-orange-300"
                : "text-white/95",
          )}
        >
          {value}
        </span>
        {unit && <span className="text-xs text-white/45 font-mono">{unit}</span>}
      </div>

      {subtext && (
        <span
          className={cn(
            "text-[10px] mt-1 tracking-tight truncate",
            status === "critical"
              ? "text-red-400/80"
              : status === "warning"
                ? "text-orange-400/80"
                : "text-white/40",
          )}
        >
          {subtext}
        </span>
      )}
    </div>
  );
}
