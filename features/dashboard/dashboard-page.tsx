"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useData } from "@/lib/store";
import { revenueByMonth, expensesByMonth } from "@/lib/mock";
import { DEFAULT_PREFERENCES } from "@/lib/types";
import {
  convertCurrency,
  formatCurrencyPref,
  formatDateTimePref,
  formatPeriodPref,
} from "@/lib/format";
import KpiCard from "@/components/ui/kpi-card";
import AnimatedNumber from "@/components/ui/animated-number";
import Card from "@/components/ui/card";
import LineChart from "@/components/ui/chart";
import Badge, { statusBadgeTone } from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import {
  IconGrid,
  IconFileText,
  IconReceipt,
  IconWallet,
  IconTrendingUp,
  IconClock,
  IconChart,
} from "@/components/ui/icons";

function AdminDashboard() {
  const { employees, payroll, invoices, activity, currentUser } = useData();
  const { displayCurrency: currency, dateFormat } =
    currentUser?.preferences ?? DEFAULT_PREFERENCES;

  const activeEmployees = employees.filter((e) => e.status === "Active").length;

  const augNet = payroll
    .filter((p) => p.periodStart.startsWith("2026-08"))
    .reduce((sum, p) => sum + p.net, 0);

  const openInvoices = invoices
    .filter((i) => i.status !== "Paid")
    .reduce((sum, i) => sum + i.amount, 0);

  const revenue = invoices
    .filter((i) => i.status === "Paid")
    .reduce((sum, i) => sum + i.amount, 0);

  const totalExpenses = expensesByMonth.reduce((sum, e) => sum + e.value, 0);

  const paidCount = invoices.filter((i) => i.status === "Paid").length;
  const openCount = invoices.length - paidCount;

  const currencyFmt = useMemo(() => {
    const fmt = (gbp: number) =>
      formatCurrencyPref(gbp, currency).replace(/^[^\d]*/, "");
    const sym = formatCurrencyPref(0, currency).replace(/[\d.,\s]/g, "");
    return (gbp: number) => sym + fmt(gbp);
  }, [currency]);

  const convertedAugNet = useMemo(() => convertCurrency(augNet, currency), [augNet, currency]);
  const convertedOpen = useMemo(() => convertCurrency(openInvoices, currency), [openInvoices, currency]);
  const convertedRevenue = useMemo(() => convertCurrency(revenue, currency), [revenue, currency]);
  const convertedExpenses = useMemo(() => convertCurrency(totalExpenses, currency), [totalExpenses, currency]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Active employees"
          valueNumber={activeEmployees}
          valueFormat={(n) => String(Math.round(n))}
          sub={`${employees.length} total on record`}
          tone="accent"
          category="teal"
          icon={<IconGrid size={18} />}
        />
        <KpiCard
          label="Payroll · August 2026"
          valueNumber={convertedAugNet}
          valueFormat={currencyFmt}
          sub="Net after tax & deductions"
          tone="neutral"
          category="blue"
          icon={<IconWallet size={18} />}
        />
        <KpiCard
          label="Outstanding invoices"
          valueNumber={convertedOpen}
          valueFormat={currencyFmt}
          sub={`${openCount} pending / overdue`}
          tone="warn"
          category="amber"
          icon={<IconReceipt size={18} />}
        />
        <KpiCard
          label="Revenue collected"
          valueNumber={convertedRevenue}
          valueFormat={currencyFmt}
          sub={`${paidCount} invoices marked paid`}
          tone="ok"
          category="blue"
          icon={<IconTrendingUp size={18} />}
        />
        <KpiCard
          label="Total expenses (6 mo)"
          valueNumber={convertedExpenses}
          valueFormat={currencyFmt}
          sub="Salaries, software, marketing, travel"
          tone="neutral"
          category="blue"
          icon={<IconChart size={18} />}
        />
        <KpiCard
          label="Paid vs pending"
          value={`${paidCount} / ${openCount}`}
          sub="Invoices settled vs outstanding"
          tone="neutral"
          category="amber"
          icon={<IconFileText size={18} />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card
          title="Revenue vs expenses"
          className="xl:col-span-2 bg-cat-blue-soft"
          action={
            <Link
              href="/reports"
              className="text-sm font-medium text-accent-dark hover:text-ink"
            >
              Full reports →
            </Link>
          }
        >
          <div className="p-5">
            <LineChart
              labels={revenueByMonth.map((r) => r.month.split(" ")[0])}
              series={[
                { name: "Revenue", color: "#1DC8CD", values: revenueByMonth.map((r) => r.value) },
                { name: "Expenses", color: "#9CA3AF", values: expensesByMonth.map((r) => r.value) },
              ]}
            />
          </div>
        </Card>

        <Card title="Recent activity">
          <ul className="divide-y divide-border">
            {activity.slice(0, 6).map((entry) => (
              <li key={entry.id} className="flex gap-3 px-5 py-3">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-dark">
                  <IconClock size={14} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm leading-snug text-ink">{entry.description}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {entry.actor} · {formatDateTimePref(entry.createdAt, dateFormat)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const { payroll, currentUser } = useData();
  const { displayCurrency: currency, dateFormat } =
    currentUser?.preferences ?? DEFAULT_PREFERENCES;

  const myRecords = payroll
    .filter((p) => p.employeeId === currentUser?.id)
    .sort((a, b) => b.periodStart.localeCompare(a.periodStart));

  const latest = myRecords[0];
  const ytdNet = myRecords.reduce((sum, p) => sum + p.net, 0);
  const paidCount = myRecords.filter((p) => p.status === "Paid").length;

  const currencyFmt = useMemo(() => {
    const fmt = (gbp: number) =>
      formatCurrencyPref(gbp, currency).replace(/^[^\d]*/, "");
    const sym = formatCurrencyPref(0, currency).replace(/[\d.,\s]/g, "");
    return (gbp: number) => sym + fmt(gbp);
  }, [currency]);

  const convertedLatest = useMemo(() => (latest ? convertCurrency(latest.net, currency) : 0), [latest, currency]);
  const convertedYtd = useMemo(() => convertCurrency(ytdNet, currency), [ytdNet, currency]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Latest net pay"
          valueNumber={latest ? convertedLatest : undefined}
          valueFormat={latest ? currencyFmt : undefined}
          value={latest ? undefined : "\u2014"}
          sub={latest ? formatPeriodPref(latest.periodStart, latest.periodEnd, dateFormat) : "No records yet"}
          tone="accent"
          icon={<IconWallet size={18} />}
        />
        <KpiCard
          label="Total payslips"
          valueNumber={myRecords.length}
          valueFormat={(n) => String(Math.round(n))}
          sub={`${paidCount} paid`}
          tone="neutral"
          icon={<IconFileText size={18} />}
        />
        <KpiCard
          label="YTD net income"
          valueNumber={convertedYtd}
          valueFormat={currencyFmt}
          sub="All recorded periods"
          tone="ok"
          icon={<IconTrendingUp size={18} />}
        />
      </div>

      <Card title="Your payslips" action={<Link href="/payroll" className="text-sm font-medium text-accent-dark hover:text-ink">View all →</Link>}>
        {myRecords.length === 0 ? (
          <EmptyState title="No payslips yet" description="Payslips will appear here once payroll has been run." />
        ) : (
          <ul className="divide-y divide-border">
            {myRecords.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/payroll/${p.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-bg"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {formatPeriodPref(p.periodStart, p.periodEnd, dateFormat)}
                    </p>
                    <p className="text-xs text-ink-faint">
                      Gross{" "}
                      <AnimatedNumber
                        value={convertCurrency(p.gross, currency)}
                        format={currencyFmt}
                        duration={750}
                      />{" "}
                      · Paid on{" "}
                      {p.paidAt ? formatDateTimePref(p.paidAt, dateFormat) : "\u2014"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                      <AnimatedNumber
                        value={convertCurrency(p.net, currency)}
                        format={currencyFmt}
                        duration={750}
                      />
                    </span>
                    <Badge tone={statusBadgeTone(p.status)}>{p.status}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser } = useData();
  if (!currentUser) return null;
  return currentUser.role === "Admin" || currentUser.role === "Sub-admin" ? <AdminDashboard /> : <EmployeeDashboard />;
}
