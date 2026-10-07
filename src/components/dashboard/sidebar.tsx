import React from "react";
import {
  LayoutDashboard,
  MapPin,
  Activity,
  AlertTriangle,
  Wrench,
  Layers,
  Settings,
  Bell,
  HelpCircle,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string | number;
  onClick?: () => void;
}

export function SidebarItem({ icon, label, active = false, badge, onClick }: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150 outline-none select-none",
        active
          ? "bg-white text-black shadow-md shadow-white/5"
          : "text-white/45 hover:text-white/90 hover:bg-white/[0.06]",
      )}
    >
      <div className="w-5 h-5 flex items-center justify-center">{icon}</div>

      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4 text-[9px] font-mono font-bold rounded-full bg-red-500 text-white flex items-center justify-center">
          {badge}
        </span>
      )}

      {/* Hover tooltip for compact sidebar */}
      <div className="pointer-events-none absolute left-full ml-3 hidden group-hover:flex items-center px-2.5 py-1 rounded-md bg-[#1d1f21] text-xs text-white/90 font-medium whitespace-nowrap border border-white/10 shadow-lg z-50">
        {label}
      </div>
    </button>
  );
}

export interface SidebarProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  className?: string;
}

export function Sidebar({ currentTab = "dashboard", onTabChange, className }: SidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={19} /> },
    { id: "map", label: "Fleet Map", icon: <MapPin size={19} /> },
    { id: "telemetry", label: "Live Telemetry", icon: <Activity size={19} /> },
    { id: "incidents", label: "Incidents", icon: <AlertTriangle size={19} />, badge: 1 },
    { id: "maintenance", label: "Maintenance", icon: <Wrench size={19} /> },
    { id: "assets", label: "Assets & Inventory", icon: <Layers size={19} /> },
  ];

  const bottomItems = [
    { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
    { id: "help", label: "Help & Docs", icon: <HelpCircle size={18} /> },
    { id: "settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  return (
    <aside
      className={cn(
        "w-[68px] flex-shrink-0 h-screen sticky top-0 flex flex-col items-center justify-between py-4 bg-[#090b0c] border-r border-white/[0.07] z-30 select-none",
        className,
      )}
    >
      {/* Top brand / logo */}
      <div className="flex flex-col items-center gap-6 w-full">
        <div
          className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#222527] to-[#141617] border border-white/[0.12] flex items-center justify-center text-white shadow-inner"
          aria-label="SAHAY Brand Mark"
          role="img"
        >
          <Shield size={20} className="text-white/90" />
        </div>

        {/* Main navigation icons */}
        <nav className="flex flex-col items-center gap-2 w-full px-3">
          {navItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              active={currentTab === item.id}
              onClick={() => onTabChange?.(item.id)}
            />
          ))}
        </nav>
      </div>

      {/* Bottom utility icons */}
      <div className="flex flex-col items-center gap-2 w-full px-3 pt-4 border-t border-white/[0.06]">
        {bottomItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={currentTab === item.id}
            onClick={() => onTabChange?.(item.id)}
          />
        ))}

        {/* User profile avatar indicator */}
        <div className="mt-2 w-9 h-9 rounded-full bg-[#17191a] border border-white/10 flex items-center justify-center text-xs font-mono font-medium text-white/70 hover:border-white/25 transition-colors cursor-pointer">
          WA
        </div>
      </div>
    </aside>
  );
}
