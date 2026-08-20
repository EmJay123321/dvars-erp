import PermissionGate from "@/components/shell/permission-gate";
import SystemReportPage from "@/features/system-report/system-report-page";

export default function Page() {
  return (
    <PermissionGate module="systemReport">
      <SystemReportPage />
    </PermissionGate>
  );
}
