import RoleGate from "@/components/shell/role-gate";
import InvoicesPage from "@/features/invoices/invoices-page";

export default function Page() {
  return (
    <RoleGate role="Admin">
      <InvoicesPage />
    </RoleGate>
  );
}
