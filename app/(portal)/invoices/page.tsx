import PermissionGate from "@/components/shell/permission-gate";
import InvoicesPage from "@/features/invoices/invoices-page";

export default function Page() {
  return (
    <PermissionGate module="invoices">
      <InvoicesPage />
    </PermissionGate>
  );
}
