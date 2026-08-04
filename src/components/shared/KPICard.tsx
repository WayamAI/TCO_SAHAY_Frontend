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
  glow?: "blue" | "teal" | "purple" | "yellow" | "orange" | "red";
  className?: string;
  delay?: number;
}

const glowClass: Record<string, string> = {
  blue: "shadow-[0_0_24px_oklch(0.69_0.18_49/15%)] border-primary/25",
  teal: "shadow-[0_0_24px_oklch(0.78_0.14_175/15%)] border-teal/25",
  purple: "shadow-[0_0_24px_oklch(0.54_0.22_293/18%)] border-purple/30",
  yellow: "shadow-[0_0_24px_oklch(0.77_0.16_70/15%)] border-yellow/25",
  orange: "shadow-[0_0_24px_oklch(0.7_0.18_40/15%)] border-orange/25",
  red: "shadow-[0_0_24px_oklch(0.63_0.21_25/15%)] border-red/25",
};

export function KPICard({ label, value, prefix, suffix, decimals = 0, sub, glow = "blue", className, delay = 0 }: KPICardProps) {
  return (
    <div
      className={cn("glass-card animate-fade-up p-5", glowClass[glow], className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-text-secondary">{label}</p>
      <p className="font-display mt-2 text-2xl font-bold tabular-nums">
        <CountUp end={value} duration={1.6} separator="," decimals={decimals} prefix={prefix} suffix={suffix} preserveValue />
      </p>
      {sub ? <div className="mt-1.5 text-xs text-text-secondary">{sub}</div> : null}
    </div>
  );
}
