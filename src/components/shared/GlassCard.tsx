import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function GlassCard({
  children,
  className,
  scanline = false,
}: {
  children: ReactNode;
  className?: string;
  scanline?: boolean;
}) {
  return (
    <div className={cn("glass-card p-5", scanline && "scanline-overlay", className)}>{children}</div>
  );
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("font-display text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary", className)}>
      {children}
    </h3>
  );
}
