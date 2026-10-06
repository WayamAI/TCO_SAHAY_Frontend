import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * The standard raised surface card.
 *
 * Named `GlassCard` for historical reasons (19 call sites); it is no longer
 * glassmorphic — see the `glass-card` utility in styles.css. It is an opaque
 * surface.raised panel with a hairline border and a 14px radius.
 */
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
    <div className={cn("glass-card p-4", scanline && "scanline-overlay", className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("font-display text-caption text-fg-tertiary uppercase", className)}>
      {children}
    </h3>
  );
}
