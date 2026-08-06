"use client";

import type { Invoice } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import Badge, { statusBadgeTone } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { IconCheck, IconDownload, IconPrinter } from "@/components/ui/icons";

export default function InvoiceDocument({
  invoice,
  onMarkPaid,
}: {
  invoice: Invoice;
  onMarkPaid?: () => void;
}) {
  const canMarkPaid = invoice.status !== "Paid" && onMarkPaid;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Badge tone={statusBadgeTone(invoice.status)} dot>{invoice.status}</Badge>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<IconPrinter size={15} />}
            onClick={() => window.print()}
          >
            Print
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<IconDownload size={15} />}
            disabled
            title="PDF export arrives with the backend"
          >
            Download PDF
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-bg/50 px-6 py-5">
          <div>
            <p className="font-display text-lg font-semibold text-ink">Dynamic VA Referral Services</p>
            <p className="text-sm text-ink-muted">Invoice to</p>
            <p className="mt-1 font-medium text-ink">{invoice.clientName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-ink-faint">Invoice</p>
            <p className="font-mono text-base font-semibold tabular-nums text-ink">
              {invoice.id}
            </p>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-faint">Issued</p>
            <p className="mt-1 text-sm font-medium text-ink">{formatDate(invoice.issuedAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-faint">Due</p>
            <p className="mt-1 text-sm font-medium text-ink">{formatDate(invoice.dueAt)}</p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-border text-left">
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Qty
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Rate
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-6 py-3 text-ink">{item.label}</td>
                <td className="px-6 py-3 text-right font-mono tabular-nums text-ink-muted">
                  {item.qty}
                </td>
                <td className="px-6 py-3 text-right font-mono tabular-nums text-ink-muted">
                  {formatCurrency(item.rate)}
                </td>
                <td className="px-6 py-3 text-right font-mono tabular-nums text-ink">
                  {formatCurrency(item.qty * item.rate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between gap-4 border-t border-border bg-accent-soft px-6 py-5">
          <p className="font-display text-sm font-semibold text-accent-dark">Total due</p>
          <p className="font-mono text-2xl font-semibold tabular-nums text-accent-dark">
            {formatCurrency(invoice.amount)}
          </p>
        </div>
      </div>

      {canMarkPaid && (
        <div className="flex justify-center">
          <Button icon={<IconCheck size={16} />} onClick={onMarkPaid}>
            Mark as paid
          </Button>
        </div>
      )}
    </div>
  );
}
