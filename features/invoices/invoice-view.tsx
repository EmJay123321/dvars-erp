"use client";

import Link from "next/link";
import { useData } from "@/lib/store";
import InvoiceDocument from "@/components/invoice/invoice-document";
import EmptyState from "@/components/ui/empty-state";
import { IconArrowLeft, IconReceipt } from "@/components/ui/icons";

export default function InvoiceView({ id }: { id: string }) {
  const { invoices, markInvoicePaid } = useData();

  const invoice = invoices.find((i) => i.id === id);

  if (!invoice) {
    return (
      <div className="space-y-4">
        <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-dark">
          <IconArrowLeft size={15} /> Back to invoices
        </Link>
        <EmptyState icon={<IconReceipt size={22} />} title="Invoice not found" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-dark">
        <IconArrowLeft size={15} /> Back to invoices
      </Link>
      <InvoiceDocument invoice={invoice} onMarkPaid={() => markInvoicePaid(invoice.id)} />
    </div>
  );
}
