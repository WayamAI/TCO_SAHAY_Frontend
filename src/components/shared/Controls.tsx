interface SliderRowProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  display: string;
  onChange: (v: number) => void;
}

export function SliderRow({ label, min, max, step = 1, value, display, onChange }: SliderRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-text-secondary">{label}</span>
        <span className="font-mono-data text-primary tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

export function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between py-1 text-xs"
    >
      <span className="font-medium text-text-secondary">{label}</span>
      <span
        className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${
          value ? "bg-primary" : "bg-surface-3"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-transform duration-200 ${
            value ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
