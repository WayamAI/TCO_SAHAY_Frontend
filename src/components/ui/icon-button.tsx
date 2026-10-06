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
    ? "bg-white text-black shadow-sm"
    : variant === "surface"
      ? "bg-[#181a1b] text-white/70 border border-white/[0.08] hover:bg-[#222527] hover:text-white"
      : variant === "primary"
        ? "bg-white text-black hover:bg-white/90"
        : "text-white/55 hover:text-white hover:bg-white/[0.07]";

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
