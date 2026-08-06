import RoleGate from "@/components/shell/role-gate";
import ReportsPage from "@/features/reports/reports-page";

export default function Page() {
  return (
    <RoleGate role="Admin">
      <ReportsPage />
    </RoleGate>
  );
}
