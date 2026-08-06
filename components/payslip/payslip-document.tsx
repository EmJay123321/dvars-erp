"use client";

import type { PayrollRecord } from "@/lib/types";
import { formatCurrency, formatDate, formatPeriod } from "@/lib/format";
import Badge, { statusBadgeTone } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { IconDownload, IconPrinter } from "@/components/ui/icons";

export default function PayslipDocument({
  record,
  employeeName,
}: {
  record: PayrollRecord;
  employeeName: string;
}) {
  const totalDeductions = record.deductions.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Badge tone={statusBadgeTone(record.status)} dot>{record.status}</Badge>
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
            <p className="text-sm text-ink-muted">Payroll · Period payslip</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-ink-faint">Payslip</p>
            <p className="font-mono text-base font-semibold tabular-nums text-ink">
              {record.id}
            </p>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-5 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-faint">Employee</p>
            <p className="mt-1 text-sm font-medium text-ink">{employeeName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-faint">Pay period</p>
            <p className="mt-1 text-sm font-medium text-ink">
              {formatPeriod(record.periodStart, record.periodEnd)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-faint">Pay date</p>
            <p className="mt-1 text-sm font-medium text-ink">
              {record.paidAt ? formatDate(record.paidAt) : "Not yet paid"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 px-6 pb-6 md:grid-cols-2">
          <div className="rounded-xl border border-border">
            <p className="border-b border-border px-4 py-2.5 text-sm font-semibold text-ink">
              Earnings
            </p>
            <ul className="divide-y divide-border">
              {record.earnings.map((line) => (
                <li key={line.label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-ink-muted">{line.label}</span>
                  <span className="font-mono text-sm tabular-nums text-ink">
                    {formatCurrency(line.amount)}
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between bg-bg/60 px-4 py-2.5">
                <span className="text-sm font-semibold text-ink">Gross</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                  {formatCurrency(record.gross)}
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-border">
            <p className="border-b border-border px-4 py-2.5 text-sm font-semibold text-ink">
              Deductions
            </p>
            <ul className="divide-y divide-border">
              {record.deductions.map((line) => (
                <li key={line.label} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-ink-muted">{line.label}</span>
                  <span className="font-mono text-sm tabular-nums text-ink">
                    −{formatCurrency(line.amount)}
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between bg-bg/60 px-4 py-2.5">
                <span className="text-sm font-semibold text-ink">Total deductions</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                  −{formatCurrency(totalDeductions)}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-accent-soft px-6 py-5">
          <p className="font-display text-sm font-semibold text-accent-dark">Net pay</p>
          <p className="font-mono text-2xl font-semibold tabular-nums text-accent-dark">
            {formatCurrency(record.net)}
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-ink-faint">
        Mock document for the front-end phase — real PDF generation ships with the backend.
      </p>
    </div>
  );
}
