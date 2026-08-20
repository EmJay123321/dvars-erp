import PermissionGate from "@/components/shell/permission-gate";
import InvoiceView from "@/features/invoices/invoice-view";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PermissionGate module="invoices">
      <InvoiceView id={id} />
    </PermissionGate>
  );
}
