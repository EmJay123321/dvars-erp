import RoleGate from "@/components/shell/role-gate";
import DirectoryPage from "@/features/directory/directory-page";

export default function Page() {
  return (
    <RoleGate role="Admin">
      <DirectoryPage />
    </RoleGate>
  );
}
