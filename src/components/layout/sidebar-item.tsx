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
        "group relative flex items-center justify-center w-[38px] h-[38px] rounded-full transition-all duration-150 ease-out outline-none select-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
        active
          ? "bg-action-primary text-on-color hover:bg-action-primary-hover cursor-default"
          : "bg-action text-icon-tertiary hover:bg-raised hover:text-icon-secondary active:scale-95",
        className,
      )}
    >
      <Icon
        size={18}
        className={cn(
          "transition-colors duration-150 shrink-0",
          active ? "text-on-color" : "text-icon-tertiary group-hover:text-icon-secondary",
        )}
      />

      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold text-on-color shadow-xs">
          {badge}
        </span>
      )}
    </button>
  );
}
