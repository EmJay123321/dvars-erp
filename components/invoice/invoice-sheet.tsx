"use client";

import Image from "next/image";
import type { Invoice } from "@/lib/types";
import { formatUSD, formatDate } from "@/lib/format";
import { formatWeekRangeLabel } from "@/lib/invoice";
import AnimatedNumber from "@/components/ui/animated-number";

export const INVOICE_CONFIG = {
  companyName: "DYNAMIC VA REFERRAL SERVICES",
  addressLine1: "Castillon Homes, Pasong Kawayan 2, General Trias",
  addressLine2: "Cavite, Philippines, 4107",
  phone: "(+1) 484 - 372 - 3480",
  logoPath: "/dvars-logo.jpg",
  preparedBy: {
    name: "Andrea Balentos",
    title: "Administrative Assistant",
    signaturePath: "/signature.png",
  },
} as const;

export default function InvoiceSheet({ invoice }: { invoice: Invoice }) {
  const subtotal = invoice.amount;
  const discount = invoice.discount ?? 0;
  const total = Math.max(0, subtotal - discount);
  const hours = invoice.lineItems.reduce((sum, li) => sum + li.qty, 0);
  const showHours = Boolean(invoice.vaName);
  const hasLineDates =
    invoice.lineItems.length > 0 && invoice.lineItems.every((li) => li.date);
  const periodLine = hasLineDates
    ? formatWeekRangeLabel(invoice.lineItems.map((li) => li.date!))
    : `Issued ${formatDate(invoice.issuedAt)}`;

  return (
    <div className="invoice-sheet print-sheet">
      <header className="invoice-sheet__band">
        <div className="invoice-sheet__band-top">
          <div className="invoice-sheet__company">
            <h1 className="invoice-sheet__company-name">
              {INVOICE_CONFIG.companyName}
            </h1>
            <p className="invoice-sheet__company-line">
              {INVOICE_CONFIG.addressLine1}
            </p>
            <p className="invoice-sheet__company-line">
              {INVOICE_CONFIG.addressLine2}
            </p>
            <p className="invoice-sheet__company-line">{INVOICE_CONFIG.phone}</p>
          </div>
          <div className="invoice-sheet__logo-box">
            <Image
              src={INVOICE_CONFIG.logoPath}
              alt="Company logo"
              width={500}
              height={500}
            />
          </div>
        </div>
        <div className="invoice-sheet__band-bottom">
          <p className="invoice-sheet__heading">Invoice</p>
          <p className="invoice-sheet__subheading">{periodLine}</p>
        </div>
      </header>

      <div className="invoice-sheet__body">
        <div className="invoice-sheet__identity">
          <div className="invoice-sheet__client">
            <p className="invoice-sheet__client-name">{invoice.clientName}</p>
            {invoice.vaName && (
              <p className="invoice-sheet__va-name">{invoice.vaName}</p>
            )}
            {invoice.vaRole && (
              <p className="invoice-sheet__va-role">{invoice.vaRole}</p>
            )}
          </div>
          <div className="invoice-sheet__meta">
            <p className="invoice-sheet__meta-label">Invoice No.</p>
            <p className="invoice-sheet__meta-value">{invoice.number ?? invoice.id}</p>
          </div>
        </div>

        <div className="invoice-sheet__dates">
          <div>
            <p className="invoice-sheet__meta-label">Issued</p>
            <p className="invoice-sheet__meta-value">
              {formatDate(invoice.issuedAt)}
            </p>
          </div>
          <div>
            <p className="invoice-sheet__meta-label">Due</p>
            <p className="invoice-sheet__meta-value">
              {formatDate(invoice.dueAt)}
            </p>
          </div>
        </div>

        <div className="invoice-sheet__divider" />
      </div>

      <div className="invoice-sheet__table-wrap">
        <table className="invoice-sheet__table">
          <thead>
            <tr>
              <th>Description</th>
              <th className="invoice-sheet__num">Qty</th>
              <th className="invoice-sheet__num">Rate</th>
              <th className="invoice-sheet__num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, i) => (
              <tr key={i}>
                <td>{item.label}</td>
                <td className="invoice-sheet__num font-mono tabular-nums text-ink-muted">
                  {item.qty}
                </td>
                <td className="invoice-sheet__num font-mono tabular-nums text-ink-muted">
                  {formatUSD(item.rate)}
                </td>
                <td className="invoice-sheet__num font-mono font-semibold tabular-nums text-ink">
                  {formatUSD(item.qty * item.rate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="invoice-sheet__footer">
        <div className="invoice-sheet__prepared-by">
          <Image
            className="invoice-sheet__signature"
            src={INVOICE_CONFIG.preparedBy.signaturePath}
            alt="Signature"
            width={178}
            height={100}
          />
        </div>

        <div className="invoice-sheet__totals">
          {showHours && (
            <div className="invoice-sheet__total-row">
              <span className="invoice-sheet__total-label">No. of Hours</span>
              <span className="invoice-sheet__total-value">
                <AnimatedNumber
                  value={hours}
                  format={(n) => n.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                />
              </span>
            </div>
          )}
          <div className="invoice-sheet__total-row">
            <span className="invoice-sheet__total-label">Subtotal (USD)</span>
            <span className="invoice-sheet__total-value">
              <AnimatedNumber value={subtotal} format={formatUSD} />
            </span>
          </div>
          <div className="invoice-sheet__total-row">
            <span className="invoice-sheet__total-label">
              Discount Percent/Value
            </span>
            <span className="invoice-sheet__total-value">
              {invoice.discountType === "percent" && discount > 0 && subtotal > 0
                ? `${Math.round((discount / subtotal) * 100)}%`
                : <AnimatedNumber value={discount} format={formatUSD} />}
            </span>
          </div>
          <div className="invoice-sheet__total-row">
            <span className="invoice-sheet__total-label">Total due (USD)</span>
            <span className="invoice-sheet__total-value invoice-sheet__total-value--grand">
              <AnimatedNumber value={total} format={formatUSD} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
