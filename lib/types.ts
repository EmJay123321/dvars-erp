export type Role = "Admin" | "Employee";
export type EmployeeStatus = "Active" | "Terminated" | "Resigned";
export type PayrollStatus = "Pending" | "Paid";
export type InvoiceStatus = "Pending" | "Paid" | "Overdue";
export type DirectoryStatus = "Active" | "Inactive";

export interface Employee {
  id: string;
  name: string;
  email: string;
  password: string; // mock only — never carry this pattern to the backend
  role: Role;
  status: EmployeeStatus;
  department: string;
  createdAt: string; // ISO date
}

export interface EarningsLine {
  label: string;
  amount: number;
}

export interface DeductionLine {
  label: string;
  amount: number;
}

/** One weekly row of the payslip breakdown (date range + hours + earnings). */
export interface PayWeekEntry {
  start: string; // ISO date
  end: string; // ISO date
  hours: number;
  earnings: number;
}

/** A name + role pair used for the payslip's Prepared by / Signed by blocks. */
export interface Signer {
  name: string;
  role: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  gross: number;
  earnings: EarningsLine[];
  deductions: DeductionLine[];
  net: number;
  status: PayrollStatus;
  paidAt: string | null;
  createdAt: string;
  /** Client the employee billed against for the period. */
  clientName?: string;
  /** Client's company, when it differs from the employee's own. */
  companyName?: string;
  /** Weekly rows captured when payroll was run. Absent on legacy records. */
  weeks?: PayWeekEntry[];
  /** Sum of the weekly hours. Absent on legacy records. */
  totalHours?: number;
  /** Person who prepared the payslip. Absent on legacy records. */
  preparedBy?: Signer;
  /** Approver, blank until someone signs off. Absent on legacy records. */
  signedBy?: Signer | null;
}

export type DayPeriod = "AM" | "PM";
export type DiscountType = "percent" | "flat";

export interface InvoiceLineItem {
  label: string;
  qty: number;
  rate: number;
  date?: string; // ISO date (yyyy-mm-dd) of the billed day
  logIn?: string; // 24h "HH:MM"
  logInPeriod?: DayPeriod;
  logOut?: string; // 24h "HH:MM"
  logOutPeriod?: DayPeriod;
}

export type InvoiceYearMode = "issuedAt" | "fixed";

export interface InvoiceNumberSettings {
  /** Text before the number, e.g. "MS". */
  prefix: string;
  /** Text between prefix and number, e.g. " - " renders "MS - 20250064". */
  separator: string;
  /** Whether a year segment is included in the number. */
  yearIncluded: boolean;
  /** Where the year comes from when yearIncluded is true. */
  yearMode: InvoiceYearMode;
  /** Year used when yearMode is "fixed". */
  fixedYear: number;
  /** Number of digits the sequence is padded to (4 => 64 renders as 0064). */
  padding: number;
  /** Last number issued, e.g. "20250064" or "MS - 20250064". */
  lastNumberUsed: string;
  /** Restart the sequence at 1 on the first invoice of a new year. */
  resetEachYear: boolean;
}

/**
 * Global defaults new clients inherit. Everything in `InvoiceNumberSettings`
 * except the per-client running count. Admin overrides per client in the
 * Directory edit form.
 */
export type InvoiceNumberDefaults = Omit<InvoiceNumberSettings, "lastNumberUsed">;

export interface Invoice {
  /** Stable unique id (URL-safe). Use this for routing and lookups. */
  id: string;
  /** Human-readable invoice number, e.g. "MS - 20261001". Legacy records may omit it. */
  number?: string;
  clientName: string;
  clientId?: string;
  vaName?: string;
  vaId?: string;
  vaRole?: string;
  leadManager?: string;
  lineItems: InvoiceLineItem[];
  amount: number;
  discount?: number;
  discountType?: DiscountType;
  issuedAt: string;
  dueAt: string;
  status: InvoiceStatus;
}

export interface Client {
  id: string;
  clientName: string;
  companyName: string;
  leadManagerName: string;
  contactPerson: string;
  email: string;
  phone: string;
  billingAddress: string;
  defaultBillRate: number; // USD
  defaultDiscountPercent: number;
  status: DirectoryStatus;
  notes: string;
  /** Per-client invoice numbering. Null/absent = numbering not set up yet. */
  invoiceNumbering?: InvoiceNumberSettings | null;
  createdAt: string;
  /** ISO timestamp set when the client is soft-deleted. Absent = active record. */
  deletedAt?: string | null;
}

export interface VA {
  id: string;
  vaName: string;
  vaRole: string;
  email: string;
  phone: string;
  assignedClientIds: string[]; // references Client.id list
  payRate: number; // PHP
  billRate: number; // USD
  dateStarted: string; // ISO date
  status: DirectoryStatus;
  notes: string;
  createdAt: string;
  /** ISO timestamp set when the VA is soft-deleted. Absent = active record. */
  deletedAt?: string | null;
}

export interface ActivityLogEntry {
  id: string;
  actor: string;
  description: string;
  createdAt: string;
}

export interface ReportReply {
  id: string;
  author: string;
  role: Role;
  text: string;
  createdAt: string;
}

export interface Report {
  id: string;
  employeeId: string;
  text: string;
  createdAt: string;
  replies: ReportReply[];
}

export interface MonthValue {
  month: string; // label, e.g. "Mar 2026"
  value: number;
}

export interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
}

export interface MonthlyExpense {
  month: string;
  salaries: number;
  software: number;
  marketing: number;
  travel: number;
}
