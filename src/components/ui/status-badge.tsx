import React from "react";
import { cn } from "@/lib/utils";

export type StatusType =
  | "critical"
  | "warning"
  | "info"
  | "success"
  | "healthy"
  | "open"
  | "in-progress";

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
  pulse?: boolean;
}

const STATUS_CONFIG: Record<
  StatusType,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  critical: {
    label: "Critical",
    bg: "bg-red-950/40",
    border: "border-red-500/30",
    text: "text-red-300",
    dot: "bg-red-400",
  },
  warning: {
    label: "Warning",
    bg: "bg-orange-950/40",
    border: "border-orange-500/30",
    text: "text-orange-300",
    dot: "bg-orange-400",
  },
  info: {
    label: "Info",
    bg: "bg-sky-950/40",
    border: "border-sky-500/30",
    text: "text-sky-300",
    dot: "bg-sky-400",
  },
  success: {
    label: "Healthy",
    bg: "bg-emerald-950/40",
    border: "border-emerald-500/30",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  healthy: {
    label: "Healthy",
    bg: "bg-emerald-950/40",
    border: "border-emerald-500/30",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  open: {
    label: "Open",
    bg: "bg-white/[0.05]",
    border: "border-white/10",
    text: "text-white/80",
    dot: "bg-white/60",
  },
  "in-progress": {
    label: "In Progress",
    bg: "bg-amber-950/40",
    border: "border-amber-500/30",
    text: "text-amber-300",
    dot: "bg-amber-400",
  },
};

export function StatusBadge({ status, label, className, pulse }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.info;
  const displayLabel = label || cfg.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium tracking-tight border select-none whitespace-nowrap",
        cfg.bg,
        cfg.border,
        cfg.text,
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {(pulse || status === "critical") && (
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              cfg.dot,
            )}
          />
        )}
        <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", cfg.dot)} />
      </span>
      <span>{displayLabel}</span>
    </span>
  );
}
