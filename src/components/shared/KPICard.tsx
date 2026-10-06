import CountUp from "@/components/shared/CountUp";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface KPICardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  sub?: ReactNode;
  /**
   * Accent for the card's top rule. The prop name and values are unchanged so
   * the 8 existing call sites keep working; the treatment is now a 1px accent
   * instead of the old coloured glow.
   */
  glow?: "blue" | "teal" | "purple" | "yellow" | "orange" | "red";
  className?: string;
  delay?: number;
}

const accentClass: Record<string, string> = {
  blue: "before:bg-info-icon",
  teal: "before:bg-success-icon",
  purple: "before:bg-purple",
  yellow: "before:bg-warning-icon",
  orange: "before:bg-warning-icon",
  red: "before:bg-error-icon",
};

export function KPICard({
  label,
  value,
  prefix,
  suffix,
  decimals = 0,
  sub,
  glow = "blue",
  className,
  delay = 0,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "glass-card animate-fade-up relative overflow-hidden p-4",
        "before:absolute before:inset-x-0 before:top-0 before:h-px before:content-['']",
        accentClass[glow],
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-label-sm text-fg-tertiary uppercase">{label}</p>
      <p className="font-display text-display-metric text-fg-primary mt-2 tabular-nums">
        <CountUp
          end={value}
          duration={1.6}
          separator=","
          decimals={decimals}
          prefix={prefix}
          suffix={suffix}
          preserveValue
        />
      </p>
      {sub ? <div className="text-body-sm text-fg-tertiary mt-1.5">{sub}</div> : null}
    </div>
  );
}
