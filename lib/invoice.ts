import type {
  Invoice,
  InvoiceNumberDefaults,
  InvoiceNumberSettings,
} from "./types";

// TODO(backend): move the numbering counters to the PHP/MongoDB backend.
// Every client's running count currently lives in the browser (single user).
// A shared counter has to live server side once more than one person can
// create invoices, because two browsers would otherwise hand out the same
// number. Keep the per-client counters on the client document when that lands.
export const DEFAULT_INVOICE_NUMBERING_DEFAULTS: InvoiceNumberDefaults = {
  prefix: "",
  separator: " - ",
  yearIncluded: true,
  yearMode: "issuedAt",
  fixedYear: new Date().getFullYear(),
  padding: 4,
  resetEachYear: false,
};

/** Build full per-client settings from inherited defaults + a starting number. */
export function makeInvoiceNumbering(
  defaults: InvoiceNumberDefaults,
  lastNumberUsed = ""
): InvoiceNumberSettings {
  return { ...defaults, lastNumberUsed };
}

export interface ParsedInvoiceNumber {
  /** Year parsed from the number, or null when the value carries no year. */
  year: number | null;
  seq: number;
}

/**
 * Parse a value typed by admin or read from an existing invoice number,
 * e.g. "20250064" or "MS - 20250064" or a bare "64". When the year segment is
 * on, the trailing `padding` digits are the sequence and the leading digits
 * are the year.
 */
export function parseInvoiceNumber(
  value: string,
  settings: InvoiceNumberSettings
): ParsedInvoiceNumber | null {
  let raw = value.trim();
  if (!raw) return null;

  const prefix = settings.prefix.trim();
  if (prefix && raw.startsWith(prefix)) {
    raw = raw.slice(prefix.length).trimStart();
  }
  const separator = settings.separator;
  if (separator && raw.includes(separator)) {
    raw = raw.slice(raw.indexOf(separator) + separator.length);
  }
  raw = raw.replace(/[^0-9]/g, "");
  if (!raw) return null;

  const padding = Math.max(1, settings.padding);
  if (settings.yearIncluded && raw.length > padding) {
    return {
      year: Number(raw.slice(0, raw.length - padding)),
      seq: Number(raw.slice(raw.length - padding)),
    };
  }
  return { year: null, seq: Number(raw) };
}

export function formatInvoiceNumber(
  settings: InvoiceNumberDefaults,
  year: number | null,
  seq: number
): string {
  const yearPart =
    settings.yearIncluded && year != null ? String(year) : "";
  const seqPart = String(Math.max(1, seq)).padStart(
    Math.max(1, settings.padding),
    "0"
  );
  return `${settings.prefix.trim()}${settings.separator}${yearPart}${seqPart}`;
}

export function resolveInvoiceYear(
  settings: InvoiceNumberDefaults,
  issuedAt: string
): number | null {
  if (!settings.yearIncluded) return null;
  if (settings.yearMode === "fixed") {
    return settings.fixedYear || new Date().getFullYear();
  }
  const date = new Date(issuedAt);
  return Number.isNaN(date.getTime())
    ? new Date().getFullYear()
    : date.getFullYear();
}

/** The next number to use for an invoice issued at `issuedAt`, per the settings. */
export function nextInvoiceNumber(
  settings: InvoiceNumberSettings,
  issuedAt: string
): string {
  const year = resolveInvoiceYear(settings, issuedAt);
  const last = parseInvoiceNumber(settings.lastNumberUsed, settings);

  let seq = 1;
  if (last) {
    const reset =
      settings.resetEachYear &&
      settings.yearIncluded &&
      last.year != null &&
      last.year !== year;
    seq = reset ? 1 : last.seq + 1;
  }
  return formatInvoiceNumber(settings, year, seq);
}

/**
 * Highest sequence already used in the app. When `year` is given, only
 * invoices matching that year are considered (per-year series). When null,
 * every invoice with a parseable number is considered.
 */
export function highestUsedSequence(
  settings: InvoiceNumberSettings,
  invoices: Invoice[],
  year: number | null
): number {
  let max = 0;
  for (const inv of invoices) {
    if (!inv.number) continue;
    const parsed = parseInvoiceNumber(inv.number, settings);
    if (!parsed) continue;
    if (year != null && parsed.year !== year) continue;
    max = Math.max(max, parsed.seq);
  }
  return max;
}

export interface ClientIdentity {
  id?: string;
  clientName: string;
}

/** Invoices belonging to a client, matched by id first then by name. */
export function invoicesForClient(
  invoices: Invoice[],
  client: ClientIdentity
): Invoice[] {
  return invoices.filter(
    (inv) =>
      inv.clientId === client.id ||
      (inv.clientId == null && inv.clientName === client.clientName)
  );
}

/**
 * Highest sequence already used by a single client. Unlike the global
 * `highestUsedSequence`, only invoices for `client` are considered — two
 * clients may share a prefix and keep independent sequences.
 */
export function highestUsedSequenceForClient(
  settings: InvoiceNumberSettings,
  invoices: Invoice[],
  client: ClientIdentity,
  year: number | null
): number {
  return highestUsedSequence(settings, invoicesForClient(invoices, client), year);
}

/** Compare invoice numbers ignoring whitespace ("MS - 20250065" === "MS-20250065"). */
export function normalizeInvoiceNumber(value: string): string {
  return value.replace(/[\s\u00a0]+/g, "");
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mondayOf(weeksAgo: number): Date {
  const now = new Date();
  const sinceMonday = (now.getDay() + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - sinceMonday - weeksAgo * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function weekDates(weeksAgo: number): string[] {
  const monday = mondayOf(weeksAgo);
  return Array.from({ length: 5 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(day.getDate() + i);
    return toISODate(day);
  });
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatWeekRangeLabel(dates: string[]): string {
  if (dates.length === 0) return "";
  const start = new Date(`${dates[0]}T00:00:00`);
  const end = new Date(`${dates[dates.length - 1]}T00:00:00`);
  const startMonth = MONTHS[start.getMonth()];
  const endMonth = MONTHS[end.getMonth()];
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
}

export function formatDayLabel(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
