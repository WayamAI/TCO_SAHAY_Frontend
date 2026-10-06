import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AppIcon } from "@/components/icons/AppIcon";
import type { IconName } from "@/components/icons/registry";
import { cn } from "@/lib/utils";

/**
 * Compact dark filter / segmented-control pill.
 *
 * Deliberately not a coloured "primary" pill when selected — the selected state
 * is a brighter surface, which is what keeps a dense filter row readable.
 * Use inside `<FilterChipGroup>` for a joined segmented control.
 */
export interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: IconName;
  children: ReactNode;
}

export function FilterChip({
  selected = false,
  icon,
  children,
  className,
  type = "button",
  ...props
}: FilterChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        "transition-ui inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2.5",
        "text-label-sm whitespace-nowrap tabular-nums outline-none",
        "focus-visible:ring-2 focus-visible:ring-stroke-active",
        selected
          ? "border-stroke-active bg-raised-2 text-fg-primary"
          : "border-default bg-action text-fg-tertiary hover:bg-raised-2 hover:text-fg-secondary",
        className,
      )}
      {...props}
    >
      {icon ? <AppIcon name={icon} size="xs" /> : null}
      {children}
    </button>
  );
}

/** Joins chips into one segmented control with shared borders. */
export function FilterChipGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-default inline-flex shrink-0 overflow-hidden rounded-md border",
        "[&>button]:rounded-none [&>button]:border-0 [&>button]:border-r [&>button]:border-default",
        "[&>button:last-child]:border-r-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
