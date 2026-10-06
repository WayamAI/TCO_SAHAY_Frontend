import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarItemProps {
  /** The Lucide icon component to render */
  icon: LucideIcon | React.ComponentType<{ className?: string; size?: number | string }>;
  /** Label for accessibility, tooltip, and screen readers */
  label: string;
  /** Whether this navigation item is currently selected/active */
  active?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Optional additional class names */
  className?: string;
  /** Optional badge count or indicator */
  badge?: string | number;
}

/**
 * Reusable sidebar item component.
 * 36-40px circular/strongly rounded button with distinct active, inactive,
 * and hover states strictly conforming to Prompt 2 telemetry aesthetic.
 */
export function SidebarItem({
  icon: Icon,
  label,
  active = false,
  onClick,
  className,
  badge,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      title={label}
      className={cn(
        "group relative flex items-center justify-center w-[38px] h-[38px] rounded-full transition-all duration-150 ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-white/30",
        active
          ? "bg-[#f1f1f1] text-[#151515] hover:bg-white hover:text-black cursor-default"
          : "bg-white/[0.06] text-white/50 hover:bg-white/[0.12] hover:text-white/80 active:scale-95",
        className,
      )}
    >
      <Icon
        size={18}
        className={cn(
          "transition-colors duration-150 shrink-0",
          active ? "text-[#151515]" : "text-white/50 group-hover:text-white/80",
        )}
      />

      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-xs">
          {badge}
        </span>
      )}
    </button>
  );
}
