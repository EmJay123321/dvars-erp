"use client";

import { useState } from "react";
import Image from "next/image";
import type { PayrollRecord, Signer } from "@/lib/types";
import { formatCurrency, formatHours, formatPeriod } from "@/lib/format";
import Badge, { statusBadgeTone } from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { IconCheck, IconDownload, IconPrinter } from "@/components/ui/icons";

/**
 * Static company branding for the payslip.
 *
 * Hardcoded on purpose: none of this is bound to per-payslip database fields,
 * so it can never be edited per record. Change it here if the brand details
 * need to change.
 */
const PAYSLIP_CONFIG = {
  companyName: "DYNAMIC VA REFERRAL SERVICES",
  addressLine1: "Castillon Homes, Pasong Kawayan 2, General Trias",
  addressLine2: "Cavite, Philippines, 4107",
  phone: "(+1) 484 - 372 - 3480",
  logoPath: "/dvars-logo.jpg",
  website: "www.dvsphbpo.com",
  preparedBy: {
    name: "Andrea Balentos",
    title: "Administrative Assistant",
    signaturePath: "/signature.png",
  },
  signedBy: {
    name: "Andrea Balentos",
    title: "HR Manager",
    signaturePath: "/signature.png",
  },
} as const;

/** Weekly pay-period row inside the slip table. */
interface PayWeek {
  start: string;
  end: string;
  hours: number;
  earnings: number;
}

const HOURS_PER_DAY = 8; // mock stand-in until the backend provides real hours

function countWeekdays(start: Date, end: Date): number {
  let days = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) days += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

/**
 * Splits the record's pay period into weekly ranges. Hours are derived from
 * the weekday count (mock); earnings are prorated so the rows always sum to
 * the record's gross. Front-end placeholder -- the backend supplies real data.
 */
function buildPayWeeks(record: PayrollRecord): PayWeek[] {
  const start = new Date(`${record.periodStart}T00:00:00Z`);
  const end = new Date(`${record.periodEnd}T00:00:00Z`);

  const chunks: { start: string; end: string; days: number }[] = [];
  let cursor = new Date(start);
  let totalDays = 0;

  while (cursor <= end) {
    const weekEnd = new Date(cursor);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
    if (weekEnd > end) weekEnd.setTime(end.getTime());
    const days = countWeekdays(cursor, weekEnd);
    totalDays += days;
    chunks.push({
      start: cursor.toISOString().slice(0, 10),
      end: weekEnd.toISOString().slice(0, 10),
      days,
    });
    cursor = new Date(weekEnd);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const totalHours = totalDays * HOURS_PER_DAY;
  const rate = totalHours > 0 ? record.gross / totalHours : 0;
  let allocated = 0;

  return chunks.map((chunk, index) => {
    const hours = chunk.days * HOURS_PER_DAY;
    const isLast = index === chunks.length - 1;
    const earnings = isLast
      ? Math.round((record.gross - allocated) * 100) / 100
      : Math.round(hours * rate * 100) / 100;
    allocated += earnings;
    return { start: chunk.start, end: chunk.end, hours, earnings };
  });
}

export default function PayslipDocument({
  record,
  employeeName,
  jobPosition,
  onMarkPaid,
}: {
  record: PayrollRecord;
  employeeName: string;
  jobPosition?: string;
  onMarkPaid?: () => void;
}) {
  // Newer records carry the weekly rows entered at run time; older ones fall
  // back to the derived breakdown so they still render.
  const weeks =
    record.weeks && record.weeks.length > 0 ? record.weeks : buildPayWeeks(record);
  const totalHours =
    record.totalHours ?? weeks.reduce((sum, w) => sum + w.hours, 0);
  const preparedBy: Signer = record.preparedBy ?? {
    name: PAYSLIP_CONFIG.preparedBy.name,
    role: PAYSLIP_CONFIG.preparedBy.title,
  };
  const signedBy: Signer | null =
    record.signedBy === undefined
      ? { name: PAYSLIP_CONFIG.signedBy.name, role: PAYSLIP_CONFIG.signedBy.title }
      : record.signedBy;

  const monthLabel = new Date(record.periodStart).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const canMarkPaid = record.status !== "Paid" && onMarkPaid;
  const [markingPaid, setMarkingPaid] = useState(false);

  const handleMarkPaid = async () => {
    if (!onMarkPaid) return;
    setMarkingPaid(true);
    try {
      await onMarkPaid();
    } catch {
      // error handled silently — state unchanged
    } finally {
      setMarkingPaid(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[760px] space-y-5">
      <div className="print:hidden flex items-center justify-end gap-2">
        <Badge tone={statusBadgeTone(record.status)} dot>
          {record.status}
        </Badge>
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

      <div className="payslip-sheet print-sheet">
        <header className="payslip-sheet__band">
          <div className="payslip-sheet__band-top">
            <div className="payslip-sheet__company">
              <h1 className="payslip-sheet__company-name">
                {PAYSLIP_CONFIG.companyName}
              </h1>
              <p className="payslip-sheet__company-line">
                {PAYSLIP_CONFIG.addressLine1}
              </p>
              <p className="payslip-sheet__company-line">
                {PAYSLIP_CONFIG.addressLine2}
              </p>
              <p className="payslip-sheet__company-line">{PAYSLIP_CONFIG.phone}</p>
            </div>
            <div className="payslip-sheet__logo-box">
              <Image
                src={PAYSLIP_CONFIG.logoPath}
                alt="Company logo"
                width={500}
                height={500}
              />
            </div>
          </div>
          <div className="payslip-sheet__band-bottom">
            <p className="payslip-sheet__heading">SALARY SLIP</p>            <p className="payslip-sheet__subheading">
              for the Month of{" "}
              <span className="payslip-sheet__subheading-strong">{monthLabel}</span>
            </p>
          </div>
        </header>

        <div className="payslip-sheet__body">
          <div className="payslip-sheet__identity">
            <div>
              <div>
                <p className="payslip-sheet__label">Employee</p>
                <p className="payslip-sheet__name">{employeeName}</p>
              </div>
              <div className="payslip-sheet__identity-field">
                <p className="payslip-sheet__label">Job Position</p>
                <p className="payslip-sheet__role">{jobPosition || "—"}</p>
              </div>
            </div>
            <div>
              <div>
                <p className="payslip-sheet__label">Client</p>
                <p className="payslip-sheet__name">{record.clientName || "—"}</p>
              </div>
              <div className="payslip-sheet__identity-field">
                <p className="payslip-sheet__label">Company</p>
                <p className="payslip-sheet__role">{record.companyName || "—"}</p>
              </div>
            </div>
          </div>
          <div className="payslip-sheet__divider" />
        </div>

        <div className="payslip-sheet__table-wrap">
          <table className="payslip-sheet__table">
            <thead>
              <tr>
                <th>Month/Date Range</th>
                <th className="payslip-sheet__num">Hours</th>
                <th className="payslip-sheet__num">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week.start}>
                  <td>{formatPeriod(week.start, week.end)}</td>
                  <td className="payslip-sheet__num font-mono">
                    {formatHours(week.hours)}
                  </td>
                  <td className="payslip-sheet__num font-mono font-semibold">
                    {formatCurrency(week.earnings)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Total Hours</td>
                <td className="payslip-sheet__num font-mono">
                  {formatHours(totalHours)}
                </td>
                <td className="payslip-sheet__num font-mono">
                  <span className="payslip-sheet__total-salary">Total Salary</span>
                  {formatCurrency(record.gross)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="payslip-sheet__signature">
          <div>
            {preparedBy.name ? (
              <>
                <Image
                  className="payslip-sheet__signature-image"
                  src={PAYSLIP_CONFIG.preparedBy.signaturePath}
                  alt="Prepared by signature"
                  width={178}
                  height={100}
                />
              </>
            ) : (
              <p className="payslip-sheet__signature-name">—</p>
            )}
          </div>
          <div>
            <p className="payslip-sheet__label">Signed by</p>
            {signedBy?.name ? (
              <>
                <Image
                  className="payslip-sheet__signature-image"
                  src={PAYSLIP_CONFIG.signedBy.signaturePath}
                  alt="Signed by signature"
                  width={178}
                  height={100}
                />
                <p className="payslip-sheet__signature-name">{signedBy.name}</p>
                <p className="payslip-sheet__signature-role">{signedBy.role}</p>
              </>
            ) : (
              <p className="payslip-sheet__signature-name">—</p>
            )}
          </div>
        </div>

        <footer className="payslip-sheet__footer-band">
          <p>{PAYSLIP_CONFIG.website}</p>
        </footer>
      </div>

      {canMarkPaid && (
        <div className="print:hidden flex justify-center mt-8">
          <Button
            icon={<IconCheck size={16} />}
            onClick={handleMarkPaid}
            disabled={markingPaid}
          >
            {markingPaid ? "Marking as paid…" : "Mark as paid"}
          </Button>
        </div>
      )}
    </div>
  );
}
