import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Network,
  FlaskConical,
  TrendingUp,
  GitCompare,
  Dices,
  CalendarClock,
  Activity,
  HeartPulse,
  Trophy,
  FileText,
  Leaf,
  Settings2,
  Play,
  Boxes,
  Plug,
  Library,
  BookOpen,
  LogOut,
} from "lucide-react";
import CountUp from "@/components/shared/CountUp";
import { useSimulationStore, formatHorizon, HORIZON_ANNUAL_KM } from "@/store/simulationStore";
import { LOCOMOTIVES } from "@/data/syntheticData";
import { cn } from "@/lib/utils";
import { getSession, logout } from "@/lib/auth";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Command Center", icon: LayoutDashboard },
  { to: "/fleet-explorer", label: "Fleet Explorer", icon: Network },
  { to: "/bom", label: "BOM Explorer", icon: Boxes, badge: "NEW" },
  { to: "/library", label: "Maintenance Library", icon: Library, badge: "NEW" },
  { to: "/simulation", label: "Simulation", icon: FlaskConical, badge: "LIVE" },
  { to: "/forecasting", label: "Forecasting", icon: TrendingUp, badge: "NEW" },
  { to: "/scenarios", label: "Scenarios", icon: GitCompare },
  { to: "/monte-carlo", label: "Monte Carlo", icon: Dices, badge: "NEW" },
  { to: "/maintenance", label: "Maintenance", icon: CalendarClock },
  { to: "/reliability", label: "Reliability", icon: Activity },
  { to: "/asset-health", label: "Asset Health", icon: HeartPulse, badge: "NEW" },
  { to: "/benchmark", label: "Benchmark", icon: Trophy },
  { to: "/tender", label: "Tender Mode", icon: FileText, badge: "NEW" },
  { to: "/sustainability", label: "Sustainability", icon: Leaf, badge: "NEW" },
  { to: "/integrations", label: "Integrations", icon: Plug, badge: "NEW" },
  { to: "/glossary", label: "Glossary", icon: BookOpen, badge: "NEW" },
  { to: "/configure", label: "Configure", icon: Settings2 },
];

const ROUTE_TITLES: Record<string, string> = {
  "/": "Command Center",
  "/fleet-explorer": "Fleet & Product Hierarchy Explorer",
  "/bom": "Bill of Materials — Part-Level Explorer",
  "/library": "Maintenance Library — Part-Level Cost Definitions",
  "/simulation": "TCO Simulation Playground",
  "/forecasting": "Forecasting Engine",
  "/scenarios": "Scenario Comparator",
  "/monte-carlo": "Monte Carlo Risk Simulation",
  "/maintenance": "Maintenance Schedule & Rule Engine",
  "/reliability": "Reliability & Warranty Analytics",
  "/asset-health": "Asset Health Index",
  "/benchmark": "Competitor Benchmark Arena",
  "/tender": "Tender Optimization Mode",
  "/sustainability": "Sustainability Dashboard",
  "/integrations": "Data Integration Hub",
  "/glossary": "Glossary — What Every Cost Category Includes",
  "/configure": "Self-Service Configuration",
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const { params, result, activeScenarioName, setParams, horizonUnit, setHorizonUnit } = useSimulationStore();
  const loco = LOCOMOTIVES.find((l) => l.id === params.locomotiveId) ?? LOCOMOTIVES[0];
  const shortModel = loco.model.split(" ")[0];
  const session = getSession();

  function handleLogout() {
    logout();
    router.navigate({ to: "/login" });
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-surface-1/80 backdrop-blur-xl">
        <div className="border-b border-border px-4 py-4">
          <div className="flex items-center justify-start px-2 py-2">
            <img src={`${import.meta.env.BASE_URL}wayam-logo.svg`} alt="Wayam AI" className="h-10 w-auto object-contain" />
          </div>
          <p className="font-display mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-secondary">
            TCO Intelligence
          </p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md border-l-2 px-2.5 py-2 text-[13px] transition-colors",
                  active
                    ? "border-primary bg-primary/10 font-semibold text-foreground shadow-[inset_0_0_20px_oklch(0.69_0.18_49/8%)]"
                    : "border-transparent text-text-secondary hover:bg-surface-2 hover:text-foreground",
                )}
              >
                <Icon size={16} className={active ? "text-primary" : ""} />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span
                    className={cn(
                      "font-mono-data rounded px-1 py-0.5 text-[9px] font-bold",
                      item.badge === "LIVE" ? "bg-teal/15 text-teal" : "bg-purple/20 text-chart-4",
                    )}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="glass-card p-2.5 text-[11px]">
            <p className="text-text-muted">Live scenario</p>
            <p className="font-mono-data mt-0.5 text-foreground">
              {activeScenarioName} · {shortModel} · {params.N}yr
            </p>
            <p className="font-mono-data mt-0.5 text-primary">
              ${(result.totalTCO / 1e6).toFixed(2)}M TCO
            </p>
          </div>
          {session ? (
            <button
              onClick={handleLogout}
              className="mt-2 flex w-full items-center gap-2 rounded-md border-l-2 border-transparent px-2.5 py-2 text-[13px] text-text-secondary transition-colors hover:bg-surface-2 hover:text-foreground"
              title={session.email}
            >
              <LogOut size={16} />
              <span className="min-w-0 flex-1 truncate text-left">{session.email}</span>
              <span className="font-mono-data text-[10px] uppercase text-text-muted">Sign out</span>
            </button>
          ) : null}
        </div>
      </aside>

      {/* Main */}
      <div className="ml-60 flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-xl">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted">Platform</p>
            <h1 className="font-display truncate text-sm font-semibold">
              {ROUTE_TITLES[pathname] ?? "Lifecycle Intelligence"}
            </h1>
          </div>
          <div className="flex flex-1 items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-teal" />
            <span className="text-[10px] uppercase tracking-widest text-text-secondary">TCO</span>
            <span className="font-mono-data font-display text-lg font-bold text-foreground tabular-nums">
              <CountUp end={result.totalTCO} duration={0.5} separator="," prefix="$" preserveValue />
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Planning horizon — the same span, shown in years or kilometres */}
            <div className="flex overflow-hidden rounded-md border border-border">
              {[5, 10, 20, 30].map((n) => (
                <button
                  key={n}
                  onClick={() => setParams({ N: n })}
                  className={cn(
                    "px-2 py-1 text-[11px] tabular-nums transition-colors",
                    params.N === n ? "bg-primary text-primary-foreground" : "bg-surface-2 text-text-secondary hover:text-foreground",
                  )}
                  title={`${n} years · ${((n * HORIZON_ANNUAL_KM) / 1e6).toFixed(1)}M km`}
                >
                  {formatHorizon(n, horizonUnit)}
                </button>
              ))}
            </div>
            <div className="flex overflow-hidden rounded-md border border-border">
              {(["years", "km"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setHorizonUnit(u)}
                  className={cn(
                    "px-2 py-1 text-[11px] transition-colors",
                    horizonUnit === u ? "bg-primary text-primary-foreground" : "bg-surface-2 text-text-secondary hover:text-foreground",
                  )}
                >
                  {u === "years" ? "Years" : "Kilometres"}
                </button>
              ))}
            </div>
            <span className="rounded-md border border-teal/30 bg-teal/10 px-2 py-1 text-[10px] font-semibold text-teal">
              ISO 55000
            </span>
          </div>
        </header>

        <main className="flex-1 p-6 pb-20">{children}</main>

        {/* Status bar */}
        <footer className="fixed bottom-0 left-60 right-0 z-30 flex h-11 items-center gap-4 border-t border-border bg-surface-1/90 px-5 text-xs backdrop-blur-xl">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse-glow rounded-full bg-red" />
            <span className="font-mono-data font-semibold text-foreground">LIVE</span>
          </span>
          <span className="font-mono-data text-text-secondary">
            {activeScenarioName} | {shortModel} | {params.operatingProfile} | {params.N}yr |{" "}
            <span className="text-primary">
              ${Math.round(result.totalTCO).toLocaleString("en-US")}
            </span>
          </span>
          <span className="flex-1" />
          <Link to="/simulation" className="flex items-center gap-1 rounded-md bg-primary/15 px-2.5 py-1 font-semibold text-primary transition-colors hover:bg-primary/25">
            <Play size={11} /> Re-run
          </Link>
          <Link to="/monte-carlo" className="text-text-secondary transition-colors hover:text-foreground">
            Monte Carlo →
          </Link>
        </footer>
      </div>
    </div>
  );
}
