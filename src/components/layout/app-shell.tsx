import React from "react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  /** Optional custom content to render inside the main area */
  children?: React.ReactNode;
  /** Active navigation item identifier */
  activeNavId?: string;
  /** Callback when navigation item is selected */
  onSelectNav?: (id: string) => void;
  /** Custom class for outer wrapper */
  className?: string;
  /** Custom class for main content container */
  mainClassName?: string;
}

/**
 * Full-screen dark application shell for the telemetry command center.
 * Features:
 * - 100vh height & 100vw width with zero body scrolling
 * - 68px left sidebar
 * - Continuous near-black layered dark frame (#080a0b)
 * - Flexible, zero-overflow main content canvas ready for future components
 */
export function AppShell({
  children,
  activeNavId,
  onSelectNav,
  className,
  mainClassName,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "flex h-screen w-screen overflow-hidden bg-page text-primary font-sans antialiased",
        className,
      )}
    >
      {/* 68px Full-height telemetry sidebar */}
      <Sidebar activeId={activeNavId} onSelect={onSelectNav} />

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 min-w-0 h-full overflow-hidden flex flex-col bg-page relative",
          mainClassName,
        )}
      >
        {children ?? (
          <div className="p-8">
            <h1 className="text-xl font-semibold tracking-tight text-primary">Dashboard</h1>
          </div>
        )}
      </main>
    </div>
  );
}
