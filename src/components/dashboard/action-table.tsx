import React, { useState } from "react";
import { MoreVertical, ChevronRight, Check } from "lucide-react";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

export interface QueueItem {
  id: string;
  priority: StatusType;
  asset: string;
  description: string;
  time: string;
  driver: string;
  statusLabel?: string;
}

export const INITIAL_QUEUE_DATA: QueueItem[] = [
  {
    id: "SIM-0001",
    priority: "critical",
    asset: "SIM-0001",
    description: "Critical telemetry from SIM-0001 — Engine temperature exceeded 104°C on M7 Highway KM 45",
    time: "2m ago",
    driver: "Mike Ross",
  },
  {
    id: "SIM-0014",
    priority: "critical",
    asset: "SIM-0014",
    description: "Main brake pipe differential pressure drop — 3.2 bar threshold crossed",
    time: "14m ago",
    driver: "Rachel Zane",
  },
  {
    id: "SIM-0082",
    priority: "warning",
    asset: "SIM-0082",
    description: "Coolant reserve tank level degraded below 15% safety limit",
    time: "32m ago",
    driver: "Harvey Specter",
  },
  {
    id: "SIM-0105",
    priority: "warning",
    asset: "SIM-0105",
    description: "Traction motor inverter #2 thermal delta rising abnormally (+18°C/hr)",
    time: "1h ago",
    driver: "Donna Paulsen",
  },
  {
    id: "SIM-0219",
    priority: "warning",
    asset: "SIM-0219",
    description: "High particulate matter in fuel recirculation circuit — scheduled check pending",
    time: "2h ago",
    driver: "Louis Litt",
  },
  {
    id: "SIM-0341",
    priority: "info",
    asset: "SIM-0341",
    description: "Over-The-Air ECU firmware package 4.2.1 downloaded; telemetry verification pending",
    time: "3h ago",
    driver: "Jessica Pearson",
  },
  {
    id: "SIM-0402",
    priority: "info",
    asset: "SIM-0402",
    description: "Routine diagnostic telemetry handshake completed successfully",
    time: "4h ago",
    driver: "Robert Zane",
  },
];

export interface ActionTableProps {
  items?: QueueItem[];
  selectedId?: string;
  onSelectItem?: (item: QueueItem) => void;
  className?: string;
}

export function ActionTable({
  items = INITIAL_QUEUE_DATA,
  selectedId = "SIM-0001",
  onSelectItem,
  className,
}: ActionTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set(["SIM-0001"]));

  const toggleSelectAll = () => {
    if (selectedRows.size === items.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(items.map((i) => i.id)));
    }
  };

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedRows);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRows(next);
  };

  return (
    <div
      className={cn(
        "w-full rounded-xl border border-white/[0.08] bg-[#0c0e0f] overflow-hidden shadow-sm select-none",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Sticky Dense Table Header */}
          <thead>
            <tr className="border-b border-white/[0.08] bg-[#111314] text-[11px] font-medium text-white/45 tracking-wider uppercase">
              <th className="py-2.5 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selectedRows.size === items.length}
                  onChange={toggleSelectAll}
                  aria-label="Select all rows"
                  className="rounded bg-[#1a1d1e] border-white/20 text-white focus:ring-0 focus:ring-offset-0 cursor-pointer accent-white"
                />
              </th>
              <th className="py-2.5 px-3 w-28">Priority</th>
              <th className="py-2.5 px-3 w-28 font-mono">Asset</th>
              <th className="py-2.5 px-3 min-w-[280px]">Description</th>
              <th className="py-2.5 px-3 w-24">Time</th>
              <th className="py-2.5 px-3 w-32">Driver</th>
              <th className="py-2.5 px-3 w-10 text-right"></th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-white/[0.04]">
            {items.map((row) => {
              const isCurrentSelected = row.id === selectedId;
              const isChecked = selectedRows.has(row.id);

              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectItem?.(row)}
                  className={cn(
                    "group transition-colors duration-150 cursor-pointer",
                    isCurrentSelected
                      ? "bg-[#181a1c] text-white"
                      : "bg-[#0c0e0f] hover:bg-[#141617] text-white/80"
                  )}
                >
                  {/* Checkbox */}
                  <td
                    className="py-2.5 px-3 text-center"
                    onClick={(e) => toggleRow(row.id, e)}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      aria-label={`Select row ${row.asset}`}
                      className="rounded bg-[#1a1d1e] border-white/20 text-white focus:ring-0 cursor-pointer accent-white"
                    />
                  </td>

                  {/* Priority */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <StatusBadge status={row.priority} />
                  </td>

                  {/* Asset */}
                  <td className="py-2.5 px-3 font-mono font-medium tracking-tight text-white/90 whitespace-nowrap">
                    {row.asset}
                  </td>

                  {/* Description */}
                  <td className="py-2.5 px-3 text-white/70 group-hover:text-white/90 transition-colors truncate max-w-md">
                    {row.description}
                  </td>

                  {/* Time */}
                  <td className="py-2.5 px-3 text-white/45 font-mono whitespace-nowrap tabular-nums">
                    {row.time}
                  </td>

                  {/* Driver */}
                  <td className="py-2.5 px-3 text-white/80 whitespace-nowrap font-medium">
                    {row.driver}
                  </td>

                  {/* Chevron / Action */}
                  <td className="py-2.5 px-3 text-right text-white/25 group-hover:text-white/60">
                    <ChevronRight size={14} className="inline transition-transform group-hover:translate-x-0.5" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
