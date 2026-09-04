import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import { KPICard } from "@/components/shared/KPICard";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import {
  CONNECTORS,
  DATA_STANDARDS,
  PIPELINE_STAGES,
  GOLDEN_RECORDS,
  INGEST_TREND,
  type Connector,
  type ConnectorCategory,
  type ConnectorStatus,
} from "@/data/integrationsData";
import { CHART_COLORS } from "@/data/syntheticData";
import { fmtNum, fmtCompact } from "@/utils/formatters";
import { alpha, cn } from "@/lib/utils";
import { AppIcon } from "@/components/icons/AppIcon";
import type { IconName } from "@/components/icons/registry";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations | TCO Intelligence" },
      {
        name: "description",
        content:
          "Data integration hub — connectors to SAP, Maximo, Wabtec, Railinc and OT historians feeding the TCO platform.",
      },
    ],
  }),
  component: Integrations,
});

const STATUS_COLOR: Record<ConnectorStatus, string> = {
  connected: CHART_COLORS.green,
  degraded: CHART_COLORS.yellow,
  down: CHART_COLORS.red,
  paused: CHART_COLORS.textSecondary,
};

const CAT_ICON: Record<ConnectorCategory, IconName> = {
  ERP: "organization",
  EAM: "bom",
  RailOEM: "cpu",
  Telematics: "signal",
  Wayside: "gauge",
  Historian: "server",
  Fuel: "fuel",
  PTC: "warrantyActive",
  Registry: "database",
};

const CAT_COLOR: Record<ConnectorCategory, string> = {
  ERP: CHART_COLORS.blue,
  EAM: CHART_COLORS.teal,
  RailOEM: CHART_COLORS.purple,
  Telematics: CHART_COLORS.orange,
  Wayside: CHART_COLORS.yellow,
  Historian: CHART_COLORS.green,
  Fuel: CHART_COLORS.orange,
  PTC: CHART_COLORS.red,
  Registry: CHART_COLORS.blue,
};

function lastSyncLabel(mins: number): string {
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

function Integrations() {
  const [selected, setSelected] = useState<Connector>(CONNECTORS[1]); // SAP PM
  const [catFilter, setCatFilter] = useState<ConnectorCategory | "All">("All");
  const [view, setView] = useState<"connectors" | "topology" | "quality">("connectors");

  const stats = useMemo(() => {
    const total = CONNECTORS.length;
    const connected = CONNECTORS.filter((c) => c.status === "connected").length;
    const degraded = CONNECTORS.filter(
      (c) => c.status === "degraded" || c.status === "down",
    ).length;
    const records = CONNECTORS.reduce((s, c) => s + c.recordsPerDay, 0);
    const avgErr = CONNECTORS.reduce((s, c) => s + c.errorRatePct, 0) / total;
    return { total, connected, degraded, records, avgErr };
  }, []);

  const filtered =
    catFilter === "All" ? CONNECTORS : CONNECTORS.filter((c) => c.category === catFilter);
  const categories = Array.from(new Set(CONNECTORS.map((c) => c.category)));

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label="Active Connectors"
          value={stats.connected}
          suffix={`/${stats.total}`}
          glow="teal"
          sub={
            <span>
              {stats.degraded > 0 ? (
                <span className="text-yellow">⚠ {stats.degraded} need attention</span>
              ) : (
                "All healthy"
              )}
            </span>
          }
        />
        <KPICard
          label="Records / Day"
          value={stats.records / 1e6}
          suffix="M"
          decimals={1}
          glow="blue"
          sub={<span>Across all source systems</span>}
        />
        <KPICard
          label="Avg Error Rate"
          value={stats.avgErr}
          suffix="%"
          decimals={2}
          glow="orange"
          sub={<span>Rolling 24h across feeds</span>}
        />
        <KPICard
          label="Data Standards"
          value={DATA_STANDARDS.length}
          glow="purple"
          sub={<span>AAR · Railinc · IEC · ISO · ASD</span>}
        />
      </div>

      {/* View switch */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-md border border-border text-mini">
          {(
            [
              ["connectors", "Connectors"],
              ["topology", "Data Flow & MDM"],
              ["quality", "Pipeline & Standards"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setView(k)}
              className={cn(
                "px-3 py-1.5",
                view === k
                  ? "bg-raised-2 font-medium text-fg-primary"
                  : "transition-ui bg-action text-fg-tertiary hover:bg-raised-2 hover:text-fg-secondary",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "connectors" && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {(["All", ...categories] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-mini transition-colors",
                  catFilter === c
                    ? "border-primary bg-primary/15 font-semibold text-primary"
                    : "border-border text-text-secondary hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-5">
            <div className="grid content-start gap-3 sm:grid-cols-2 xl:col-span-3">
              {filtered.map((c) => (
                <ConnectorCard
                  key={c.id}
                  connector={c}
                  selected={selected.id === c.id}
                  onClick={() => setSelected(c)}
                />
              ))}
            </div>
            <div className="xl:col-span-2">
              <ConnectorDetail connector={selected} />
            </div>
          </div>
        </>
      )}

      {view === "topology" && <TopologyView onSelect={setSelected} />}
      {view === "quality" && <QualityView />}
    </div>
  );
}

/* ────────────────────────── CONNECTOR CARD ────────────────────────── */

function ConnectorCard({
  connector,
  selected,
  onClick,
}: {
  connector: Connector;
  selected: boolean;
  onClick: () => void;
}) {
  const iconName = CAT_ICON[connector.category];
  const color = CAT_COLOR[connector.category];
  return (
    <button
      onClick={onClick}
      className={cn(
        "glass-card p-3.5 text-left transition-all hover:-translate-y-0.5",
        selected ? "border-primary/50 ring-1 ring-primary/40" : "hover:border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="grid h-8 w-8 place-items-center rounded-lg"
            style={{ background: alpha(color, 10), color }}
          >
            <AppIcon name={iconName} size="md" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{connector.name}</p>
            <p className="truncate text-mini text-text-muted">{connector.vendor}</p>
          </div>
        </div>
        <span
          className="flex shrink-0 items-center gap-1 text-micro font-semibold"
          style={{ color: STATUS_COLOR[connector.status] }}
        >
          <AppIcon
            name="circleDot"
            size="xs"
            className={connector.status === "connected" ? "animate-pulse-glow" : ""}
          />
          {connector.status}
        </span>
      </div>
      <p className="mt-2 line-clamp-1 text-mini text-text-secondary">{connector.dataDomain}</p>
      <div className="mt-2.5 flex items-center justify-between text-mini text-text-muted">
        <span className="font-mono-data">
          {fmtCompact(connector.recordsPerDay).replace("$", "")}/day
        </span>
        <span>{lastSyncLabel(connector.lastSyncMinsAgo)}</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full"
          style={{ width: `${connector.uptimePct}%`, background: STATUS_COLOR[connector.status] }}
        />
      </div>
    </button>
  );
}

/* ────────────────────────── CONNECTOR DETAIL ────────────────────────── */

function ConnectorDetail({ connector: c }: { connector: Connector }) {
  const iconName = CAT_ICON[c.category];
  const color = CAT_COLOR[c.category];
  return (
    <div className="space-y-4">
      <GlassCard scanline>
        <div className="flex items-start gap-3">
          <span
            className="grid h-11 w-11 place-items-center rounded-xl"
            style={{ background: alpha(color, 10), color }}
          >
            <AppIcon name={iconName} size="2xl" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold">{c.name}</h2>
              <span
                className="rounded-md px-2 py-0.5 text-mini font-bold"
                style={{
                  background: alpha(STATUS_COLOR[c.status], 13),
                  color: STATUS_COLOR[c.status],
                }}
              >
                {c.status}
              </span>
            </div>
            <p className="text-mini text-text-secondary">
              {c.vendor} · {c.category}
            </p>
            <p className="mt-1 text-mini text-text-muted">{c.dataDomain}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          <DetailStat label="Sync" value={c.syncFrequency.split(" ")[0]} />
          <DetailStat label="Latency" value={`${c.latencyMs}ms`} />
          <DetailStat label="Error" value={`${c.errorRatePct}%`} accent={c.errorRatePct > 3} />
          <DetailStat label="Uptime" value={`${c.uptimePct}%`} />
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle className="mb-2">Interface</SectionTitle>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-mini">
          <Row label="Protocols">
            <span className="flex flex-wrap justify-end gap-1">
              {c.protocol.map((p) => (
                <span
                  key={p}
                  className="rounded bg-surface-3 px-1.5 py-0.5 font-mono-data text-micro"
                >
                  {p}
                </span>
              ))}
            </span>
          </Row>
          <Row label="Auth">
            <span className="font-mono-data">{c.auth}</span>
          </Row>
          <Row label="Frequency">
            <span>{c.syncFrequency}</span>
          </Row>
          <Row label="Freshness SLA">
            <span className="font-mono-data">{c.freshnessSlaMins}m</span>
          </Row>
          <Row label="Volume/day">
            <span className="font-mono-data">{fmtNum(c.recordsPerDay)}</span>
          </Row>
          <Row label="Throughput">
            <span className="font-mono-data">{fmtNum(c.throughputPerMin)}/min</span>
          </Row>
          <Row label="Quota used">
            <span className="font-mono-data">{c.quotaUsedPct}%</span>
          </Row>
          <Row label="DLQ depth">
            <span className={cn("font-mono-data", c.dlqDepth > 50 && "text-orange")}>
              {c.dlqDepth}
            </span>
          </Row>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle className="mb-2">Entities Ingested</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {c.entities.map((e) => (
            <span
              key={e}
              className="rounded-md bg-surface-2 px-2 py-1 text-mini text-text-secondary"
            >
              {e}
            </span>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle className="mb-2 flex items-center gap-1.5">
          <AppIcon name="branch" size="xs" /> Field Mapping → Canonical Model
        </SectionTitle>
        <div className="space-y-1.5">
          {c.mappings.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md bg-surface-2/60 px-2 py-1.5 text-mini"
            >
              <span className="font-mono-data flex-1 truncate text-text-secondary">{m.source}</span>
              <AppIcon name="arrowRight" size="xs" className="shrink-0 text-primary" />
              <span className="font-mono-data flex-1 truncate text-right text-foreground">
                {m.canonical}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {c.standards.length > 0 && (
        <GlassCard>
          <SectionTitle className="mb-2">Standards</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {c.standards.map((s) => (
              <span
                key={s}
                className="rounded border border-teal/30 bg-teal/10 px-2 py-0.5 text-mini font-semibold text-teal"
              >
                {s}
              </span>
            ))}
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <SectionTitle className="mb-2">Powers Platform Modules</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {c.feeds.map((f) => (
            <span
              key={f}
              className="rounded-md bg-primary/10 px-2 py-1 text-mini font-medium text-primary"
            >
              {f}
            </span>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function DetailStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-surface-2/70 p-2">
      <p className="text-micro uppercase tracking-wider text-text-muted">{label}</p>
      <p className={cn("font-mono-data mt-0.5 text-sm font-semibold", accent && "text-orange")}>
        {value}
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-text-muted">{label}</span>
      {children}
    </div>
  );
}

/* ────────────────────────── TOPOLOGY / MDM VIEW ────────────────────────── */

function TopologyView({ onSelect }: { onSelect: (c: Connector) => void }) {
  const groups: { cat: ConnectorCategory; label: string }[] = [
    { cat: "ERP", label: "ERP / Finance" },
    { cat: "EAM", label: "EAM / CMMS" },
    { cat: "RailOEM", label: "Rail OEM Cloud" },
    { cat: "Telematics", label: "Telematics / IoT" },
    { cat: "Wayside", label: "Wayside / Registry" },
    { cat: "Historian", label: "OT Historian" },
  ];

  return (
    <div className="space-y-5">
      <GlassCard className="dot-grid" scanline>
        <SectionTitle className="mb-4">Source → Pipeline → Platform Data Flow</SectionTitle>
        <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
          {/* Sources */}
          <div className="space-y-2">
            {groups.map((g) => {
              const conns = CONNECTORS.filter(
                (c) => c.category === g.cat || (g.cat === "Wayside" && c.category === "Registry"),
              );
              if (conns.length === 0) return null;
              return (
                <div key={g.cat} className="rounded-lg border border-border bg-surface-2/40 p-2">
                  <p
                    className="mb-1.5 text-mini font-semibold uppercase tracking-wider"
                    style={{ color: CAT_COLOR[g.cat] }}
                  >
                    {g.label}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {conns.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => onSelect(c)}
                        className="flex items-center gap-1 rounded bg-surface-1 px-1.5 py-1 text-mini hover:bg-surface-3"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: STATUS_COLOR[c.status] }}
                        />
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pipeline spine */}
          <div className="flex flex-col items-center gap-1.5 px-2">
            <AppIcon name="arrowRight" size="xl" className="hidden text-primary lg:block" />
            {PIPELINE_STAGES.map((s, i) => (
              <div key={s.id} className="w-full min-w-[120px]">
                <div className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-center">
                  <p className="text-mini font-semibold text-primary">{s.name}</p>
                  <p className="font-mono-data text-micro text-text-muted">
                    {s.healthPct}% · {fmtCompact(s.recordsPerDay).replace("$", "")}/d
                  </p>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className="mx-auto h-2 w-px bg-primary/30" />
                )}
              </div>
            ))}
          </div>

          {/* Platform */}
          <div className="space-y-2">
            {[
              "TCO Ledger & Depreciation",
              "Asset Health & Reliability",
              "BOM Inventory & Parts",
              "Forecasting & Monte Carlo",
              "Sustainability",
            ].map((m) => (
              <div
                key={m}
                className="rounded-lg border border-teal/30 bg-teal/10 px-3 py-2.5 text-mini font-medium text-teal"
              >
                {m}
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Master data / golden record */}
      <GlassCard>
        <SectionTitle className="mb-1">Master Data Management — Asset Golden Record</SectionTitle>
        <p className="mb-3 text-mini text-text-muted">
          One locomotive identity reconciled across every source system's native key (survivorship →
          golden record).
        </p>
        <div className="overflow-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-micro uppercase text-text-muted">
                {[
                  "Golden ID",
                  "Model",
                  "SAP EQUNR",
                  "Maximo ASSETNUM",
                  "Umler Mark",
                  "OEM Serial",
                  "UIC EVN",
                ].map((h) => (
                  <th key={h} className="px-2 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GOLDEN_RECORDS.map((r) => (
                <tr key={r.assetId} className="border-b border-border/40">
                  <td className="font-mono-data px-2 py-2 text-primary">{r.assetId}</td>
                  <td className="px-2 py-2">{r.model}</td>
                  <td className="font-mono-data px-2 py-2 text-text-secondary">{r.sapEqunr}</td>
                  <td className="font-mono-data px-2 py-2 text-text-secondary">
                    {r.maximoAssetnum}
                  </td>
                  <td className="font-mono-data px-2 py-2 text-text-secondary">{r.umlerMark}</td>
                  <td className="font-mono-data px-2 py-2 text-text-secondary">{r.oemSerial}</td>
                  <td className="font-mono-data px-2 py-2 text-text-secondary">{r.uicEvn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

/* ────────────────────────── QUALITY / STANDARDS VIEW ────────────────────────── */

function QualityView() {
  const concepts = [
    {
      name: "Schema / Field Mapping",
      desc: "Source fields → canonical model; coverage tracked per connector",
      metric: "98.2% mapped",
    },
    {
      name: "Data Lineage",
      desc: "Per-field provenance from source through to golden record",
      metric: "full graph",
    },
    {
      name: "Freshness SLA",
      desc: "Max staleness per feed; breach alerts on overrun",
      metric: "3 breaching",
    },
    {
      name: "Reconciliation",
      desc: "Cross-source totals match (fuel burn vs dispensed, WO cost SAP vs Maximo)",
      metric: "99.1% tie-out",
    },
    {
      name: "Dead-Letter Queue",
      desc: "Failed records held for replay; depth & age monitored",
      metric: "412 held",
    },
    {
      name: "Idempotency",
      desc: "Natural-key dedupe so retried deliveries don't double-post",
      metric: "enabled",
    },
    {
      name: "Change Data Capture",
      desc: "Log-based CDC (Debezium / SLT) instead of full extracts",
      metric: "1.2s lag",
    },
    {
      name: "Master Data Mgmt",
      desc: "Asset-ID survivorship into a single golden record",
      metric: "3 xref keys",
    },
  ];

  return (
    <div className="space-y-5">
      <GlassCard>
        <SectionTitle className="mb-3">24h Ingest Throughput</SectionTitle>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={INGEST_TREND}>
            <defs>
              <linearGradient id="ingest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.teal} stopOpacity={0.5} />
                <stop offset="100%" stopColor={CHART_COLORS.teal} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="hour"
              stroke={CHART_COLORS.textMuted}
              fontSize={9}
              tickFormatter={(v) => `${v}:00`}
            />
            <YAxis
              stroke={CHART_COLORS.textMuted}
              fontSize={9}
              tickFormatter={(v: number) => `${v}k`}
            />
            <Tooltip content={<ChartTooltip formatter={(v: number) => `${v}k records`} />} />
            <Area
              type="monotone"
              dataKey="kRecords"
              name="Ingested"
              stroke={CHART_COLORS.teal}
              strokeWidth={2}
              fill="url(#ingest)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <GlassCard>
          <SectionTitle className="mb-3">Pipeline Health Concepts</SectionTitle>
          <div className="space-y-2">
            {concepts.map((c) => (
              <div
                key={c.name}
                className="flex items-start gap-3 rounded-md bg-surface-2/50 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">{c.name}</p>
                  <p className="text-mini text-text-muted">{c.desc}</p>
                </div>
                <span className="font-mono-data shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-micro text-primary">
                  {c.metric}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle className="mb-3">Rail Data & Interchange Standards</SectionTitle>
          <div className="space-y-2.5">
            {DATA_STANDARDS.map((s) => (
              <div key={s.code} className="text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    <span className="font-mono-data text-primary">{s.code}</span> · {s.name}
                  </span>
                  <span className="font-mono-data text-mini text-text-secondary">
                    {s.adoptionPct}%
                  </span>
                </div>
                <p className="mb-1 text-mini text-text-muted">
                  {s.body} — {s.scope}
                </p>
                <div className="h-1 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${s.adoptionPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
