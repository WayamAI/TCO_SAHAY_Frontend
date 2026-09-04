import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons, type IconName } from "@/components/icons/registry";
import { cn } from "@/lib/utils";

/**
 * The only way icons enter the UI.
 *
 * Sizing comes from the --icon-size-* scale in styles.css and is applied
 * inline, so no Font Awesome stylesheet needs to be shipped.
 *
 * Colour is never baked in — pass an icon token class, e.g.
 *   <AppIcon name="maintenance" size="lg" className="text-icon-secondary" />
 */
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

const SIZE_VAR: Record<IconSize, string> = {
  xs: "var(--icon-size-xs)", // 12 — breadcrumbs, inline status dots
  sm: "var(--icon-size-sm)", // 14 — table actions, small buttons
  md: "var(--icon-size-md)", // 16 — default button icon, search
  lg: "var(--icon-size-lg)", // 18 — sidebar navigation
  xl: "var(--icon-size-xl)", // 20 — section headers
  "2xl": "var(--icon-size-2xl)", // 24 — empty states
  "3xl": "var(--icon-size-3xl)", // 28 — large empty states
};

export interface AppIconProps {
  name: IconName;
  size?: IconSize;
  className?: string;
  /** Provide for meaningful icons; omit for decorative ones. */
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
  title?: string;
}

export function AppIcon({
  name,
  size = "md",
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
  title,
}: AppIconProps) {
  // Decorative unless the caller gives it a label.
  const hidden = (ariaHidden ?? !ariaLabel) !== false && ariaHidden !== "false";
  const dimension = SIZE_VAR[size];

  return (
    <FontAwesomeIcon
      icon={icons[name]}
      className={cn("shrink-0 align-middle", className)}
      style={{ width: dimension, height: dimension }}
      aria-hidden={hidden || undefined}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
      title={title}
    />
  );
}
