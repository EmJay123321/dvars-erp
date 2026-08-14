import RoleGate from "@/components/shell/role-gate";
import InvoiceNumberingPage from "@/features/settings/invoice-numbering-page";

export default function Page() {
  return (
    <RoleGate role="Admin">
      <InvoiceNumberingPage />
    </RoleGate>
  );
}
