import React from "react";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "ghost" | "surface" | "primary";
  tooltip?: string;
}

export function IconButton({
  active = false,
  size = "md",
  variant = "ghost",
  className,
  children,
  tooltip,
  ...props
}: IconButtonProps) {
  const sizeStyles = {
    xs: "h-6 w-6 text-xs",
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-10 w-10 text-base",
  }[size];

  const variantStyles = active
    ? "bg-action-primary text-on-light shadow-sm"
    : variant === "surface"
      ? "bg-surface-secondary text-text-secondary border border-stroke-subtle hover:bg-surface-elevated hover:text-text-primary"
      : variant === "primary"
        ? "bg-action-primary text-on-light hover:bg-action-primary-hover"
        : "text-text-muted hover:text-text-primary hover:bg-surface-elevated";

  return (
    <button
      type="button"
      title={tooltip}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-all duration-150 select-none outline-none focus-visible:ring-1 focus-visible:ring-white/30 disabled:opacity-40 disabled:cursor-not-allowed",
        sizeStyles,
        variantStyles,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
