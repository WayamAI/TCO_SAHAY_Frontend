import type { ButtonHTMLAttributes } from "react";
import { AppIcon, type IconSize } from "@/components/icons/AppIcon";
import type { IconName } from "@/components/icons/registry";
import { cn } from "@/lib/utils";

/**
 * Icon-only button. `aria-label` is required by the type signature — an
 * unlabelled icon button is unusable with a screen reader, so it is not
 * expressible here.
 *
 * Variants map straight onto the action-surface tokens:
 *   ghost   — transparent, action-surface.tertiary on hover
 *   subtle  — surface.action, lifts to surface.raised-2 on hover
 *   inverse — action-surface.primary (light on dark); the selected/active state
 */
type Variant = "ghost" | "subtle" | "inverse";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  ghost:
    "bg-transparent text-icon-tertiary hover:bg-action-tertiary-hover hover:text-icon-secondary active:bg-action-tertiary-focused disabled:text-icon-quaternary",
  subtle:
    "bg-action text-icon-secondary hover:bg-raised-2 hover:text-icon-primary active:bg-action-secondary-focused disabled:bg-action-secondary-disabled disabled:text-icon-quaternary",
  inverse:
    "bg-action-primary text-icon-on-color hover:bg-action-primary-hover active:bg-action-primary-focused disabled:bg-action-primary-disabled disabled:text-icon-quaternary",
};

const BOX: Record<Size, string> = {
  sm: "h-8 w-8", // 32
  md: "h-9 w-9", // 36
  lg: "h-10 w-10", // 40
};

const ICON_SIZE: Record<Size, IconSize> = { sm: "sm", md: "md", lg: "lg" };

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: IconName;
  "aria-label": string;
  variant?: Variant;
  size?: Size;
  iconSize?: IconSize;
}

export function IconButton({
  icon,
  variant = "ghost",
  size = "md",
  iconSize,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "transition-ui inline-flex items-center justify-center rounded-full outline-none",
        "focus-visible:ring-2 focus-visible:ring-stroke-active disabled:cursor-not-allowed",
        BOX[size],
        VARIANT[variant],
        className,
      )}
      {...props}
    >
      <AppIcon name={icon} size={iconSize ?? ICON_SIZE[size]} />
    </button>
  );
}
