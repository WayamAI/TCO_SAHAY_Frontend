import React, { useState } from "react";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { FilterChip } from "@/components/ui/filter-chip";
import { cn } from "@/lib/utils";

export type FilterCategory =
  | "all"
  | "critical"
  | "warning"
  | "info"
  | "open"
  | "in-progress"
  | "today";

export interface ActionQueueHeaderProps {
  totalCount?: number;
  activeFilter?: FilterCategory;
  onFilterChange?: (filter: FilterCategory) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  className?: string;
}

export function ActionQueueHeader({
  totalCount = 54,
  activeFilter = "all",
  onFilterChange,
  searchQuery = "",
  onSearchChange,
  className,
}: ActionQueueHeaderProps) {
  const [showSearch, setShowSearch] = useState(false);

  const filters: { id: FilterCategory; label: string; count: number; variant?: "critical" | "warning" | "info" }[] = [
    { id: "all", label: "All", count: 54 },
    { id: "critical", label: "Critical", count: 1, variant: "critical" },
    { id: "warning", label: "Warning", count: 25, variant: "warning" },
    { id: "info", label: "Info", count: 23, variant: "info" },
    { id: "open", label: "Open", count: 48 },
    { id: "in-progress", label: "In Progress", count: 1 },
    { id: "today", label: "Today", count: 49 },
  ];

  return (
    <div className={cn("flex flex-col gap-3 select-none", className)}>
      {/* Title & Action controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base lg:text-lg font-semibold tracking-tight text-white/95">
            Action Needed Queue
          </h2>
          <span className="font-mono text-xs text-white/45 bg-[#17191a] border border-white/[0.08] px-2 py-0.5 rounded-full">
            {totalCount}
          </span>
        </div>

        {/* Right tools (search & filters) */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            {showSearch ? (
              <div className="flex items-center bg-[#131516] border border-white/15 rounded-full px-2.5 py-1 text-xs transition-all">
                <Search size={13} className="text-white/40 mr-1.5" />
                <input
                  type="text"
                  placeholder="Search assets, drivers..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="bg-transparent border-none outline-none text-white text-xs w-36 sm:w-48 placeholder:text-white/30"
                  autoFocus
                  onBlur={() => !searchQuery && setShowSearch(false)}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                title="Search queue"
                className="w-7 h-7 rounded-full bg-[#141617] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-[#1d2022] transition-colors"
              >
                <Search size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            title="Sort options"
            className="w-7 h-7 rounded-full bg-[#141617] border border-white/[0.08] flex items-center justify-center text-white/60 hover:text-white hover:bg-[#1d2022] transition-colors"
          >
            <ArrowUpDown size={13} />
          </button>
        </div>
      </div>

      {/* Horizontal Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {filters.map((f) => (
          <FilterChip
            key={f.id}
            label={f.label}
            count={f.count}
            variant={f.variant}
            active={activeFilter === f.id}
            onClick={() => onFilterChange?.(f.id)}
          />
        ))}
      </div>
    </div>
  );
}
