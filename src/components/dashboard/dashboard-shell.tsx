import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { DashboardHeader } from "./dashboard-header";
import { MapStage } from "./map-stage";
import { HealthScoreCard } from "./health-score-card";
import { ActionQueueHeader, type FilterCategory } from "./action-queue";
import { ActionTable, INITIAL_QUEUE_DATA, type QueueItem } from "./action-table";
import { IncidentPanel, DEFAULT_INCIDENT, type IncidentData } from "./incident-panel";
import { Activity, AlertCircle, Menu, X, Radio, Clock, ArrowUpRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardShellProps {
  className?: string;
}

export function DashboardShell({ className }: DashboardShellProps) {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>("SIM-0001");
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Filter table items based on filter chips and search query
  const filteredItems = INITIAL_QUEUE_DATA.filter((item) => {
    // Search match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        item.asset.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.driver.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Filter pill match
    if (activeFilter === "all") return true;
    if (activeFilter === "critical") return item.priority === "critical";
    if (activeFilter === "warning") return item.priority === "warning";
    if (activeFilter === "info") return item.priority === "info";
    if (activeFilter === "open") return true;
    if (activeFilter === "in-progress") return item.priority === "warning";
    if (activeFilter === "today") return true;
    return true;
  });

  const handleSelectItem = (item: QueueItem) => {
    setSelectedIncidentId(item.id);
    setIsMobilePanelOpen(true);
  };

  return (
    <div
      className={cn(
        "flex w-full min-h-screen bg-[#090b0c] text-white overflow-x-hidden font-sans",
        className,
      )}
    >
      {/* 1. Left Navigation Sidebar (Desktop sticky, 68px) */}
      <div className="hidden md:block">
        <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />
      </div>

      {/* Mobile Sidebar Backdrop & Drawer */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 md:hidden flex"
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <div className="w-[72px] bg-[#090b0c] h-full" onClick={(e) => e.stopPropagation()}>
            <Sidebar
              currentTab={currentTab}
              onTabChange={(t) => {
                setCurrentTab(t);
                setIsMobileSidebarOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* 2. Main Middle Workspace */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#090b0c]">
        {/* Mobile Header Bar */}
        <div className="flex md:hidden items-center justify-between p-3.5 border-b border-white/[0.08] bg-[#0c0e0f] sticky top-0 z-20">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg bg-[#161819] text-white/70 hover:text-white"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
          <span className="text-xs font-semibold tracking-tight text-white/90">
            TCO Intelligence
          </span>
          <button
            type="button"
            onClick={() => setIsMobilePanelOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-950/40 border border-red-500/30 text-red-300 text-[11px] font-medium"
            aria-label="Open incident panel"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
            <span>Incident</span>
          </button>
        </div>

        {/* Content Container */}
        <div className="p-4 sm:p-5 lg:p-6 flex flex-col gap-5 max-w-[1400px] mx-auto w-full">
          {/* Header */}
          <DashboardHeader title="Dashboard" breadcrumb="Dashboard" />

          {/* Map Area with floating Health Score Card */}
          <section aria-label="Fleet Telemetry Map">
            <MapStage onSelectIncidentAsset={(id) => setSelectedIncidentId(id)}>
              <HealthScoreCard />
            </MapStage>
          </section>

          {/* Action Needed Section */}
          <section aria-label="Action Needed Queue" className="flex flex-col gap-3">
            <ActionQueueHeader
              totalCount={INITIAL_QUEUE_DATA.length}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {/* Table */}
            <ActionTable
              items={filteredItems}
              selectedId={selectedIncidentId}
              onSelectItem={handleSelectItem}
            />
          </section>

          {/* Recent Activity Section */}
          <section
            aria-label="Recent Activity Stream"
            className="rounded-xl border border-white/[0.08] bg-[#0c0e0f] p-4 flex flex-col gap-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-emerald-400 animate-pulse" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Recent Telemetry Activity
                </h3>
              </div>
              <span className="font-mono text-[10px] text-white/35">FEED STATUS: LIVE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-lg bg-[#121415] border border-white/[0.05] flex items-center justify-between text-xs">
                <div className="flex flex-col gap-0.5 truncate pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-medium text-white/90 text-[11px]">
                      SIM-0001
                    </span>
                    <span className="text-[10px] text-red-400 font-medium">Critical Alarm</span>
                  </div>
                  <span className="text-[11px] text-white/50 truncate">
                    Coolant valve servo overload
                  </span>
                </div>
                <span className="text-[10px] font-mono text-white/35 whitespace-nowrap">
                  2m ago
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#121415] border border-white/[0.05] flex items-center justify-between text-xs">
                <div className="flex flex-col gap-0.5 truncate pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-medium text-white/90 text-[11px]">
                      SIM-0014
                    </span>
                    <span className="text-[10px] text-orange-400 font-medium">
                      Pneumatic Warning
                    </span>
                  </div>
                  <span className="text-[11px] text-white/50 truncate">
                    Differential pressure restored
                  </span>
                </div>
                <span className="text-[10px] font-mono text-white/35 whitespace-nowrap">
                  14m ago
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#121415] border border-white/[0.05] flex items-center justify-between text-xs">
                <div className="flex flex-col gap-0.5 truncate pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-medium text-white/90 text-[11px]">
                      SIM-0082
                    </span>
                    <span className="text-[10px] text-sky-400 font-medium">Route Diagnostic</span>
                  </div>
                  <span className="text-[11px] text-white/50 truncate">
                    Waypoint M7 KM 30 cleared
                  </span>
                </div>
                <span className="text-[10px] font-mono text-white/35 whitespace-nowrap">
                  32m ago
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 3. Right Incident Details Panel (Desktop persistent 320-340px) */}
      <div className="hidden xl:block">
        <IncidentPanel />
      </div>

      {/* Mobile/Tablet Incident Panel Overlay Drawer */}
      {isMobilePanelOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 xl:hidden flex justify-end">
          <div className="w-full sm:w-[380px] bg-[#0c0e0f] h-full flex flex-col relative shadow-2xl">
            <button
              type="button"
              onClick={() => setIsMobilePanelOpen(false)}
              className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-[#181a1b] text-white/70 hover:text-white"
              aria-label="Close incident details"
            >
              <X size={16} />
            </button>
            <IncidentPanel
              className="border-l-0 w-full flex-1"
              onConfirmEvacuation={() => setIsMobilePanelOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
