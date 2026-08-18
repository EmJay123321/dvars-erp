"use client";

import type { Invoice } from "@/lib/types";
import Badge, { statusBadgeTone } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import InvoiceSheet from "@/components/invoice/invoice-sheet";
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
    <div className="mx-auto w-full max-w-[760px] space-y-5">
      <div className="print:hidden flex items-center justify-between gap-4">
        <Badge tone={statusBadgeTone(invoice.status)} dot>
          {invoice.status}
        </Badge>
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
            onClick={() => window.print()}
            title="Save the print view as a PDF"
          >
            Download PDF
          </Button>
        </div>
      </div>

      <InvoiceSheet invoice={invoice} />

      {canMarkPaid && (
        <div className="print:hidden flex justify-center mt-8">
          <Button icon={<IconCheck size={16} />} onClick={onMarkPaid}>
            Mark as paid
          </Button>
        </div>
      )}
    </div>
  );
}
