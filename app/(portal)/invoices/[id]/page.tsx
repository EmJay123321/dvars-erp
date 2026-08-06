import RoleGate from "@/components/shell/role-gate";
import InvoiceView from "@/features/invoices/invoice-view";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <RoleGate role="Admin">
      <InvoiceView id={id} />
    </RoleGate>
  );
}
