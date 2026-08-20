import PermissionGate from "@/components/shell/permission-gate";
import ReportsPage from "@/features/reports/reports-page";

export default function Page() {
  return (
    <PermissionGate module="reports">
      <ReportsPage />
    </PermissionGate>
  );
}
