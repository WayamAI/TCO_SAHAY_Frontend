import React from "react";
import { cn } from "@/lib/utils";

export interface BrandLogoProps {
  className?: string;
  size?: number;
}

/**
 * Abstract placeholder brand mark for the telemetry command center sidebar.
 * Sized ~30–36px with a geometric automotive/telemetry glyph.
 */
export function BrandLogo({ className, size = 32 }: BrandLogoProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-surface-secondary border border-stroke-subtle p-1.5 transition-colors hover:border-stroke-default",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label="Automotive Telemetry Brand Mark"
      role="img"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer faceted telemetry shield */}
        <path
          d="M12 2.5L3.5 7.5V16.5L12 21.5L20.5 16.5V7.5L12 2.5Z"
          stroke="var(--stroke-strong)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Inner geometric core */}
        <path d="M12 6.5L6.5 10V14L12 17.5L17.5 14V10L12 6.5Z" fill="var(--text-primary)" />
        {/* Telemetry pulse node */}
        <circle cx="12" cy="12" r="1.75" fill="var(--text-on-color)" />
      </svg>
    </div>
  );
}
