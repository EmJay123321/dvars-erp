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
  PayrollRecord,
  PayrollStatus,
  Report,
  Role,
  VA,
} from "./types";
import {
  initialActivity,
  initialClients,
  initialEmployees,
  initialInvoices,
  initialPayroll,
  initialReports,
  initialVAs,
  salaryByEmployeeId,
} from "./mock";
import { lastDayOfMonth, uid } from "./format";
import {
  DEFAULT_INVOICE_NUMBERING_DEFAULTS,
  invoicesForClient,
  nextInvoiceNumber,
  normalizeInvoiceNumber,
} from "./invoice";

const SESSION_KEY = "pathways-erp-session";
const DIRECTORY_KEY = "pathways-erp-directory";
const DIRECTORY_DATA_VERSION = "pathways-erp-directory-data-v2";
const INVOICES_KEY = "pathways-erp-invoices";
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
      return { clients: parsed.clients ?? [], vas };
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
  gross: number;
  status: PayrollStatus;
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
  leadManagerName?: string;
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
}

export interface AddInvoiceResult {
  ok: boolean;
  error?: string;
  number?: string;
}

interface DataContextValue {
  currentUser: Employee | null;
  employees: Employee[];
  payroll: PayrollRecord[];
  invoices: Invoice[];
  clients: Client[];
  vas: VA[];
  activity: ActivityLogEntry[];
  reports: Report[];
  invoiceNumberingDefaults: InvoiceNumberDefaults;
  signIn: (email: string, password: string) => SignInResult;
  signOut: () => void;
  addPayroll: (input: NewPayrollInput) => PayrollRecord;
  markInvoicePaid: (id: string) => void;
  addInvoice: (input: NewInvoiceInput) => AddInvoiceResult;
  saveInvoiceNumberingDefaults: (defaults: InvoiceNumberDefaults) => void;
  updateEmployeeStatus: (id: string, status: EmployeeStatus) => void;
  addEmployee: (input: { name: string; email: string; role: Role; department: string }) => {
    employee: Employee;
    tempPassword: string;
  };
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
}

const DataContext = createContext<DataContextValue | null>(null);

function tempPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "PP-";
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [payroll, setPayroll] = useState<PayrollRecord[]>(initialPayroll);
  const [invoices, setInvoices] = useState<Invoice[]>(() => readInvoices() ?? initialInvoices);
  const [activity, setActivity] = useState<ActivityLogEntry[]>(initialActivity);
  const [reports, setReports] = useState<Report[]>(initialReports);
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
      window.localStorage.setItem(
        INVOICE_NUMBERING_KEY,
        JSON.stringify(invoiceNumberingDefaults)
      );
    } catch {
      // storage unavailable — keep in-memory
    }
  }, [invoiceNumberingDefaults]);

  const currentUser = useMemo(() => {
    if (!storedId) return null;
    const found = employees.find((emp) => emp.id === storedId);
    return found && found.status === "Active" ? found : null;
  }, [employees, storedId]);

  const signIn = useCallback(
    (email: string, password: string): SignInResult => {
      const found = employees.find(
        (emp) => emp.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (!found || found.password !== password) {
        return { ok: false, error: "Invalid email or password." };
      }
      if (found.status !== "Active") {
        return { ok: false, error: "This account is not active. Contact your administrator." };
      }
      window.localStorage.setItem(SESSION_KEY, found.id);
      notifySession();
      return { ok: true };
    },
    [employees]
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

  const addPayroll = useCallback(
    (input: NewPayrollInput): PayrollRecord => {
      const [year, month] = input.monthValue.split("-").map(Number);
      const start = new Date(Date.UTC(year, month - 1, 1));
      const end = new Date(Date.UTC(year, month - 1, lastDayOfMonth(year, month - 1)));
      const tax = Math.round(input.gross * 0.2);
      const ni = Math.round(input.gross * 0.12);
      const pension = Math.round(input.gross * 0.05);
      const net = input.gross - tax - ni - pension;
      const record: PayrollRecord = {
        id: uid(),
        employeeId: input.employeeId,
        periodStart: start.toISOString().slice(0, 10),
        periodEnd: end.toISOString().slice(0, 10),
        gross: input.gross,
        earnings: [{ label: "Base salary", amount: input.gross }],
        deductions: [
          { label: "Income tax", amount: tax },
          { label: "National Insurance", amount: ni },
          { label: "Pension (5%)", amount: pension },
        ],
        net,
        status: input.status,
        paidAt: input.status === "Paid" ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
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
        leadManagerName: input.leadManagerName ?? "",
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
        setClients((prev) => prev.filter((c) => c.id !== id));
        logActivity(`Deleted client ${removed.clientName}`);
      }
      return removed;
    },
    [clients, logActivity]
  );

  const restoreClient = useCallback(
    (record: Client) => {
      setClients((prev) =>
        prev.some((c) => c.id === record.id) ? prev : [record, ...prev]
      );
      logActivity(`Restored client ${record.clientName}`);
    },
    [logActivity]
  );

  const deleteVA = useCallback(
    (id: string): VA | null => {
      const removed = vas.find((v) => v.id === id) ?? null;
      if (removed) {
        setVas((prev) => prev.filter((v) => v.id !== id));
        logActivity(`Deleted VA ${removed.vaName}`);
      }
      return removed;
    },
    [vas, logActivity]
  );

  const restoreVA = useCallback(
    (record: VA) => {
      setVas((prev) =>
        prev.some((v) => v.id === record.id) ? prev : [record, ...prev]
      );
      logActivity(`Restored VA ${record.vaName}`);
    },
    [logActivity]
  );

  const updateEmployeeStatus = useCallback(
    (id: string, status: EmployeeStatus) => {
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? { ...emp, status } : emp))
      );
      const employee = employees.find((emp) => emp.id === id);
      if (employee && employee.id !== currentUser?.id) {
        logActivity(`Updated ${employee.name} status to ${status}`);
      }
      if (currentUser && currentUser.id === id && status !== "Active") {
        window.localStorage.removeItem(SESSION_KEY);
        notifySession();
      }
    },
    [currentUser, employees, logActivity]
  );

  const addEmployee = useCallback(
    (input: { name: string; email: string; role: Role; department: string }) => {
      const password = tempPassword();
      const employee: Employee = {
        id: uid(),
        name: input.name,
        email: input.email,
        password,
        role: input.role,
        status: "Active",
        department: input.department,
        createdAt: new Date().toISOString(),
      };
      setEmployees((prev) => [...prev, employee]);
      logActivity(`Invited ${employee.name} (${employee.department}) as ${employee.role}`);
      return { employee, tempPassword: password };
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
      payroll,
      invoices,
      clients,
      vas,
      activity,
      reports,
      invoiceNumberingDefaults,
      signIn,
      signOut,
      addPayroll,
      markInvoicePaid,
      addInvoice,
      saveInvoiceNumberingDefaults,
      updateEmployeeStatus,
      addEmployee,
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
    }),
    [
      currentUser,
      employees,
      payroll,
      invoices,
      clients,
      vas,
      activity,
      reports,
      invoiceNumberingDefaults,
      signIn,
      signOut,
      addPayroll,
      markInvoicePaid,
      addInvoice,
      saveInvoiceNumberingDefaults,
      updateEmployeeStatus,
      addEmployee,
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
