import type { ButtonHTMLAttributes } from "react";
import { AppIcon, type IconSize, type IconTone } from "@/components/icons/AppIcon";
import type { IconName } from "@/components/icons/registry";
import { cn } from "@/lib/utils";

/**
 * Reusable IconButton component conforming to Prompt 5 iconography system.
 *
 * Variants:
 *  - ghost: transparent, hover: action-tertiary-hover, active: action-tertiary-focused
 *  - subtle: surface.action, hover: surface.raised, active: surface.raised-2
 *  - inverse: action-surface.primary (light gray) with icon.on-color (near-black)
 *
 * Sizes:
 *  - sm: 32 x 32px (14px icon)
 *  - md: 36 x 36px (16px icon)
 *  - lg: 40 x 40px (18px icon)
 */
export type IconButtonVariant = "ghost" | "subtle" | "inverse";
export type IconButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<IconButtonVariant, string> = {
  ghost:
    "bg-transparent text-icon-tertiary hover:bg-action-tertiary-hover hover:text-icon-secondary active:bg-action-tertiary-focused active:text-icon-primary disabled:bg-transparent disabled:text-icon-quaternary",
  subtle:
    "bg-action text-icon-secondary hover:bg-raised hover:text-icon-primary active:bg-raised-2 active:text-icon-primary disabled:bg-action-secondary-disabled disabled:text-icon-quaternary",
  inverse:
    "bg-action-primary text-icon-on-color hover:bg-action-primary-hover active:bg-action-primary-focused disabled:bg-action-primary-disabled disabled:text-icon-quaternary",
};

const BOX: Record<IconButtonSize, string> = {
  sm: "h-8 w-8", // 32px
  md: "h-9 w-9", // 36px
  lg: "h-10 w-10", // 40px
};

const ICON_SIZE: Record<IconButtonSize, IconSize> = {
  sm: "sm", // 14px
  md: "md", // 16px
  lg: "lg", // 18px
};

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** The semantic icon name from the registry */
  icon: IconName;
  /** Accessible label for screen readers. Can be passed via `label` or `aria-label`. */
  label?: string;
  "aria-label"?: string;
  /** Visual variant: ghost, subtle, inverse */
  variant?: IconButtonVariant;
  /** Container box size: sm (32px), md (36px), lg (40px) */
  size?: IconButtonSize;
  /** Optional explicit override for icon size */
  iconSize?: IconSize;
  /** Optional explicit override for icon tone */
  tone?: IconTone;
  /** Optional active/selected state toggle */
  active?: boolean;
}

export function IconButton({
  icon,
  label,
  "aria-label": ariaLabel,
  variant: propVariant,
  active = false,
  size = "md",
  iconSize,
  tone,
  className,
  type = "button",
  title,
  ...props
}: IconButtonProps) {
  const accessibleLabel = label ?? ariaLabel ?? title ?? "";
  const variant: IconButtonVariant = active ? "inverse" : (propVariant ?? "ghost");

  return (
    <button
      type={type}
      aria-label={accessibleLabel || undefined}
      aria-current={active ? "page" : undefined}
      title={title ?? (accessibleLabel ? accessibleLabel : undefined)}
      className={cn(
        "transition-ui inline-flex shrink-0 items-center justify-center rounded-full outline-none select-none",
        "focus-visible:ring-2 focus-visible:ring-stroke-active disabled:cursor-not-allowed",
        BOX[size],
        VARIANT[variant],
        className,
      )}
      {...props}
    >
      <AppIcon name={icon} size={iconSize ?? ICON_SIZE[size]} tone={tone} />
    </button>
  );
}
