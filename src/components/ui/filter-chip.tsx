import React from "react";
import { cn } from "@/lib/utils";

export interface FilterChipProps {
  label: string;
  count?: number | string;
  active?: boolean;
  onClick?: () => void;
  variant?: "default" | "critical" | "warning" | "info";
  className?: string;
  id?: string;
}

export function FilterChip({
  label,
  count,
  active = false,
  onClick,
  variant = "default",
  className,
  id,
}: FilterChipProps) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-medium tracking-tight border transition-all duration-150 select-none",
        active
          ? "bg-[#25282a] text-white border-white/20 shadow-sm"
          : "bg-[#141617] text-white/60 border-white/[0.07] hover:bg-[#1c1e20] hover:text-white/85 hover:border-white/[0.12]",
        variant === "critical" && active && "border-red-500/40 text-red-300 bg-red-950/30",
        variant === "warning" && active && "border-orange-500/40 text-orange-300 bg-orange-950/30",
        variant === "info" && active && "border-sky-500/40 text-sky-300 bg-sky-950/30",
        className
      )}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "tabular-nums text-[11px] px-1.5 py-0.2 rounded-full font-mono transition-colors",
            active
              ? "bg-white/15 text-white"
              : "bg-white/[0.06] text-white/45 group-hover:bg-white/10 group-hover:text-white/70"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
