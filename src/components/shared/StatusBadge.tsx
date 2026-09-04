import type { ReactNode } from "react";
import { AppIcon } from "@/components/icons/AppIcon";
import type { IconName } from "@/components/icons/registry";
import { cn } from "@/lib/utils";

/**
 * Status pill. Every colour comes from the feedback.* semantic tokens — a
 * status must never reach for a raw colour utility.
 */
export type StatusTone = "success" | "info" | "neutral" | "warning" | "error";

const TONE: Record<StatusTone, string> = {
  success: "bg-success-bg text-success border-success-stroke",
  info: "bg-info-bg text-info border-info-stroke",
  neutral: "bg-neutral-bg text-neutral border-neutral-stroke",
  warning: "bg-warning-bg text-warning border-warning-stroke",
  error: "bg-error-bg text-error border-error-stroke",
};

const TONE_ICON: Record<StatusTone, string> = {
  success: "text-success-icon",
  info: "text-info-icon",
  neutral: "text-neutral-icon",
  warning: "text-warning-icon",
  error: "text-error-icon",
};

const DEFAULT_ICON: Record<StatusTone, IconName> = {
  success: "success",
  info: "info",
  neutral: "circle",
  warning: "warning",
  error: "error",
};

export function StatusBadge({
  tone = "neutral",
  icon,
  showIcon = true,
  children,
  className,
}: {
  tone?: StatusTone;
  icon?: IconName;
  showIcon?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-label-sm inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5",
        TONE[tone],
        className,
      )}
    >
      {showIcon ? (
        <AppIcon name={icon ?? DEFAULT_ICON[tone]} size="xs" className={TONE_ICON[tone]} />
      ) : null}
      {children}
    </span>
  );
}
