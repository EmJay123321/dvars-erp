import type { LeaveRequest } from "@/lib/types";

export function exportLeavesToCSV(
  requests: LeaveRequest[],
  employeeName: (id: string) => string
): void {
  const headers = [
    "Employee",
    "Leave Type",
    "From",
    "To",
    "Days",
    "Status",
    "Reason",
    "Submitted",
    "Reviewed By",
    "Rejection Reason",
  ];
  const rows = requests.map((r) => [
    employeeName(r.employeeId),
    r.leaveType,
    r.dateFrom,
    r.dateTo,
    String(r.totalDays),
    r.status,
    r.reason,
    r.submittedAt,
    r.reviewedBy ? employeeName(r.reviewedBy) : "",
    r.rejectionReason ?? "",
  ]);
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leave-records-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
