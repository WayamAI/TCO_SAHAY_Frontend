import React from "react";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardHeaderProps {
  title?: string;
  breadcrumb?: string;
  className?: string;
}

export function DashboardHeader({
  title = "Dashboard",
  breadcrumb = "Dashboard",
  className,
}: DashboardHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-1 select-none", className)}>
      {/* Top Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-white/45">
        <span className="flex items-center text-white/40 hover:text-white/70 transition-colors">
          <Home size={13} className="mr-0.5" />
        </span>
        <span className="text-white/25">/</span>
        <span className="text-white/60 font-medium tracking-tight">{breadcrumb}</span>
      </nav>

      {/* Main Page Title */}
      <h1 className="text-2xl lg:text-[26px] font-semibold tracking-tight text-white/95 mt-0.5">
        {title}
      </h1>
    </header>
  );
}
