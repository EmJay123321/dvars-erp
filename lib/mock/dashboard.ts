import type { MonthValue, ExpenseCategory, MonthlyExpense } from "../types";

export const revenueByMonth: MonthValue[] = [
  { month: "Mar 2026", value: 0 },
  { month: "Apr 2026", value: 0 },
  { month: "May 2026", value: 0 },
  { month: "Jun 2026", value: 0 },
  { month: "Jul 2026", value: 0 },
  { month: "Aug 2026", value: 0 },
];

export const expensesByMonth: MonthValue[] = [
  { month: "Mar 2026", value: 0 },
  { month: "Apr 2026", value: 0 },
  { month: "May 2026", value: 0 },
  { month: "Jun 2026", value: 0 },
  { month: "Jul 2026", value: 0 },
  { month: "Aug 2026", value: 0 },
];

export const expenseCategories: ExpenseCategory[] = [
  { name: "Salaries", value: 0, color: "#1DC8CD" },
  { name: "Software", value: 0, color: "#34B294" },
  { name: "Marketing", value: 0, color: "#D97706" },
  { name: "Travel", value: 0, color: "#6B7280" },
];

export const monthlyExpenses: MonthlyExpense[] = [
  { month: "Mar 2026", salaries: 0, software: 0, marketing: 0, travel: 0 },
  { month: "Apr 2026", salaries: 0, software: 0, marketing: 0, travel: 0 },
  { month: "May 2026", salaries: 0, software: 0, marketing: 0, travel: 0 },
  { month: "Jun 2026", salaries: 0, software: 0, marketing: 0, travel: 0 },
  { month: "Jul 2026", salaries: 0, software: 0, marketing: 0, travel: 0 },
  { month: "Aug 2026", salaries: 0, software: 0, marketing: 0, travel: 0 },
];

export const topClients: { name: string; value: number }[] = [];
