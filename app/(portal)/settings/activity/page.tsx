import RoleGate from "@/components/shell/role-gate";
import ActivityPage from "@/features/settings/activity-page";

export default function Page() {
  return (
    <RoleGate role="Admin">
      <ActivityPage />
    </RoleGate>
  );
}
