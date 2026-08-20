import PermissionGate from "@/components/shell/permission-gate";
import ActivityPage from "@/features/settings/activity-page";

export default function Page() {
  return (
    <PermissionGate module="activityLog">
      <ActivityPage />
    </PermissionGate>
  );
}
