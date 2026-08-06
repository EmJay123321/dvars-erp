export type Role = "Admin" | "Employee";
export type EmployeeStatus = "Active" | "Terminated" | "Resigned";
export type PayrollStatus = "Pending" | "Paid";
export type InvoiceStatus = "Pending" | "Paid" | "Overdue";

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
}

export interface InvoiceLineItem {
  label: string;
  qty: number;
  rate: number;
}

export interface Invoice {
  id: string;
  clientName: string;
  lineItems: InvoiceLineItem[];
  amount: number;
  issuedAt: string;
  dueAt: string;
  status: InvoiceStatus;
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
