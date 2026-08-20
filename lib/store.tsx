"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type {
  ActivityLogEntry,
  Client,
  DirectoryStatus,
  DiscountType,
  Employee,
  EmployeeStatus,
  Invoice,
  InvoiceNumberDefaults,
  InvoiceNumberSettings,
  InvoiceStatus,
  LeavePolicy,
  LeaveRequest,
  LeaveType,
  ModuleKey,
  ModulePermissions,
  PayrollRecord,
  PayrollStatus,
  PermissionsMap,
  Report,
  Role,
  Signer,
  UserPreferences,
  VA,
} from "./types";
import { MODULE_KEYS, MODULE_LABELS, EMPTY_PERMISSIONS, DEFAULT_LEAVE_POLICIES } from "./types";
import {
  initialActivity,
  initialClients,
  initialEmployees,
  initialInvoices,
  initialLeaveRequests,
  initialPayroll,
  initialReports,
  initialVAs,
  salaryByEmployeeId,
} from "./mock";
import { lastDayOfMonth, uid } from "./format";
import { hashPassword, verifyPassword } from "./auth";
import { sendInviteEmail } from "./invite-email";
import {
  DEFAULT_INVOICE_NUMBERING_DEFAULTS,
  invoicesForClient,
  nextInvoiceNumber,
  normalizeInvoiceNumber,
} from "./invoice";

const SESSION_KEY = "pathways-erp-session";
const DIRECTORY_KEY = "pathways-erp-directory";
const DIRECTORY_DATA_VERSION = "pathways-erp-directory-data-v2";
const EMPLOYEES_KEY = "pathways-erp-employees";
const INVOICES_KEY = "pathways-erp-invoices";
const PAYROLL_KEY = "pathways-erp-payroll";
const LEAVES_KEY = "pathways-erp-leaves";
const LEAVE_POLICIES_KEY = "pathways-erp-leave-policies";
// TODO(backend): the per-client numbering counters must move to the
// PHP/MongoDB backend. They live on each client record in localStorage now
// (single browser), but a shared counter has to be server side once more than
// one person can create invoices, otherwise two browsers would hand out the
// same number.
const INVOICE_NUMBERING_KEY = "pathways-erp-invoice-numbering";

function readInvoiceNumbering(): InvoiceNumberDefaults | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(INVOICE_NUMBERING_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<InvoiceNumberSettings>;
      // Legacy payloads carried the old shared lastNumberUsed — defaults don't
      // have one, so drop it.
      const { lastNumberUsed: _legacy, ...rest } = parsed;
      return { ...DEFAULT_INVOICE_NUMBERING_DEFAULTS, ...rest };
    }
  } catch {
    // ignore corrupted storage
  }
  return null;
}

function readInvoices(): Invoice[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(INVOICES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Invoice[];
      return Array.isArray(parsed) ? parsed : null;
    }
  } catch {
    // ignore corrupted storage
  }
  return null;
}

function readPayroll(): PayrollRecord[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PAYROLL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PayrollRecord[];
      return Array.isArray(parsed) ? parsed : null;
    }
  } catch {
    // ignore corrupted storage
  }
  return null;
}

function readDirectory(): { clients: Client[]; vas: VA[] } | null {
  if (typeof window === "undefined") return null;
  try {
    if (window.localStorage.getItem(DIRECTORY_DATA_VERSION) !== "2") {
      // One-time cleanup: drop any directory records saved under the old key
      // (the seeded demo clients/VAs) so they never reappear after this update.
      window.localStorage.removeItem(DIRECTORY_KEY);
      window.localStorage.setItem(DIRECTORY_DATA_VERSION, "2");
    }
    const raw = window.localStorage.getItem(DIRECTORY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        clients: Client[];
        vas: VA[];
      };
      const vas = (parsed.vas ?? []).map((v) =>
        Array.isArray((v as VA).assignedClientIds)
          ? v
          : {
              ...v,
              assignedClientIds: (v as VA & { assignedClientId: string | null })
                .assignedClientId
                ? [
                    (v as VA & { assignedClientId: string | null })
                      .assignedClientId as string,
                  ]
                : [],
            }
      );
      // Migrate clients: convert old free-text leadManagerName to leadManagerId
      const clients = (parsed.clients ?? []).map((c) => {
        const client = c as Client & { leadManagerName?: string };
        if (client.leadManagerId !== undefined) return c;
        const oldName = client.leadManagerName ?? "";
        if (!oldName) return { ...c, leadManagerId: "" };
        const matched = vas.find(
          (v) =>
            v.vaName.toLowerCase() === oldName.toLowerCase() && !v.deletedAt
        );
        return { ...c, leadManagerId: matched?.id ?? "" };
      });
      return { clients, vas };
    }
  } catch {
    // ignore corrupted storage
  }
  return null;
}

function readEmployees(): Employee[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(EMPLOYEES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Employee[];
      return Array.isArray(parsed) ? parsed : null;
    }
  } catch {
    // ignore corrupted storage
  }
  return null;
}

function readLeaveRequests(): LeaveRequest[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEAVES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LeaveRequest[];
      return Array.isArray(parsed) ? parsed : null;
    }
  } catch {
    // ignore corrupted storage
  }
  return null;
}

function readLeavePolicies(): LeavePolicy[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEAVE_POLICIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LeavePolicy[];
      return Array.isArray(parsed) ? parsed : null;
    }
  } catch {
    // ignore corrupted storage
  }
  return null;
}

const sessionListeners = new Set<() => void>();

function notifySession() {
  sessionListeners.forEach((listener) => listener());
}

function readSession(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

function subscribeSession(listener: () => void) {
  sessionListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    sessionListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export interface NewPayrollInput {
  employeeId: string;
  monthValue: string; // "YYYY-MM"
  weeks: { start: string; end: string; hours: number; earnings: number }[];
  status: PayrollStatus;
  clientName?: string;
  companyName?: string;
  preparedBy: Signer;
  signedBy?: Signer | null;
}

export interface NewInvoiceInput {
  clientName: string;
  clientId?: string;
  vaName?: string;
  vaId?: string;
  vaRole?: string;
  leadManager?: string;
  lineItems: { label: string; qty: number; rate: number }[];
  issuedAt: string;
  dueAt: string;
  discount?: number;
  discountType?: DiscountType;
}

export interface NewClientInput {
  clientName: string;
  companyName?: string;
  leadManagerId?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  billingAddress?: string;
  defaultBillRate: number;
  defaultDiscountPercent?: number;
  status?: DirectoryStatus;
  notes?: string;
  invoiceNumbering?: InvoiceNumberSettings | null;
}

export interface NewVAInput {
  vaName: string;
  vaRole?: string;
  email?: string;
  phone?: string;
  assignedClientIds?: string[];
  payRate: number;
  billRate: number;
  dateStarted?: string;
  status?: DirectoryStatus;
  notes?: string;
}

export type ClientPatch = Partial<NewClientInput>;
export type VAPatch = Partial<NewVAInput>;

export interface SignInResult {
  ok: boolean;
  error?: string;
  mustChangePassword?: boolean;
}

export interface AddInvoiceResult {
  ok: boolean;
  error?: string;
  number?: string;
}

interface DataContextValue {
  currentUser: Employee | null;
  employees: Employee[];
  /** Employees visible in Team & Permissions: Admin, Sub-admin, or pinned. */
  teamPermissionsEmployees: Employee[];
  payroll: PayrollRecord[];
  invoices: Invoice[];
  clients: Client[];
  vas: VA[];
  activity: ActivityLogEntry[];
  reports: Report[];
  invoiceNumberingDefaults: InvoiceNumberDefaults;
  leaveRequests: LeaveRequest[];
  leavePolicies: LeavePolicy[];
  signIn: (email: string, password: string) => SignInResult;
  signOut: () => void;
  setNewPassword: (newPassword: string) => { ok: boolean; error?: string };
  addPayroll: (input: NewPayrollInput) => PayrollRecord;
  markInvoicePaid: (id: string) => void;
  markPayrollPaid: (id: string) => void;
  addInvoice: (input: NewInvoiceInput) => AddInvoiceResult;
  saveInvoiceNumberingDefaults: (defaults: InvoiceNumberDefaults) => void;
  updateEmployeeStatus: (id: string, status: EmployeeStatus) => void;
  deleteEmployee: (id: string) => void;
  addEmployee: (input: { name: string; email: string; role: Role; department: string }) => {
    employee: Employee;
    inviteLink: string;
  };
  addVAEmployee: (input: {
    name: string;
    email: string;
    department: string;
    vaId: string;
    tempPassword: string;
  }) => Employee;
  addReport: (text: string) => void;
  addReply: (reportId: string, text: string) => void;
  logActivity: (description: string) => void;
  addClient: (input: NewClientInput) => Client;
  updateClient: (id: string, patch: ClientPatch) => void;
  setClientStatus: (id: string, status: DirectoryStatus) => void;
  deleteClient: (id: string) => Client | null;
  restoreClient: (record: Client) => void;
  addVA: (input: NewVAInput) => VA;
  updateVA: (id: string, patch: VAPatch) => void;
  setVAStatus: (id: string, status: DirectoryStatus) => void;
  deleteVA: (id: string) => VA | null;
  restoreVA: (record: VA) => void;
  hasPermission: (module: ModuleKey, action: import("./types").PermissionAction) => boolean;
  updateSubAdminPermissions: (employeeId: string, permissions: PermissionsMap) => void;
  createSubAdmin: (input: { name: string; email: string; department: string; password: string }) => Employee;
  getFirstAccessiblePath: () => string;
  updateUserPreferences: (prefs: UserPreferences) => void;
  changePassword: (currentPassword: string, newPassword: string) => { ok: boolean; error?: string };
  updateCurrentUserProfile: (patch: { name?: string; email?: string }) => { ok: boolean; error?: string };
  requestLeave: (input: {
    employeeId: string;
    leaveType: LeaveType;
    dateFrom: string;
    dateTo: string;
    totalDays: number;
    reason: string;
    attachments: string[];
    notifyUsers: string[];
  }) => void;
  cancelLeave: (id: string) => void;
  approveLeave: (id: string, comment?: string) => void;
  rejectLeave: (id: string, reason: string) => void;
  updateLeavePolicies: (policies: LeavePolicy[]) => void;
  getLeaveBalance: (employeeId: string) => Record<LeaveType, { used: number; remaining: number }>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(() => readEmployees() ?? initialEmployees);
  const [payroll, setPayroll] = useState<PayrollRecord[]>(() => readPayroll() ?? initialPayroll);
  const [invoices, setInvoices] = useState<Invoice[]>(() => readInvoices() ?? initialInvoices);
  const [activity, setActivity] = useState<ActivityLogEntry[]>(initialActivity);
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(
    () => readLeaveRequests() ?? initialLeaveRequests
  );
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicy[]>(
    () => readLeavePolicies() ?? DEFAULT_LEAVE_POLICIES
  );
  const [invoiceNumberingDefaults, setInvoiceNumberingDefaults] =
    useState<InvoiceNumberDefaults>(
      () => readInvoiceNumbering() ?? DEFAULT_INVOICE_NUMBERING_DEFAULTS
    );

  const storedId = useSyncExternalStore(subscribeSession, readSession, () => null);

  const storedDirectory = readDirectory();
  const [clients, setClients] = useState<Client[]>(
    storedDirectory?.clients ?? initialClients
  );
  const [vas, setVas] = useState<VA[]>(storedDirectory?.vas ?? initialVAs);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        DIRECTORY_KEY,
        JSON.stringify({ clients, vas })
      );
    } catch {
      // storage unavailable — keep in-memory
    }
  }, [clients, vas]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    } catch {
      // storage unavailable — keep in-memory
    }
  }, [invoices]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
    } catch {
      // storage unavailable — keep in-memory
    }
  }, [employees]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PAYROLL_KEY, JSON.stringify(payroll));
    } catch {
      // storage unavailable — keep in-memory
    }
  }, [payroll]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        INVOICE_NUMBERING_KEY,
        JSON.stringify(invoiceNumberingDefaults)
      );
    } catch {
      // storage unavailable — keep in-memory
    }
  }, [invoiceNumberingDefaults]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LEAVES_KEY, JSON.stringify(leaveRequests));
    } catch {
      // storage unavailable — keep in-memory
    }
  }, [leaveRequests]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LEAVE_POLICIES_KEY, JSON.stringify(leavePolicies));
    } catch {
      // storage unavailable — keep in-memory
    }
  }, [leavePolicies]);

  const currentUser = useMemo(() => {
    if (!storedId) return null;
    const found = employees.find((emp) => emp.id === storedId);
    // Allow Active and Pending users — Pending users need access to set their password.
    if (!found || (found.status !== "Active" && found.status !== "Pending")) return null;
    // If the employee is linked to a VA that was removed from Directory, block access.
    if (found.vaId && !vas.some((v) => v.id === found.vaId && !v.deletedAt)) return null;
    return found;
  }, [employees, storedId, vas]);

  const teamPermissionsEmployees = useMemo(
    () =>
      employees.filter(
        (e) =>
          e.role === "Admin" ||
          e.role === "Sub-admin" ||
          e.pinnedInTeamPermissions === true
      ),
    [employees]
  );

  const signIn = useCallback(
    (email: string, password: string): SignInResult => {
      const found = employees.find(
        (emp) => emp.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (!found || !verifyPassword(password, found.password)) {
        return { ok: false, error: "Invalid email or password." };
      }
      if (found.status !== "Active" && found.status !== "Pending") {
        return { ok: false, error: "This account is not active. Contact your administrator." };
      }
      // If the employee is linked to a VA that was removed from Directory, block login.
      if (found.vaId && !vas.some((v) => v.id === found.vaId && !v.deletedAt)) {
        return { ok: false, error: "This account is no longer active. Contact your administrator." };
      }
      if (found.mustChangePassword) {
        // Still log them in so they can set a new password, but flag it.
        window.localStorage.setItem(SESSION_KEY, found.id);
        notifySession();
        return { ok: true, mustChangePassword: true };
      }
      window.localStorage.setItem(SESSION_KEY, found.id);
      notifySession();
      return { ok: true };
    },
    [employees, vas]
  );

  const signOut = useCallback(() => {
    window.localStorage.removeItem(SESSION_KEY);
    notifySession();
  }, []);

  const logActivity = useCallback(
    (description: string) => {
      setActivity((prev) => [
        {
          id: uid(),
          actor: currentUser?.name ?? "System",
          description,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [currentUser]
  );

  const setNewPassword = useCallback(
    (newPassword: string): { ok: boolean; error?: string } => {
      const storedId = readSession();
      if (!storedId) {
        return { ok: false, error: "No active session." };
      }
      if (newPassword.length < 6) {
        return { ok: false, error: "Password must be at least 6 characters." };
      }
      let foundEmployee: Employee | undefined;
      setEmployees((prev) =>
        prev.map((emp) => {
          if (emp.id !== storedId) return emp;
          foundEmployee = emp;
          return {
            ...emp,
            password: hashPassword(newPassword),
            mustChangePassword: false,
            status: "Active" as EmployeeStatus,
          };
        })
      );
      if (foundEmployee) {
        logActivity(`${foundEmployee.name} set their password and activated their account`);
      }
      return { ok: true };
    },
    [logActivity]
  );

  const addPayroll = useCallback(
    (input: NewPayrollInput): PayrollRecord => {
      const [year, month] = input.monthValue.split("-").map(Number);
      const start = new Date(Date.UTC(year, month - 1, 1));
      const end = new Date(Date.UTC(year, month - 1, lastDayOfMonth(year, month - 1)));
      const gross = input.weeks.reduce((sum, week) => sum + week.earnings, 0);
      const totalHours = input.weeks.reduce((sum, week) => sum + week.hours, 0);
      const tax = Math.round(gross * 0.2);
      const ni = Math.round(gross * 0.12);
      const pension = Math.round(gross * 0.05);
      const net = gross - tax - ni - pension;
      const record: PayrollRecord = {
        id: uid(),
        employeeId: input.employeeId,
        periodStart: start.toISOString().slice(0, 10),
        periodEnd: end.toISOString().slice(0, 10),
        gross,
        totalHours,
        weeks: input.weeks,
        earnings: [{ label: "Base salary", amount: gross }],
        deductions: [
          { label: "Income tax", amount: tax },
          { label: "National Insurance", amount: ni },
          { label: "Pension (5%)", amount: pension },
        ],
        net,
        status: input.status,
        paidAt: input.status === "Paid" ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        clientName: input.clientName,
        companyName: input.companyName,
        preparedBy: input.preparedBy,
        signedBy: input.signedBy,
      };
      setPayroll((prev) => [record, ...prev]);
      const employee = employees.find((emp) => emp.id === input.employeeId);
      logActivity(`Ran payroll for ${employee?.name ?? "employee"} — ${input.monthValue}`);
      return record;
    },
    [employees, logActivity]
  );

  const markInvoicePaid = useCallback(
    (id: string) => {
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: "Paid" as InvoiceStatus } : inv))
      );
      const invoice = invoices.find((inv) => inv.id === id);
      logActivity(
        `Marked ${invoice?.number ?? id} (${invoice?.clientName ?? "invoice"}) as paid`
      );
    },
    [invoices, logActivity]
  );

  const markPayrollPaid = useCallback(
    (id: string) => {
      setPayroll((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: "Paid" as PayrollStatus, paidAt: new Date().toISOString() }
            : p
        )
      );
      const record = payroll.find((p) => p.id === id);
      const employee = employees.find((e) => e.id === record?.employeeId);
      logActivity(
        `Marked payslip for ${employee?.name ?? "employee"} (${record?.periodStart ?? id}) as paid`
      );
    },
    [payroll, employees, logActivity]
  );

  const addInvoice = useCallback(
    (input: NewInvoiceInput): AddInvoiceResult => {
      const client =
        clients.find((c) =>
          input.clientId
            ? c.id === input.clientId
            : c.clientName === input.clientName
        ) ?? null;
      if (!client) {
        return {
          ok: false,
          error: `Could not find the client "${input.clientName}". Add them in Directory first.`,
        };
      }
      const settings = client.invoiceNumbering ?? null;
      if (!settings || !settings.prefix.trim()) {
        return {
          ok: false,
          error:
            `${client.clientName} has no invoice numbering set up yet. ` +
            "Open Directory → Edit client and set their invoice prefix and last number used before creating an invoice.",
        };
      }
      const number = nextInvoiceNumber(settings, input.issuedAt);
      const normalized = normalizeInvoiceNumber(number);
      const duplicate = invoicesForClient(invoices, client).find(
        (inv) =>
          inv.number &&
          normalizeInvoiceNumber(inv.number) === normalized
      );
      if (duplicate) {
        return {
          ok: false,
          error:
            `Invoice number ${number} is already used on ${duplicate.clientName}. ` +
            "Edit this client's numbering in Directory and set the last number used above the highest issued.",
        };
      }
      const amount = input.lineItems.reduce((sum, item) => sum + item.qty * item.rate, 0);
      const invoice: Invoice = {
        id: uid(),
        number,
        clientName: input.clientName,
        clientId: input.clientId,
        vaName: input.vaName,
        vaId: input.vaId,
        vaRole: input.vaRole,
        leadManager: input.leadManager,
        lineItems: input.lineItems,
        amount,
        discount: input.discount,
        discountType: input.discountType,
        issuedAt: input.issuedAt,
        dueAt: input.dueAt,
        status: "Pending",
      };
      setInvoices((prev) => [invoice, ...prev]);
      setClients((prev) =>
        prev.map((c) =>
          c.id === client.id
            ? {
                ...c,
                invoiceNumbering: {
                  ...(c.invoiceNumbering ?? settings),
                  lastNumberUsed: number,
                },
              }
            : c
        )
      );
      logActivity(`Created invoice ${invoice.number ?? invoice.id} for ${input.clientName}`);
      return { ok: true, number };
    },
    [invoices, clients, logActivity]
  );

  const saveInvoiceNumberingDefaults = useCallback(
    (defaults: InvoiceNumberDefaults) => {
      setInvoiceNumberingDefaults(defaults);
      logActivity("Updated invoice numbering defaults");
    },
    [logActivity]
  );

  const addClient = useCallback(
    (input: NewClientInput): Client => {
      const client: Client = {
        id: uid(),
        clientName: input.clientName,
        companyName: input.companyName ?? "",
        leadManagerId: input.leadManagerId ?? "",
        contactPerson: input.contactPerson ?? "",
        email: input.email ?? "",
        phone: input.phone ?? "",
        billingAddress: input.billingAddress ?? "",
        defaultBillRate: input.defaultBillRate,
        defaultDiscountPercent: input.defaultDiscountPercent ?? 0,
        status: input.status ?? "Active",
        notes: input.notes ?? "",
        invoiceNumbering: input.invoiceNumbering ?? null,
        createdAt: new Date().toISOString(),
      };
      setClients((prev) => [client, ...prev]);
      logActivity(`Added client ${client.clientName}`);
      return client;
    },
    [logActivity]
  );

  const updateClient = useCallback(
    (id: string, patch: ClientPatch) => {
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      );
    },
    []
  );

  const setClientStatus = useCallback(
    (id: string, status: DirectoryStatus) => {
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
      const client = clients.find((c) => c.id === id);
      logActivity(`Set client ${client?.clientName ?? id} to ${status}`);
    },
    [clients, logActivity]
  );

  const addVA = useCallback(
    (input: NewVAInput): VA => {
      const va: VA = {
        id: uid(),
        vaName: input.vaName,
        vaRole: input.vaRole ?? "",
        email: input.email ?? "",
        phone: input.phone ?? "",
        assignedClientIds: input.assignedClientIds ?? [],
        payRate: input.payRate,
        billRate: input.billRate,
        dateStarted: input.dateStarted ?? "",
        status: input.status ?? "Active",
        notes: input.notes ?? "",
        createdAt: new Date().toISOString(),
      };
      setVas((prev) => [va, ...prev]);
      logActivity(`Added VA ${va.vaName}`);
      return va;
    },
    [logActivity]
  );

  const updateVA = useCallback(
    (id: string, patch: VAPatch) => {
      setVas((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...patch } : v))
      );
    },
    []
  );

  const setVAStatus = useCallback(
    (id: string, status: DirectoryStatus) => {
      setVas((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status } : v))
      );
      const va = vas.find((v) => v.id === id);
      logActivity(`Set VA ${va?.vaName ?? id} to ${status}`);
    },
    [vas, logActivity]
  );

  const deleteClient = useCallback(
    (id: string): Client | null => {
      const removed = clients.find((c) => c.id === id) ?? null;
      if (removed) {
        setClients((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, deletedAt: new Date().toISOString() } : c
          )
        );
        logActivity(`Deleted client ${removed.clientName}`);
      }
      return removed;
    },
    [clients, logActivity]
  );

  const restoreClient = useCallback(
    (record: Client) => {
      setClients((prev) =>
        prev.some((c) => c.id === record.id)
          ? prev.map((c) =>
              c.id === record.id ? { ...c, deletedAt: null } : c
            )
          : [{ ...record, deletedAt: null }, ...prev]
      );
      logActivity(`Restored client ${record.clientName}`);
    },
    [logActivity]
  );

  const deleteVA = useCallback(
    (id: string): VA | null => {
      const removed = vas.find((v) => v.id === id) ?? null;
      if (removed) {
        setVas((prev) =>
          prev.map((v) =>
            v.id === id ? { ...v, deletedAt: new Date().toISOString() } : v
          )
        );
        logActivity(`Deleted VA ${removed.vaName}`);
      }
      return removed;
    },
    [vas, logActivity]
  );

  const restoreVA = useCallback(
    (record: VA) => {
      setVas((prev) =>
        prev.some((v) => v.id === record.id)
          ? prev.map((v) =>
              v.id === record.id ? { ...v, deletedAt: null } : v
            )
          : [{ ...record, deletedAt: null }, ...prev]
      );
      logActivity(`Restored VA ${record.vaName}`);
    },
    [logActivity]
  );

  /* ── Permission helpers ─────────────────────────────────────────── */

  const hasPermission = useCallback(
    (module: ModuleKey, action: import("./types").PermissionAction): boolean => {
      if (!currentUser) return false;
      if (currentUser.role === "Admin") return true;
      if (currentUser.role === "Sub-admin") {
        const perms = currentUser.permissions;
        if (!perms) return false;
        return perms[module]?.[action] ?? false;
      }
      return false;
    },
    [currentUser]
  );

  const MODULE_ROUTE_ORDER: { module: ModuleKey; path: string }[] = [
    { module: "dashboard", path: "/dashboard" },
    { module: "payroll", path: "/payroll" },
    { module: "invoices", path: "/invoices" },
    { module: "directory", path: "/directory" },
    { module: "reports", path: "/reports" },
    { module: "systemReport", path: "/system-report" },
    { module: "vacationLeaves", path: "/vacation-leaves" },
  ];

  const getFirstAccessiblePath = useCallback((): string => {
    if (!currentUser) return "/login";
    if (currentUser.role === "Admin" || currentUser.role === "Employee") return "/dashboard";
    for (const { module, path } of MODULE_ROUTE_ORDER) {
      if (currentUser.permissions?.[module]?.view) return path;
    }
    return "/no-access";
  }, [currentUser]);

  const updateSubAdminPermissions = useCallback(
    (employeeId: string, newPermissions: PermissionsMap) => {
      if (currentUser?.role !== "Admin") return;
      const target = employees.find((e) => e.id === employeeId);
      if (!target || target.role !== "Sub-admin") return;

      const oldPerms = target.permissions ?? EMPTY_PERMISSIONS;
      const changes: string[] = [];
      for (const mod of MODULE_KEYS) {
        for (const act of ["view", "add", "edit", "delete"] as const) {
          if (oldPerms[mod][act] !== newPermissions[mod][act]) {
            const label = `${MODULE_LABELS[mod]}: ${act}=${newPermissions[mod][act] ? "on" : "off"}`;
            changes.push(label);
          }
        }
      }

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === employeeId ? { ...emp, permissions: newPermissions } : emp
        )
      );

      if (changes.length > 0) {
        logActivity(
          `Updated ${target.name}'s permissions — ${changes.join("; ")}`
        );
      }
    },
    [currentUser, employees, logActivity]
  );

  const createSubAdmin = useCallback(
    (input: { name: string; email: string; department: string; password: string }): Employee => {
      const employee: Employee = {
        id: uid(),
        name: input.name,
        email: input.email,
        password: hashPassword(input.password),
        role: "Sub-admin",
        status: "Active",
        department: input.department,
        createdAt: new Date().toISOString(),
        permissions: { ...EMPTY_PERMISSIONS },
      };
      setEmployees((prev) => [...prev, employee]);
      logActivity(
        `Created Sub-admin account for ${employee.name} (${employee.department})`
      );
      return employee;
    },
    [logActivity]
  );

  const updateUserPreferences = useCallback(
    (prefs: UserPreferences) => {
      const storedId = readSession();
      if (!storedId) return;
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === storedId ? { ...emp, preferences: prefs } : emp
        )
      );
    },
    []
  );

  const changePassword = useCallback(
    (currentPassword: string, newPassword: string): { ok: boolean; error?: string } => {
      const storedId = readSession();
      if (!storedId) return { ok: false, error: "No active session." };
      const user = employees.find((emp) => emp.id === storedId);
      if (!user) return { ok: false, error: "User not found." };
      if (!verifyPassword(currentPassword, user.password)) {
        return { ok: false, error: "Current password is incorrect." };
      }
      if (newPassword.length < 6) {
        return { ok: false, error: "Password must be at least 6 characters." };
      }
      if (currentPassword === newPassword) {
        return { ok: false, error: "New password must be different from the current password." };
      }
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === storedId
            ? { ...emp, password: hashPassword(newPassword), passwordChangedAt: new Date().toISOString() }
            : emp
        )
      );
      logActivity(`${user.name} changed their password`);
      return { ok: true };
    },
    [employees, logActivity]
  );

  const updateCurrentUserProfile = useCallback(
    (patch: { name?: string; email?: string }): { ok: boolean; error?: string } => {
      const storedId = readSession();
      if (!storedId) return { ok: false, error: "No active session." };
      const user = employees.find((emp) => emp.id === storedId);
      if (!user) return { ok: false, error: "User not found." };

      if (patch.email && patch.email !== user.email) {
        const emailTaken = employees.some(
          (emp) => emp.id !== storedId && emp.email.toLowerCase() === patch.email!.toLowerCase()
        );
        if (emailTaken) return { ok: false, error: "This email is already in use." };
      }

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === storedId
            ? { ...emp, ...(patch.name !== undefined && { name: patch.name }), ...(patch.email !== undefined && { email: patch.email }) }
            : emp
        )
      );
      logActivity(`${user.name} updated their profile`);
      return { ok: true };
    },
    [employees, logActivity]
  );

  /* ── Vacation & Leaves ─────────────────────────────────────────── */

  const requestLeave = useCallback(
    (input: {
      employeeId: string;
      leaveType: LeaveType;
      dateFrom: string;
      dateTo: string;
      totalDays: number;
      reason: string;
      attachments: string[];
      notifyUsers: string[];
    }) => {
      const request: LeaveRequest = {
        id: uid(),
        employeeId: input.employeeId,
        leaveType: input.leaveType,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        totalDays: input.totalDays,
        reason: input.reason,
        attachments: input.attachments,
        notifyUsers: input.notifyUsers,
        status: "Pending",
        submittedAt: new Date().toISOString(),
      };
      setLeaveRequests((prev) => [request, ...prev]);
      const employee = employees.find((e) => e.id === input.employeeId);
      logActivity(
        `${employee?.name ?? "Employee"} requested ${input.leaveType} (${input.dateFrom} to ${input.dateTo})`
      );
    },
    [employees, logActivity]
  );

  const cancelLeave = useCallback(
    (id: string) => {
      setLeaveRequests((prev) =>
        prev.map((r) =>
          r.id === id && r.status === "Pending"
            ? { ...r, status: "Cancelled" as const, reviewedAt: new Date().toISOString() }
            : r
        )
      );
      const request = leaveRequests.find((r) => r.id === id);
      const employee = employees.find((e) => e.id === request?.employeeId);
      logActivity(`${employee?.name ?? "Employee"} cancelled their ${request?.leaveType ?? "leave"} request`);
    },
    [leaveRequests, employees, logActivity]
  );

  const approveLeave = useCallback(
    (id: string, comment?: string) => {
      setLeaveRequests((prev) =>
        prev.map((r) =>
          r.id === id && r.status === "Pending"
            ? {
                ...r,
                status: "Approved" as const,
                reviewedAt: new Date().toISOString(),
                reviewedBy: currentUser?.id,
              }
            : r
        )
      );
      const request = leaveRequests.find((r) => r.id === id);
      const employee = employees.find((e) => e.id === request?.employeeId);
      logActivity(
        `Approved ${employee?.name ?? "employee"}'s ${request?.leaveType ?? "leave"} request` +
          (comment ? ` — ${comment}` : "")
      );
    },
    [leaveRequests, employees, currentUser, logActivity]
  );

  const rejectLeave = useCallback(
    (id: string, reason: string) => {
      setLeaveRequests((prev) =>
        prev.map((r) =>
          r.id === id && r.status === "Pending"
            ? {
                ...r,
                status: "Rejected" as const,
                reviewedAt: new Date().toISOString(),
                reviewedBy: currentUser?.id,
                rejectionReason: reason,
              }
            : r
        )
      );
      const request = leaveRequests.find((r) => r.id === id);
      const employee = employees.find((e) => e.id === request?.employeeId);
      logActivity(
        `Rejected ${employee?.name ?? "employee"}'s ${request?.leaveType ?? "leave"} request — ${reason}`
      );
    },
    [leaveRequests, employees, currentUser, logActivity]
  );

  const updateLeavePolicies = useCallback(
    (policies: LeavePolicy[]) => {
      setLeavePolicies(policies);
      logActivity("Updated leave policy settings");
    },
    [logActivity]
  );

  const getLeaveBalance = useCallback(
    (employeeId: string): Record<LeaveType, { used: number; remaining: number }> => {
      const currentYear = new Date().getFullYear();
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;
      const approvedThisYear = leaveRequests.filter(
        (r) =>
          r.employeeId === employeeId &&
          r.status === "Approved" &&
          r.dateFrom >= yearStart &&
          r.dateFrom <= yearEnd
      );

      const balance: Record<LeaveType, { used: number; remaining: number }> = {
        "Vacation Leave": { used: 0, remaining: 0 },
        "Sick Leave": { used: 0, remaining: 0 },
        "Emergency Leave": { used: 0, remaining: 0 },
        "Unpaid Leave": { used: 0, remaining: 0 },
      };

      for (const policy of leavePolicies) {
        const used = approvedThisYear
          .filter((r) => r.leaveType === policy.leaveType)
          .reduce((sum, r) => sum + r.totalDays, 0);
        balance[policy.leaveType] = {
          used,
          remaining: Math.max(0, policy.annualCredits - used),
        };
      }

      return balance;
    },
    [leaveRequests, leavePolicies]
  );

  const updateEmployeeStatus = useCallback(
    (id: string, status: EmployeeStatus) => {
      const employee = employees.find((emp) => emp.id === id);
      if (!employee) return;
      // Safety: never allow deactivating the last Admin
      if (employee.role === "Admin" && status !== "Active") {
        const activeAdminCount = employees.filter(
          (e) => e.role === "Admin" && e.status === "Active"
        ).length;
        if (activeAdminCount <= 1) return;
      }
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? { ...emp, status } : emp))
      );
      if (employee.id !== currentUser?.id) {
        logActivity(`Updated ${employee.name} status to ${status}`);
      }
      if (currentUser && currentUser.id === id && status !== "Active") {
        window.localStorage.removeItem(SESSION_KEY);
        notifySession();
      }
    },
    [currentUser, employees, logActivity]
  );

  const deleteEmployee = useCallback(
    (id: string) => {
      const employee = employees.find((emp) => emp.id === id);
      if (!employee) return;
      // Safety: never allow deleting the last Admin
      if (employee.role === "Admin") {
        const adminCount = employees.filter((e) => e.role === "Admin").length;
        if (adminCount <= 1) return;
      }
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      logActivity(`Removed ${employee.name} from the team`);
    },
    [employees, logActivity]
  );

  const addEmployee = useCallback(
    (input: { name: string; email: string; role: Role; department: string }) => {
      const inviteToken = uid();
      const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      const employee: Employee = {
        id: uid(),
        name: input.name,
        email: input.email,
        password: "",
        role: input.role,
        status: "Invited",
        department: input.department,
        createdAt: new Date().toISOString(),
        inviteToken,
        inviteExpiresAt,
      };
      setEmployees((prev) => [...prev, employee]);
      logActivity(`Invited ${employee.name} (${employee.department}) as ${employee.role}`);
      const inviteLink = `${typeof window !== "undefined" ? window.location.origin : ""}/invite?token=${inviteToken}`;
      return { employee, inviteLink };
    },
    [logActivity]
  );

  const addVAEmployee = useCallback(
    (input: {
      name: string;
      email: string;
      department: string;
      vaId: string;
      tempPassword: string;
    }) => {
      const employee: Employee = {
        id: uid(),
        name: input.name,
        email: input.email,
        password: hashPassword(input.tempPassword),
        role: "Employee",
        status: "Pending",
        department: input.department,
        createdAt: new Date().toISOString(),
        mustChangePassword: true,
        vaId: input.vaId,
      };
      setEmployees((prev) => [...prev, employee]);
      sendInviteEmail({
        to: input.email,
        name: input.name,
        tempPassword: input.tempPassword,
      });
      logActivity(
        `Created account for VA ${employee.name} (${employee.department}) — pending setup`
      );
      return employee;
    },
    [logActivity]
  );

  const addReport = useCallback(
    (text: string) => {
      if (!currentUser) return;
      setReports((prev) => [
        {
          id: uid(),
          employeeId: currentUser.id,
          text,
          createdAt: new Date().toISOString(),
          replies: [],
        },
        ...prev,
      ]);
      logActivity(`Submitted a system report`);
    },
    [currentUser, logActivity]
  );

  const addReply = useCallback(
    (reportId: string, text: string) => {
      if (!currentUser) return;
      setReports((prev) =>
        prev.map((rep) =>
          rep.id === reportId
            ? {
                ...rep,
                replies: [
                  ...rep.replies,
                  {
                    id: uid(),
                    author: currentUser.name,
                    role: currentUser.role,
                    text,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : rep
        )
      );
      logActivity(`Replied to a system report`);
    },
    [currentUser, logActivity]
  );

  const value = useMemo<DataContextValue>(
    () => ({
      currentUser,
      employees,
      teamPermissionsEmployees,
      payroll,
      invoices,
      clients,
      vas,
      activity,
      reports,
      invoiceNumberingDefaults,
      leaveRequests,
      leavePolicies,
      signIn,
      signOut,
      setNewPassword,
      addPayroll,
      markInvoicePaid,
      markPayrollPaid,
      addInvoice,
      saveInvoiceNumberingDefaults,
      updateEmployeeStatus,
      deleteEmployee,
      addEmployee,
      addVAEmployee,
      addReport,
      addReply,
      logActivity,
      addClient,
      updateClient,
      setClientStatus,
      deleteClient,
      restoreClient,
      addVA,
      updateVA,
      setVAStatus,
      deleteVA,
      restoreVA,
      hasPermission,
      updateSubAdminPermissions,
      createSubAdmin,
      getFirstAccessiblePath,
      updateUserPreferences,
      changePassword,
      updateCurrentUserProfile,
      requestLeave,
      cancelLeave,
      approveLeave,
      rejectLeave,
      updateLeavePolicies,
      getLeaveBalance,
    }),
    [
      currentUser,
      employees,
      teamPermissionsEmployees,
      payroll,
      invoices,
      clients,
      vas,
      activity,
      reports,
      invoiceNumberingDefaults,
      leaveRequests,
      leavePolicies,
      signIn,
      signOut,
      setNewPassword,
      addPayroll,
      markInvoicePaid,
      markPayrollPaid,
      addInvoice,
      saveInvoiceNumberingDefaults,
      updateEmployeeStatus,
      deleteEmployee,
      addEmployee,
      addVAEmployee,
      addReport,
      addReply,
      logActivity,
      addClient,
      updateClient,
      setClientStatus,
      deleteClient,
      restoreClient,
      addVA,
      updateVA,
      setVAStatus,
      deleteVA,
      restoreVA,
      hasPermission,
      updateSubAdminPermissions,
      createSubAdmin,
      getFirstAccessiblePath,
      updateUserPreferences,
      changePassword,
      updateCurrentUserProfile,
      requestLeave,
      cancelLeave,
      approveLeave,
      rejectLeave,
      updateLeavePolicies,
      getLeaveBalance,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData must be used within a DataProvider");
  }
  return ctx;
}

export { salaryByEmployeeId };
