import type { MonthValue, ExpenseCategory, MonthlyExpense } from "../types";

export const revenueByMonth: MonthValue[] = [
  { month: "Mar 2026", value: 6200 },
  { month: "Apr 2026", value: 8400 },
  { month: "May 2026", value: 12100 },
  { month: "Jun 2026", value: 9800 },
  { month: "Jul 2026", value: 15500 },
  { month: "Aug 2026", value: 15000 },
];

export const expensesByMonth: MonthValue[] = [
  { month: "Mar 2026", value: 5200 },
  { month: "Apr 2026", value: 6100 },
  { month: "May 2026", value: 5900 },
  { month: "Jun 2026", value: 7200 },
  { month: "Jul 2026", value: 6800 },
  { month: "Aug 2026", value: 7400 },
];

export const expenseCategories: ExpenseCategory[] = [
  { name: "Salaries", value: 34200, color: "#1B6E5B" },
  { name: "Software", value: 6100, color: "#34B294" },
  { name: "Marketing", value: 3400, color: "#D97706" },
  { name: "Travel", value: 2800, color: "#6B7280" },
];

export const monthlyExpenses: MonthlyExpense[] = [
  { month: "Mar 2026", salaries: 4200, software: 500, marketing: 250, travel: 250 },
  { month: "Apr 2026", salaries: 4800, software: 600, marketing: 400, travel: 300 },
  { month: "May 2026", salaries: 4500, software: 500, marketing: 600, travel: 300 },
  { month: "Jun 2026", salaries: 5500, software: 700, marketing: 600, travel: 400 },
  { month: "Jul 2026", salaries: 5200, software: 700, marketing: 500, travel: 400 },
  { month: "Aug 2026", salaries: 5600, software: 800, marketing: 500, travel: 500 },
];

export const topClients: { name: string; value: number }[] = [
  { name: "Nord Anglia Beijing", value: 15000 },
  { name: "Dulwich College Shanghai", value: 12600 },
  { name: "British School of Tokyo", value: 9800 },
  { name: "Harrow International", value: 8400 },
  { name: "Wellington College Bangkok", value: 5200 },
];
