import PermissionGate from "@/components/shell/permission-gate";
import DirectoryPage from "@/features/directory/directory-page";

export default function Page() {
  return (
    <PermissionGate module="directory">
      <DirectoryPage />
    </PermissionGate>
  );
}
