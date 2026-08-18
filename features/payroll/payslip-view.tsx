"use client";

import Link from "next/link";
import { useData } from "@/lib/store";
import PayslipDocument from "@/components/payslip/payslip-document";
import EmptyState from "@/components/ui/empty-state";
import { IconArrowLeft, IconFileText } from "@/components/ui/icons";

export default function PayslipView({ id }: { id: string }) {
  const { payroll, employees, currentUser, markPayrollPaid } = useData();

  const record = payroll.find((p) => p.id === id);

  if (!record) {
    return (
      <div className="space-y-4">
        <Link href="/payroll" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-dark hover:text-ink">
          <IconArrowLeft size={15} /> Back to payroll
        </Link>
        <EmptyState icon={<IconFileText size={22} />} title="Payslip not found" />
      </div>
    );
  }

  if (currentUser?.role !== "Admin" && currentUser?.role !== "Sub-admin" && record.employeeId !== currentUser?.id) {
    return (
      <div className="space-y-4">
        <Link href="/payroll" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-dark hover:text-ink">
          <IconArrowLeft size={15} /> Back to payroll
        </Link>
        <EmptyState
          icon={<IconFileText size={22} />}
          title="This payslip isn't yours"
          description="Employee accounts can only view their own payslips."
        />
      </div>
    );
  }

  const employee = employees.find((e) => e.id === record.employeeId);

  return (
    <div className="space-y-4">
      <Link href="/payroll" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-dark hover:text-ink">
        <IconArrowLeft size={15} /> Back to payroll
      </Link>
      <PayslipDocument
        record={record}
        employeeName={employee?.name ?? "Unknown"}
        jobPosition={employee?.department}
        onMarkPaid={() => markPayrollPaid(record.id)}
      />
    </div>
  );
}
