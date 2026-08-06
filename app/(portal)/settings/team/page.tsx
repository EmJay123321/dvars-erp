import RoleGate from "@/components/shell/role-gate";
import TeamPage from "@/features/settings/team-page";

export default function Page() {
  return (
    <RoleGate role="Admin">
      <TeamPage />
    </RoleGate>
  );
}
