"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useData } from "@/lib/store";
import InvoiceDocument from "@/components/invoice/invoice-document";
import EmptyState from "@/components/ui/empty-state";
import { IconArrowLeft, IconReceipt } from "@/components/ui/icons";

const emptySubscribe = () => () => {};

function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // client snapshot
    () => false // server snapshot
  );
}

export default function InvoiceView({ id }: { id: string }) {
  const { invoices, markInvoicePaid } = useData();
  // Wait for the first client render so invoices have been read from
  // localStorage before deciding the record is missing.
  const hydrated = useHydrated();

  const invoice = hydrated ? invoices.find((i) => i.id === id) : undefined;

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-dark hover:text-ink"
        >
          <IconArrowLeft size={15} /> Back to invoices
        </Link>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-bg text-ink-faint">
            <IconReceipt size={22} />
          </span>
          <p className="font-medium text-ink">Loading invoice…</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    console.warn(
      `[invoice-view] Invoice not found for id "${id}". ` +
        `Available ids: [${invoices.map((i) => i.id).join(", ")}]`
    );
    return (
      <div className="space-y-4">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-dark hover:text-ink"
        >
          <IconArrowLeft size={15} /> Back to invoices
        </Link>
        <EmptyState icon={<IconReceipt size={22} />} title="Invoice not found" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-dark hover:text-ink"
      >
        <IconArrowLeft size={15} /> Back to invoices
      </Link>
      <InvoiceDocument invoice={invoice} onMarkPaid={() => markInvoicePaid(invoice.id)} />
    </div>
  );
}
