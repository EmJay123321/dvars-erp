"use client";

import { useParams } from "next/navigation";
import PermissionGate from "@/components/shell/permission-gate";
import PayslipView from "@/features/payroll/payslip-view";

export default function Page() {
  const params = useParams<{ id: string }>();
  return (
    <PermissionGate module="payroll">
      <PayslipView id={params.id} />
    </PermissionGate>
  );
}
