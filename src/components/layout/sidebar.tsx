import React, { useState } from "react";
import {
  LayoutDashboard,
  Car,
  TriangleAlert,
  CalendarDays,
  Wrench,
  FileText,
  SlidersHorizontal,
  Settings,
} from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { SidebarItem } from "./sidebar-item";
import { cn } from "@/lib/utils";

export interface NavItemDef {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string | number;
}

const MAIN_NAV_ITEMS: NavItemDef[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "vehicles", label: "Vehicles", icon: Car },
  { id: "alerts", label: "Alerts", icon: TriangleAlert },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "documents", label: "Documents", icon: FileText },
];

export interface SidebarProps {
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

/**
 * Left sidebar for the telemetry command center.
 * 68px width, full height, charcoal/near-black background (#0c0e0f),
 * subtle 1px border-r, vertically centered rounded icon buttons.
 */
export function Sidebar({ activeId: controlledActiveId, onSelect, className }: SidebarProps) {
  const [internalActiveId, setInternalActiveId] = useState("dashboard");
  const activeId = controlledActiveId ?? internalActiveId;

  const handleSelect = (id: string) => {
    if (onSelect) {
      onSelect(id);
    } else {
      setInternalActiveId(id);
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col items-center w-[68px] h-screen min-h-screen shrink-0 bg-[#0c0e0f] border-r border-white/[0.07] py-4 select-none z-30 transition-all",
        className,
      )}
      aria-label="Application Sidebar"
    >
      {/* TOP: Brand / Logo mark */}
      <div className="flex items-center justify-center mb-6">
        <BrandLogo size={34} />
      </div>

      {/* Main Navigation Items */}
      <nav className="flex flex-col items-center gap-3 w-full" aria-label="Main Navigation">
        {MAIN_NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeId === item.id}
            badge={item.badge}
            onClick={() => handleSelect(item.id)}
          />
        ))}
      </nav>

      {/* Spacer pushing bottom controls down */}
      <div className="flex-1 min-h-6" />

      {/* BOTTOM: Utility & Settings */}
      <div className="flex flex-col items-center gap-3 w-full">
        <SidebarItem
          icon={SlidersHorizontal}
          label="Telemetry & Display Settings"
          active={activeId === "utilities"}
          onClick={() => handleSelect("utilities")}
        />
        <SidebarItem
          icon={Settings}
          label="System Settings"
          active={activeId === "settings"}
          onClick={() => handleSelect("settings")}
        />
      </div>
    </aside>
  );
}
