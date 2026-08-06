import type { PayrollRecord } from "../types";

function buildPayroll(
  id: string,
  employeeId: string,
  year: number,
  monthIndex: number, // 0-based
  gross: number,
  status: "Pending" | "Paid",
  paidDay?: number
): PayrollRecord {
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  const tax = Math.round(gross * 0.2);
  const nationalInsurance = Math.round(gross * 0.12);
  const pension = Math.round(gross * 0.05);
  const totalDeductions = tax + nationalInsurance + pension;
  const net = gross - totalDeductions;
  const paidAt =
    status === "Paid"
      ? new Date(Date.UTC(year, monthIndex, paidDay ?? 28)).toISOString()
      : null;

  return {
    id,
    employeeId,
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
    gross,
    earnings: [{ label: "Base salary", amount: gross }],
    deductions: [
      { label: "Income tax", amount: tax },
      { label: "National Insurance", amount: nationalInsurance },
      { label: "Pension (5%)", amount: pension },
    ],
    net,
    status,
    paidAt,
    createdAt: new Date(Date.UTC(year, monthIndex, 24)).toISOString(),
  };
}

export const initialPayroll: PayrollRecord[] = [
  buildPayroll("pay-001", "emp-maya", 2026, 5, 3800, "Paid", 28),
  buildPayroll("pay-002", "emp-jordan", 2026, 5, 4100, "Paid", 28),
  buildPayroll("pay-003", "emp-tom", 2026, 5, 3600, "Paid", 28),
  buildPayroll("pay-004", "emp-priya", 2026, 5, 3400, "Paid", 28),
  buildPayroll("pay-005", "emp-sarah", 2026, 5, 5200, "Paid", 28),
  buildPayroll("pay-006", "emp-maya", 2026, 6, 3800, "Paid", 28),
  buildPayroll("pay-007", "emp-jordan", 2026, 6, 4100, "Paid", 28),
  buildPayroll("pay-008", "emp-tom", 2026, 6, 3600, "Paid", 28),
  buildPayroll("pay-009", "emp-priya", 2026, 6, 3400, "Paid", 28),
  buildPayroll("pay-010", "emp-sarah", 2026, 6, 5200, "Paid", 28),
  buildPayroll("pay-011", "emp-maya", 2026, 7, 3800, "Pending"),
  buildPayroll("pay-012", "emp-jordan", 2026, 7, 4100, "Pending"),
  buildPayroll("pay-013", "emp-tom", 2026, 7, 3600, "Paid", 28),
  buildPayroll("pay-014", "emp-priya", 2026, 7, 3400, "Pending"),
  buildPayroll("pay-015", "emp-sarah", 2026, 7, 5200, "Pending"),
];
