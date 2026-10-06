import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import CountUp from "@/components/shared/CountUp";
import { AppIcon } from "@/components/icons/AppIcon";
import { IconButton } from "@/components/icons/IconButton";
import type { IconName } from "@/components/icons/registry";
import { FilterChip, FilterChipGroup } from "@/components/shared/FilterChip";
import { useSimulationStore, formatHorizon, HORIZON_ANNUAL_KM } from "@/store/simulationStore";
import { LOCOMOTIVES } from "@/data/syntheticData";
import { cn } from "@/lib/utils";
import { getSession, logout } from "@/lib/auth";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

type NavItem = { to: string; label: string; icon: IconName; badge?: "NEW" | "LIVE" };

const NAV: NavItem[] = [
  { to: "/", label: "Command Center", icon: "dashboard" },
  { to: "/fleet-explorer", label: "Fleet Explorer", icon: "hierarchy" },
  { to: "/bom", label: "BOM Explorer", icon: "bom", badge: "NEW" },
  { to: "/library", label: "Maintenance Library", icon: "library", badge: "NEW" },
  { to: "/simulation", label: "Simulation", icon: "simulation", badge: "LIVE" },
  { to: "/forecasting", label: "Forecasting", icon: "forecasting", badge: "NEW" },
  { to: "/scenarios", label: "Scenarios", icon: "scenarios" },
  { to: "/monte-carlo", label: "Monte Carlo", icon: "monteCarlo", badge: "NEW" },
  { to: "/maintenance", label: "Maintenance", icon: "schedule" },
  { to: "/reliability", label: "Reliability", icon: "reliability" },
  { to: "/asset-health", label: "Asset Health", icon: "assetHealth", badge: "NEW" },
  { to: "/benchmark", label: "Benchmark", icon: "benchmark" },
  { to: "/tender", label: "Tender Mode", icon: "document", badge: "NEW" },
  { to: "/sustainability", label: "Sustainability", icon: "sustainability", badge: "NEW" },
  { to: "/integrations", label: "Integrations", icon: "integrations", badge: "NEW" },
  { to: "/glossary", label: "Glossary", icon: "glossary", badge: "NEW" },
  { to: "/configure", label: "Configure", icon: "settings" },
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

/** Short label for the breadcrumb — the full title goes in the page heading. */
const CRUMB: Record<string, string> = Object.fromEntries(NAV.map((n) => [n.to, n.label]));

/**
 * One navigation row. States follow the action-surface token scale:
 *   inactive -> surface.action + icon.tertiary
 *   hover    -> surface.raised-x2 + icon.secondary
 *   active   -> action-surface.primary (light) + icon.on-color (near-black)
 */
function SidebarItem({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      to={item.to}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "transition-ui text-body-md group flex items-center gap-2.5 rounded-lg px-2.5 py-2",
        active
          ? "bg-action-primary text-on-color font-medium"
          : "text-fg-tertiary hover:bg-raised-2 hover:text-fg-primary",
      )}
    >
      <AppIcon
        name={item.icon}
        size="lg"
        className={cn(
          "transition-ui",
          active ? "text-icon-on-color" : "text-icon-tertiary group-hover:text-icon-secondary",
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span
          className={cn(
            "text-caption rounded px-1 py-0.5 uppercase",
            active
              ? "bg-page/10 text-on-color"
              : item.badge === "LIVE"
                ? "bg-success-bg text-success"
                : "bg-info-bg text-info",
          )}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const { params, result, activeScenarioName, setParams, horizonUnit, setHorizonUnit } =
    useSimulationStore();
  const loco = LOCOMOTIVES.find((l) => l.id === params.locomotiveId) ?? LOCOMOTIVES[0];
  const shortModel = loco.model.split(" ")[0];
  const session = getSession();
  const [navOpen, setNavOpen] = useState(false);

  // Close the mobile drawer automatically whenever the route changes.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  function handleLogout() {
    logout();
    setNavOpen(false);
    router.navigate({ to: "/login" });
  }

  const horizonControls = (
    <>
      {/* Planning horizon — the same span, shown in years or kilometres */}
      <FilterChipGroup>
        {[5, 10, 20, 30].map((n) => (
          <FilterChip
            key={n}
            selected={params.N === n}
            onClick={() => setParams({ N: n })}
            title={`${n} years · ${((n * HORIZON_ANNUAL_KM) / 1e6).toFixed(1)}M km`}
          >
            {formatHorizon(n, horizonUnit)}
          </FilterChip>
        ))}
      </FilterChipGroup>
      <FilterChipGroup>
        {(["years", "km"] as const).map((u) => (
          <FilterChip key={u} selected={horizonUnit === u} onClick={() => setHorizonUnit(u)}>
            {u === "years" ? "Years" : "Kilometres"}
          </FilterChip>
        ))}
      </FilterChipGroup>
      <span className="text-label-sm border-default bg-action text-fg-tertiary shrink-0 rounded-md border px-2 py-1">
        ISO 55000
      </span>
    </>
  );

  const sidebarNav = (
    <>
      <div className="border-stroke-muted border-b px-4 py-4">
        <div className="flex items-center justify-start px-1 py-1">
          <img
            src={`${import.meta.env.BASE_URL}wayam-logo.svg`}
            alt="Wayam AI"
            className="h-9 w-auto object-contain"
          />
        </div>
        <p className="font-display text-caption text-fg-quaternary mt-2 uppercase">
          TCO Intelligence
        </p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV.map((item) => (
          <SidebarItem key={item.to} item={item} active={pathname === item.to} />
        ))}
      </nav>
      <div className="border-stroke-muted space-y-2 border-t p-3">
        <div className="bg-raised border-default rounded-lg border p-2.5">
          <p className="text-caption text-fg-quaternary uppercase">Live scenario</p>
          <p className="font-mono-data text-body-sm text-fg-secondary mt-1">
            {activeScenarioName} · {shortModel} · {params.N}yr
          </p>
          <p className="font-display text-display-base text-fg-primary mt-1 tabular-nums">
            ${(result.totalTCO / 1e6).toFixed(2)}M TCO
          </p>
        </div>
        {session ? (
          <button
            onClick={handleLogout}
            className="transition-ui text-body-md text-fg-tertiary hover:bg-raised-2 hover:text-fg-primary flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2"
            title={session.email}
            aria-label={`Sign out of ${session.email}`}
          >
            <AppIcon name="logout" size="lg" className="text-icon-tertiary" />
            <span className="min-w-0 flex-1 truncate text-left">{session.email}</span>
            <span className="text-caption text-fg-quaternary uppercase">Sign out</span>
          </button>
        ) : null}
      </div>
    </>
  );

  return (
    <div className="bg-page flex h-screen overflow-hidden">
      {/* Desktop sidebar — hidden below lg, replaced by the drawer below */}
      <aside className="bg-container border-stroke-muted fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r lg:flex">
        {sidebarNav}
      </aside>

      {/* Mobile / tablet nav drawer */}
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent
          side="left"
          className="bg-container border-stroke-muted flex w-72 max-w-[85vw] flex-col p-0 lg:hidden"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {sidebarNav}
        </SheetContent>
      </Sheet>

      {/* Main */}
      <div className="flex h-screen w-full min-w-0 flex-1 flex-col lg:ml-60">
        {/* Top bar */}
        <header className="border-stroke-muted bg-page flex shrink-0 items-center gap-3 border-b px-3 py-2.5 sm:px-4 lg:px-6 lg:py-3">
          <IconButton
            icon="menu"
            aria-label="Open navigation"
            variant="subtle"
            size="sm"
            className="lg:hidden"
            onClick={() => setNavOpen(true)}
          />

          <div className="min-w-0 flex-1">
            {/* Breadcrumb */}
            <div className="text-label-sm text-fg-quaternary flex items-center gap-1.5">
              <Link
                to="/"
                className="transition-ui hover:text-fg-secondary"
                aria-label="Command Center"
              >
                <AppIcon name="home" size="xs" />
              </Link>
              <span aria-hidden="true">/</span>
              <span className="truncate">{CRUMB[pathname] ?? "Platform"}</span>
            </div>
            <h1
              className="font-display text-display-2xl lg:text-display-page text-fg-primary mt-1 truncate"
              title={ROUTE_TITLES[pathname] ?? "Lifecycle Intelligence"}
            >
              {ROUTE_TITLES[pathname] ?? "Lifecycle Intelligence"}
            </h1>
          </div>

          <div className="hidden shrink-0 items-center gap-2.5 2xl:flex">
            <span className="text-caption text-fg-quaternary hidden uppercase md:inline">
              Fleet TCO
            </span>
            <span className="font-display text-display-xl text-fg-primary tabular-nums">
              <CountUp
                end={result.totalTCO}
                duration={0.5}
                separator=","
                prefix="$"
                preserveValue
              />
            </span>
          </div>

          <div className="hidden items-center gap-2 xl:flex">{horizonControls}</div>
        </header>

        {/* Compact horizon controls for small screens, shown below the header so nothing gets clipped */}
        <div className="border-stroke-muted bg-page flex shrink-0 items-center gap-2 overflow-x-auto border-b px-3 py-2 xl:hidden">
          {horizonControls}
        </div>

        <main className="w-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 pb-24 sm:p-4 lg:p-6 lg:pb-16">
          {children}
        </main>

        {/* Status bar */}
        <footer className="border-stroke-muted bg-container text-body-sm fixed bottom-0 left-0 right-0 z-30 flex h-auto flex-wrap items-center gap-2 border-t px-3 py-2 sm:gap-4 lg:left-60 lg:h-10 lg:flex-nowrap lg:px-5 lg:py-0">
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="bg-error-icon animate-pulse-glow h-1.5 w-1.5 rounded-full" />
            <span className="text-caption text-fg-secondary uppercase">Live</span>
          </span>
          <span className="font-mono-data text-fg-tertiary min-w-0 truncate">
            {activeScenarioName} | {shortModel} | {params.operatingProfile} | {params.N}yr |{" "}
            <span className="text-fg-primary">
              ${Math.round(result.totalTCO).toLocaleString("en-US")}
            </span>
          </span>
          <span className="hidden flex-1 lg:block" />
          <Link
            to="/simulation"
            className="transition-ui text-label-sm bg-action-secondary text-fg-secondary hover:bg-action-secondary-hover hover:text-fg-primary flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1"
          >
            <AppIcon name="play" size="xs" /> Re-run
          </Link>
          <Link
            to="/monte-carlo"
            className="transition-ui text-fg-tertiary hover:text-fg-primary hidden shrink-0 items-center gap-1 sm:flex"
          >
            Monte Carlo <AppIcon name="arrowRight" size="xs" />
          </Link>
        </footer>
      </div>
    </div>
  );
}
