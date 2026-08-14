export function formatCurrency(value: number): string {
  return (
    "£" +
    value.toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/** Invoices are billed in USD; amounts render with a $ symbol. */
export function formatUSD(value: number): string {
  return (
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatWhole(value: number): string {
  return "£" + value.toLocaleString("en-GB");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPeriod(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startDay = start.getUTCDate();
  const startMonth = start.toLocaleDateString("en-GB", { month: "short" });
  const endDay = end.getUTCDate();
  const endMonth = end.toLocaleDateString("en-GB", { month: "short" });
  const year = end.getUTCFullYear();
  if (startMonth === endMonth) {
    return `${startDay}–${endDay} ${endMonth} ${year}`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function monthOptions(count = 12): { label: string; value: string }[] {
  const options: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    const value = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    options.push({ label, value });
  }
  return options;
}
