"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type {
  ActivityLogEntry,
  Employee,
  EmployeeStatus,
  Invoice,
  InvoiceStatus,
  PayrollRecord,
  PayrollStatus,
  Report,
  Role,
} from "./types";
import {
  initialActivity,
  initialEmployees,
  initialInvoices,
  initialPayroll,
  initialReports,
  salaryByEmployeeId,
} from "./mock";
import { lastDayOfMonth, uid } from "./format";

const SESSION_KEY = "pathways-erp-session";

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
  lineItems: { label: string; qty: number; rate: number }[];
  issuedAt: string;
  dueAt: string;
}

export interface SignInResult {
  ok: boolean;
  error?: string;
}

interface DataContextValue {
  currentUser: Employee | null;
  employees: Employee[];
  payroll: PayrollRecord[];
  invoices: Invoice[];
  activity: ActivityLogEntry[];
  reports: Report[];
  signIn: (email: string, password: string) => SignInResult;
  signOut: () => void;
  addPayroll: (input: NewPayrollInput) => PayrollRecord;
  markInvoicePaid: (id: string) => void;
  addInvoice: (input: NewInvoiceInput) => void;
  updateEmployeeStatus: (id: string, status: EmployeeStatus) => void;
  addEmployee: (input: { name: string; email: string; role: Role; department: string }) => {
    employee: Employee;
    tempPassword: string;
  };
  addReport: (text: string) => void;
  addReply: (reportId: string, text: string) => void;
  logActivity: (description: string) => void;
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
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [activity, setActivity] = useState<ActivityLogEntry[]>(initialActivity);
  const [reports, setReports] = useState<Report[]>(initialReports);

  const storedId = useSyncExternalStore(subscribeSession, readSession, () => null);

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
      logActivity(`Marked ${id} (${invoice?.clientName ?? "invoice"}) as paid`);
    },
    [invoices, logActivity]
  );

  const addInvoice = useCallback(
    (input: NewInvoiceInput) => {
      const amount = input.lineItems.reduce((sum, item) => sum + item.qty * item.rate, 0);
      const invoice: Invoice = {
        id: `INV-${1000 + invoices.length + 30}`,
        clientName: input.clientName,
        lineItems: input.lineItems,
        amount,
        issuedAt: input.issuedAt,
        dueAt: input.dueAt,
        status: "Pending",
      };
      setInvoices((prev) => [invoice, ...prev]);
      logActivity(`Created invoice ${invoice.id} for ${input.clientName}`);
    },
    [invoices.length, logActivity]
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
      activity,
      reports,
      signIn,
      signOut,
      addPayroll,
      markInvoicePaid,
      addInvoice,
      updateEmployeeStatus,
      addEmployee,
      addReport,
      addReply,
      logActivity,
    }),
    [
      currentUser,
      employees,
      payroll,
      invoices,
      activity,
      reports,
      signIn,
      signOut,
      addPayroll,
      markInvoicePaid,
      addInvoice,
      updateEmployeeStatus,
      addEmployee,
      addReport,
      addReply,
      logActivity,
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
