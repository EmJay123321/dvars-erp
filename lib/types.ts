export type Role = "Admin" | "Sub-admin" | "Employee";
export type EmployeeStatus = "Active" | "Terminated" | "Resigned" | "Invited" | "Pending";

/* ── Permissions ─────────────────────────────────────────────────── */

export type PermissionAction = "view" | "add" | "edit" | "delete";

export interface ModulePermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export const MODULE_KEYS = [
  "dashboard",
  "payroll",
  "invoices",
  "directory",
  "reports",
  "systemReport",
  "activityLog",
  "vacationLeaves",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  payroll: "Payroll & Payslips",
  invoices: "Invoices",
  directory: "Directory",
  reports: "Financial Reports",
  systemReport: "System Report",
  activityLog: "Activity Log",
  vacationLeaves: "Vacation & Leaves",
};

export type PermissionsMap = Record<ModuleKey, ModulePermissions>;

export const EMPTY_PERMISSIONS: PermissionsMap = {
  dashboard: { view: false, add: false, edit: false, delete: false },
  payroll: { view: false, add: false, edit: false, delete: false },
  invoices: { view: false, add: false, edit: false, delete: false },
  directory: { view: false, add: false, edit: false, delete: false },
  reports: { view: false, add: false, edit: false, delete: false },
  systemReport: { view: false, add: false, edit: false, delete: false },
  activityLog: { view: false, add: false, edit: false, delete: false },
  vacationLeaves: { view: false, add: false, edit: false, delete: false },
};
/* ── User Preferences ───────────────────────────────────────────── */

export type DisplayCurrency = "GBP" | "USD" | "PHP";
export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY";

export interface UserNotifications {
  invoiceOverdue: boolean;
  payrollRunCompleted: boolean;
  systemReportReply: boolean;
}

export interface UserPreferences {
  displayCurrency: DisplayCurrency;
  dateFormat: DateFormat;
  notifications: UserNotifications;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  displayCurrency: "GBP",
  dateFormat: "DD/MM/YYYY",
  notifications: {
    invoiceOverdue: true,
    payrollRunCompleted: true,
    systemReportReply: true,
  },
};

export type PayrollStatus = "Pending" | "Paid";
export type InvoiceStatus = "Pending" | "Paid" | "Overdue";
export type DirectoryStatus = "Active" | "Inactive";

/* ── Vacation & Leaves ─────────────────────────────────────────── */

export type LeaveType = "Vacation Leave" | "Sick Leave" | "Emergency Leave" | "Unpaid Leave";

export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  dateFrom: string;
  dateTo: string;
  totalDays: number;
  reason: string;
  attachments: string[];
  notifyUsers: string[];
  status: LeaveStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface LeavePolicy {
  leaveType: LeaveType;
  annualCredits: number;
  carryOver: boolean;
}

export const DEFAULT_LEAVE_POLICIES: LeavePolicy[] = [
  { leaveType: "Vacation Leave", annualCredits: 15, carryOver: false },
  { leaveType: "Sick Leave", annualCredits: 10, carryOver: false },
  { leaveType: "Emergency Leave", annualCredits: 5, carryOver: false },
  { leaveType: "Unpaid Leave", annualCredits: 0, carryOver: false },
];

export function calcBusinessDays(from: string, to: string): number {
  const start = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");
  if (end < start) return 0;
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) count++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  password: string; // mock only — never carry this pattern to the backend
  role: Role;
  status: EmployeeStatus;
  department: string;
  createdAt: string; // ISO date
  /** Token for the invite link. Present when status is "Invited". */
  inviteToken?: string;
  /** Expiry time for the invite link. Present when status is "Invited". */
  inviteExpiresAt?: string;
  /** When true, user must set a new password before accessing the dashboard. */
  mustChangePassword?: boolean;
  /** Linked VA directory record id. */
  vaId?: string;
  /** When true, this employee is always shown in Team & Permissions regardless of role. */
  pinnedInTeamPermissions?: boolean;
  /** Granular module permissions for Sub-admin users. Absent = no access (Sub-admin) or full access (Admin). */
  permissions?: PermissionsMap;
  /** User preferences (currency, date format, notifications). Falls back to defaults when absent. */
  preferences?: UserPreferences;
  /** ISO timestamp of the last password change. Absent if never changed via the profile flow. */
  passwordChangedAt?: string;
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
  leadManagerId: string;
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
