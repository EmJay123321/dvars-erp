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

export function formatHours(value: number): string {
  return value.toLocaleString("en-GB", { maximumFractionDigits: 2 });
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

/**
 * Splits a month (0-based monthIndex) into weekly date ranges, starting at the
 * 1st and chunking in 7-day blocks, with the final chunk capped at the last
 * day of the month. Returns ISO date pairs (yyyy-mm-dd).
 */
export function weekRangesForMonth(
  year: number,
  monthIndex: number
): { start: string; end: string }[] {
  const ranges: { start: string; end: string }[] = [];
  const lastDay = lastDayOfMonth(year, monthIndex);
  const cursor = new Date(Date.UTC(year, monthIndex, 1));
  while (cursor.getUTCMonth() === monthIndex) {
    const start = cursor.toISOString().slice(0, 10);
    const weekEnd = new Date(cursor);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    if (weekEnd.getUTCMonth() !== monthIndex) {
      weekEnd.setUTCFullYear(year, monthIndex, lastDay);
    }
    ranges.push({ start, end: weekEnd.toISOString().slice(0, 10) });
    cursor.setUTCDate(weekEnd.getUTCDate() + 1);
  }
  return ranges;
}

/* ── Preference-aware formatting ────────────────────────────────── */

import type { DisplayCurrency, DateFormat } from "./types";

/** Fixed exchange rates from GBP (source of truth). */
const EXCHANGE_RATES: Record<DisplayCurrency, number> = {
  GBP: 1,
  USD: 1.27,
  PHP: 71.0,
};

const CURRENCY_SYMBOLS: Record<DisplayCurrency, string> = {
  GBP: "\u00a3",
  USD: "$",
  PHP: "\u20b1",
};

const CURRENCY_LOCALES: Record<DisplayCurrency, string> = {
  GBP: "en-GB",
  USD: "en-US",
  PHP: "en-PH",
};

/** Convert a GBP amount to the user's display currency (for display only). */
export function convertCurrency(amountGBP: number, currency: DisplayCurrency): number {
  return Math.round(amountGBP * EXCHANGE_RATES[currency] * 100) / 100;
}

/** Format a currency value in the user's preferred display currency. */
export function formatCurrencyPref(valueGBP: number, currency: DisplayCurrency): string {
  const converted = convertCurrency(valueGBP, currency);
  return (
    CURRENCY_SYMBOLS[currency] +
    converted.toLocaleString(CURRENCY_LOCALES[currency], {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/** Format an ISO date string according to the user's preferred date format. */
export function formatDatePref(iso: string, format: DateFormat): string {
  const d = new Date(iso);
  if (format === "MM/DD/YYYY") {
    return d.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  }
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Format an ISO datetime string with time, according to the user's preferred date format. */
export function formatDateTimePref(iso: string, format: DateFormat): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const date = formatDatePref(iso, format);
  return `${date}, ${time}`;
}

/** Format a date range according to the user's preferred date format. */
export function formatPeriodPref(startIso: string, endIso: string, format: DateFormat): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const locale = format === "MM/DD/YYYY" ? "en-US" : "en-GB";
  const startDay = start.getUTCDate();
  const startMonth = start.toLocaleDateString(locale, { month: "short" });
  const endDay = end.getUTCDate();
  const endMonth = end.toLocaleDateString(locale, { month: "short" });
  const year = end.getUTCFullYear();
  if (startMonth === endMonth) {
    return `${startDay}\u2013${endDay} ${endMonth} ${year}`;
  }
  return `${startDay} ${startMonth} \u2013 ${endDay} ${endMonth} ${year}`;
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
