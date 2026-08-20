import PermissionGate from "@/components/shell/permission-gate";
import VacationLeavesPage from "@/features/vacation-leaves/vacation-leaves-page";

export default function Page() {
  return (
    <PermissionGate module="vacationLeaves">
      <VacationLeavesPage />
    </PermissionGate>
  );
}
