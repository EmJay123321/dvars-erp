import PermissionGate from "@/components/shell/permission-gate";
import DashboardPage from "@/features/dashboard/dashboard-page";

export default function Page() {
  return (
    <PermissionGate module="dashboard">
      <DashboardPage />
    </PermissionGate>
  );
}
