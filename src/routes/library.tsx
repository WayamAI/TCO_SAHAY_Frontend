import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, Wrench, ShieldCheck, AlertTriangle, PiggyBank } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/shared/GlassCard";
import { KPICard } from "@/components/shared/KPICard";
import { COMPONENTS, CHART_COLORS } from "@/data/syntheticData";
import type { MaintIntervalUnit, Part } from "@/data/bomData";
import { usePartsStore, type NewPartInput } from "@/store/partsStore";
import { fmtUSD, fmtCompact } from "@/utils/formatters";
import { fleetTCO, partTCO, formatInterval, DEFAULT_DUTY } from "@/utils/tcoEngine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Maintenance Library | Locomotive Wayam Intelligence" },
      {
        name: "description",
        content:
          "Reusable part-level maintenance library — interval, quantity, price, warranty and failure probability driving every TCO calculation.",
      },
    ],
  }),
  component: MaintenanceLibrary,
});

const HORIZON = 20;
const INTERVAL_UNITS: MaintIntervalUnit[] = ["hrs", "km", "months"];

const EMPTY_FORM: NewPartInput = {
  name: "",
  componentId: COMPONENTS[0].id,
  maintIntervalValue: 500,
  maintIntervalUnit: "hrs",
  maintQty: 1,
  uom: "ea",
  unitPriceNew: 0,
  warrantyYears: 2,
  warrantyKm: 480000,
  failureProbabilityPct: 10,
};

function MaintenanceLibrary() {
  const { parts, laborPct, addPart, updatePart, removePart, setLaborPct } = usePartsStore();
  const [componentId, setComponentId] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewPartInput>(EMPTY_FORM);

  const visible = useMemo(
    () => (componentId === "all" ? parts : parts.filter((p) => p.componentId === componentId)),
    [parts, componentId],
  );

  // Roll-up for the selection currently on screen.
  const totals = useMemo(() => fleetTCO(visible, HORIZON, laborPct), [visible, laborPct]);
  const avgPerPart = visible.length > 0 ? totals.totalCost / visible.length : 0;

  const submit = () => {
    if (!form.name.trim() || form.unitPriceNew <= 0) return;
    addPart(form);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      {/* Roll-up */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label={`Overall TCO (${HORIZON}yr)`}
          value={totals.totalCost / 1e6}
          prefix="$"
          suffix="M"
          decimals={2}
          glow="blue"
          sub={<span>{visible.length} parts in library</span>}
        />
        <KPICard
          label="Average TCO / Part"
          value={avgPerPart / 1e3}
          prefix="$"
          suffix="k"
          decimals={1}
          glow="teal"
          sub={<span>{fmtCompact(totals.avgAnnualCost)}/yr across selection</span>}
        />
        <KPICard
          label="Labour Charge"
          value={totals.laborCost / 1e3}
          prefix="$"
          suffix="k"
          decimals={1}
          glow="purple"
          sub={<span>Auto-calculated at {laborPct}% of parts</span>}
        />
        <KPICard
          label="Company Buffer"
          value={totals.buffer / 1e3}
          prefix="$"
          suffix="k"
          decimals={1}
          glow="orange"
          sub={<span>Warranty reserve held against failures</span>}
        />
      </div>

      {/* Component selector + add */}
      <GlassCard className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <SectionTitle className="mr-2">Select Component</SectionTitle>
          <select
            value={componentId}
            onChange={(e) => setComponentId(e.target.value)}
            className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs outline-none focus:border-primary/50"
          >
            <option value="all">All components ({parts.length} parts)</option>
            {COMPONENTS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({parts.filter((p) => p.componentId === c.id).length})
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="ml-auto flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <Plus size={14} /> Add Part
          </button>
        </div>

        {showForm && (
          <div className="grid gap-3 rounded-lg border border-primary/25 bg-surface-2/60 p-3 md:grid-cols-3 xl:grid-cols-5">
            <Field label="Part Name">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Engine Oil"
                className={inputCls}
              />
            </Field>
            <Field label="Component">
              <select
                value={form.componentId}
                onChange={(e) => setForm({ ...form, componentId: e.target.value })}
                className={inputCls}
              >
                {COMPONENTS.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Maintenance Interval">
              <div className="flex gap-1">
                <input
                  type="number"
                  value={form.maintIntervalValue}
                  onChange={(e) => setForm({ ...form, maintIntervalValue: Number(e.target.value) })}
                  className={inputCls}
                />
                <select
                  value={form.maintIntervalUnit}
                  onChange={(e) => setForm({ ...form, maintIntervalUnit: e.target.value as MaintIntervalUnit })}
                  className={cn(inputCls, "w-20")}
                >
                  {INTERVAL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                value={form.maintQty}
                onChange={(e) => setForm({ ...form, maintQty: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
            <Field label="Unit">
              <input
                value={form.uom}
                onChange={(e) => setForm({ ...form, uom: e.target.value })}
                placeholder="L / ea / set"
                className={inputCls}
              />
            </Field>
            <Field label="Price (per unit)">
              <input
                type="number"
                value={form.unitPriceNew}
                onChange={(e) => setForm({ ...form, unitPriceNew: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
            <Field label="Warranty (Years)">
              <input
                type="number"
                step="0.5"
                value={form.warrantyYears}
                onChange={(e) => setForm({ ...form, warrantyYears: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
            <Field label="Warranty (Km)">
              <input
                type="number"
                value={form.warrantyKm}
                onChange={(e) => setForm({ ...form, warrantyKm: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
            <Field label="Failure Probability %">
              <input
                type="number"
                value={form.failureProbabilityPct}
                onChange={(e) => setForm({ ...form, failureProbabilityPct: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
            <div className="flex items-end gap-2">
              <button
                onClick={submit}
                disabled={!form.name.trim() || form.unitPriceNew <= 0}
                className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
              >
                Save Part
              </button>
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-text-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Library table */}
      <GlassCard>
        <SectionTitle className="mb-3 flex items-center gap-1.5">
          <Wrench size={13} /> Maintenance Library — every value below is editable and drives the TCO
        </SectionTitle>
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-surface-1">
              <tr className="border-b border-border text-[9px] uppercase tracking-wider text-text-muted">
                {["Part", "Interval", "Qty", "Unit", "Price", "Warr. Yrs", "Warr. Km", "Fail %", `TCO ${HORIZON}yr`, "Avg/yr", "Buffer", ""].map((h) => (
                  <th key={h} className="px-2 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <LibraryRow key={p.id} part={p} laborPct={laborPct} onChange={updatePart} onRemove={removePart} />
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-2 py-6 text-center text-text-muted">
                    No parts for this component yet — use “Add Part”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Labour charge + full cost */}
      <div className="grid gap-5 xl:grid-cols-3">
        <GlassCard className="xl:col-span-2">
          <SectionTitle className="mb-3">Labour Charge — auto-calculated, never entered by hand</SectionTitle>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">Labour rate</span>
              <input
                type="number"
                value={laborPct}
                min={0}
                max={100}
                onChange={(e) => setLaborPct(Number(e.target.value))}
                className="w-20 rounded-md border border-border bg-surface-2 px-2 py-1 text-right text-xs font-semibold text-primary outline-none focus:border-primary/50"
              />
              <span className="text-xs text-text-secondary">% of parts cost</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              step={0.5}
              value={laborPct}
              onChange={(e) => setLaborPct(Number(e.target.value))}
              className="min-w-[180px] flex-1"
            />
            <button
              onClick={() => setLaborPct(18)}
              className="rounded-md border border-border px-2 py-1 text-[10px] text-text-secondary hover:text-foreground"
            >
              Reset to 18%
            </button>
          </div>

          <div className="font-mono-data mt-4 space-y-1.5 rounded-lg bg-surface-2/70 p-3 text-xs">
            <Row label="Sum of part prices (maintenance)" value={fmtUSD(totals.maintenanceCost)} />
            <Row label={`Labour @ ${laborPct}%`} value={fmtUSD(totals.laborCost)} accent />
            <div className="border-t border-border pt-1.5">
              <Row label="Full cost" value={fmtUSD(totals.totalCost)} bold />
            </div>
          </div>
          <p className="mt-2 text-[10px] text-text-muted">
            Labour Cost = Sum(Part Prices) × {laborPct}% — applied to every maintenance occurrence.
          </p>
        </GlassCard>

        <GlassCard>
          <SectionTitle className="mb-3">Customer vs Organization</SectionTitle>
          <div className="space-y-2.5">
            <SplitRow
              icon={<Wrench size={13} />}
              label="Customer TCO"
              hint="Excludes warranty-covered failures"
              value={totals.customerTCO}
              color={CHART_COLORS.teal}
            />
            <SplitRow
              icon={<ShieldCheck size={13} />}
              label="Warranty covered"
              hint="Paid by the organization"
              value={totals.warrantyCoveredCost}
              color={CHART_COLORS.blue}
            />
            <SplitRow
              icon={<PiggyBank size={13} />}
              label="Company buffer"
              hint="Part cost × failure probability"
              value={totals.buffer}
              color={CHART_COLORS.orange}
            />
            <div className="border-t border-border pt-2.5">
              <SplitRow
                icon={<AlertTriangle size={13} />}
                label="Organization TCO"
                hint="Warranty replacement + reserve"
                value={totals.organizationTCO}
                color={CHART_COLORS.purple}
                bold
              />
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-surface-1 px-2 py-1.5 text-xs outline-none placeholder:text-text-muted focus:border-primary/50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-wider text-text-muted">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value, accent, bold }: { label: string; value: string; accent?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-secondary">{label}</span>
      <span className={cn("tabular-nums", accent && "text-primary", bold && "font-bold text-foreground")}>{value}</span>
    </div>
  );
}

function SplitRow({
  icon, label, hint, value, color, bold,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  value: number;
  color: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0" style={{ color }}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-xs", bold ? "font-bold text-foreground" : "text-text-secondary")}>{label}</p>
        <p className="text-[10px] text-text-muted">{hint}</p>
      </div>
      <span className={cn("font-mono-data shrink-0 text-sm tabular-nums", bold && "font-bold")} style={{ color }}>
        {fmtCompact(value)}
      </span>
    </div>
  );
}

/** One editable library row — edits flow straight into every other page. */
function LibraryRow({
  part, laborPct, onChange, onRemove,
}: {
  part: Part;
  laborPct: number;
  onChange: (id: string, patch: Partial<Part>) => void;
  onRemove: (id: string) => void;
}) {
  const tco = partTCO(part, HORIZON, laborPct, DEFAULT_DUTY);
  const isUserPart = part.id.startsWith("prt-user-");

  return (
    <tr className="border-b border-border/40 hover:bg-surface-2/50">
      <td className="px-2 py-1.5">
        <span className="block max-w-[190px] truncate" title={part.name}>{part.name}</span>
        <span className="text-[9px] text-text-muted">{formatInterval(part)} · {part.partClass}</span>
      </td>
      <td className="px-2 py-1.5">
        <div className="flex items-center gap-1">
          <NumCell value={part.maintIntervalValue} onChange={(v) => onChange(part.id, { maintIntervalValue: v })} width="w-16" />
          <select
            value={part.maintIntervalUnit}
            onChange={(e) => onChange(part.id, { maintIntervalUnit: e.target.value as MaintIntervalUnit })}
            className="rounded border border-transparent bg-transparent text-[10px] text-text-secondary hover:border-border focus:border-primary/50"
          >
            {INTERVAL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </td>
      <td className="px-2 py-1.5">
        <NumCell value={part.maintQty} onChange={(v) => onChange(part.id, { maintQty: v })} width="w-12" />
      </td>
      <td className="px-2 py-1.5 text-[10px] text-text-secondary">{part.uom}</td>
      <td className="px-2 py-1.5">
        <NumCell value={part.unitPriceNew} onChange={(v) => onChange(part.id, { unitPriceNew: v })} width="w-20" prefix="$" />
      </td>
      <td className="px-2 py-1.5">
        <NumCell value={part.warrantyYears} step={0.5} onChange={(v) => onChange(part.id, { warrantyYears: v })} width="w-12" />
      </td>
      <td className="px-2 py-1.5">
        <NumCell value={part.warrantyKm} step={10000} onChange={(v) => onChange(part.id, { warrantyKm: v })} width="w-20" />
      </td>
      <td className="px-2 py-1.5">
        <NumCell value={part.failureProbabilityPct} onChange={(v) => onChange(part.id, { failureProbabilityPct: v })} width="w-12" suffix="%" />
      </td>
      <td className="font-mono-data px-2 py-1.5 tabular-nums">{fmtCompact(tco.totalCost)}</td>
      <td className="font-mono-data px-2 py-1.5 tabular-nums text-text-secondary">{fmtCompact(tco.avgAnnualCost)}</td>
      <td className="font-mono-data px-2 py-1.5 tabular-nums text-orange">{fmtCompact(tco.buffer)}</td>
      <td className="px-2 py-1.5">
        {isUserPart && (
          <button onClick={() => onRemove(part.id)} className="text-text-muted transition-colors hover:text-red" title="Remove part">
            <Trash2 size={13} />
          </button>
        )}
      </td>
    </tr>
  );
}

function NumCell({
  value, onChange, width, step = 1, prefix, suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  width: string;
  step?: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <span className="font-mono-data inline-flex items-center text-[11px]">
      {prefix && <span className="text-text-muted">{prefix}</span>}
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "rounded border border-transparent bg-transparent px-1 py-0.5 text-right tabular-nums outline-none hover:border-border focus:border-primary/50 focus:bg-surface-2",
          width,
        )}
      />
      {suffix && <span className="text-text-muted">{suffix}</span>}
    </span>
  );
}
