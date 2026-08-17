import type { Client, Invoice, PayrollRecord, VA } from "./types";

export interface LinkedRecordCounts {
  invoices: number;
  payroll: number;
  total: number;
}

export function getLinkedRecordCounts(
  record: Client | VA,
  invoices: Invoice[],
  payroll: PayrollRecord[]
): LinkedRecordCounts {
  if ("clientName" in record) {
    const invoiceCount = invoices.filter(
      (inv) => inv.clientId === record.id || inv.clientName === record.clientName
    ).length;
    return { invoices: invoiceCount, payroll: 0, total: invoiceCount };
  }
  const invoiceCount = invoices.filter(
    (inv) => inv.vaId === record.id || inv.vaName === record.vaName
  ).length;
  // Payroll records currently reference employees, not VAs. If a VA↔payroll
  // link is ever added to the schema, count those rows here as well.
  const payrollCount = payroll.filter((p) => p.employeeId === record.id).length;
  return {
    invoices: invoiceCount,
    payroll: payrollCount,
    total: invoiceCount + payrollCount,
  };
}

export function linkedRecordDescription(
  counts: LinkedRecordCounts
): string {
  const parts: string[] = [];
  if (counts.invoices > 0) {
    parts.push(`${counts.invoices} linked ${counts.invoices === 1 ? "invoice" : "invoices"}`);
  }
  if (counts.payroll > 0) {
    parts.push(
      `${counts.payroll} linked payroll ${counts.payroll === 1 ? "record" : "records"}`
    );
  }
  return parts.join(" and ");
}

/**
 * Removes a directory record permanently. Kept separate from the UI so the
 * backend call can be dropped in later without touching components.
 *
 * The UI currently soft-deletes records (sets `deletedAt`) before this runs;
 * this stub is where a real hard-delete endpoint would be wired up.
 */
export async function deleteDirectoryRecord(
  record: Client | VA
): Promise<void> {
  // TODO: Replace with the real PHP endpoint once the backend is wired up.
  // Expected contract:
  //   DELETE /directory/delete.php?type=<client|va>&id=<id>
  //   -> 200 on success
  //   -> 409 { error: "..." } when linked records exist (informational only)
  // await fetch(
  //   `/directory/delete.php?type=${"clientName" in record ? "client" : "va"}&id=${record.id}`,
  //   { method: "DELETE" }
  // );
  void record;
  return Promise.resolve();
}
