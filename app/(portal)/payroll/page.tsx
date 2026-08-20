import PermissionGate from "@/components/shell/permission-gate";
import PayrollPage from "@/features/payroll/payroll-page";

export default function Page() {
  return (
    <PermissionGate module="payroll">
      <PayrollPage />
    </PermissionGate>
  );
}
