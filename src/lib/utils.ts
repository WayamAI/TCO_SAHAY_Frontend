import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Apply transparency to a design-token colour.
 *
 * Palette values are `var(--ref-*)` references, so the old
 * `` `${color}22` `` hex-alpha concatenation no longer works. `color-mix` does,
 * and it works with any colour syntax.
 *
 * @param color any CSS colour, including `var(--ref-blue-400)`
 * @param percent opacity 0-100
 */
export function alpha(color: string, percent: number) {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
