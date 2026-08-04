const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function fmtUSD(v: number): string {
  return usd.format(v);
}

export function fmtCompact(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function fmtNum(v: number, digits = 0): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(v);
}

export function fmtPct(v: number, digits = 1): string {
  return `${v.toFixed(digits)}%`;
}
