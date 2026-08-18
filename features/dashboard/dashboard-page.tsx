"use client";

import Link from "next/link";
import { useData } from "@/lib/store";
import { revenueByMonth, expensesByMonth } from "@/lib/mock";
import { formatCurrency, formatDateTime, formatPeriod } from "@/lib/format";
import KpiCard from "@/components/ui/kpi-card";
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
  const { employees, payroll, invoices, activity } = useData();

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Active employees"
          value={String(activeEmployees)}
          sub={`${employees.length} total on record`}
          tone="accent"
          icon={<IconGrid size={18} />}
        />
        <KpiCard
          label="Payroll · August 2026"
          value={formatCurrency(augNet)}
          sub="Net after tax & deductions"
          tone="neutral"
          icon={<IconWallet size={18} />}
        />
        <KpiCard
          label="Outstanding invoices"
          value={formatCurrency(openInvoices)}
          sub={`${openCount} pending / overdue`}
          tone="warn"
          icon={<IconReceipt size={18} />}
        />
        <KpiCard
          label="Revenue collected"
          value={formatCurrency(revenue)}
          sub={`${paidCount} invoices marked paid`}
          tone="ok"
          icon={<IconTrendingUp size={18} />}
        />
        <KpiCard
          label="Total expenses (6 mo)"
          value={formatCurrency(totalExpenses)}
          sub="Salaries, software, marketing, travel"
          tone="neutral"
          icon={<IconChart size={18} />}
        />
        <KpiCard
          label="Paid vs pending"
          value={`${paidCount} / ${openCount}`}
          sub="Invoices settled vs outstanding"
          tone="neutral"
          icon={<IconFileText size={18} />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card
          title="Revenue vs expenses"
          className="xl:col-span-2"
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
                    {entry.actor} · {formatDateTime(entry.createdAt)}
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
  const myRecords = payroll
    .filter((p) => p.employeeId === currentUser?.id)
    .sort((a, b) => b.periodStart.localeCompare(a.periodStart));

  const latest = myRecords[0];
  const ytdNet = myRecords.reduce((sum, p) => sum + p.net, 0);
  const paidCount = myRecords.filter((p) => p.status === "Paid").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Latest net pay"
          value={latest ? formatCurrency(latest.net) : "—"}
          sub={latest ? formatPeriod(latest.periodStart, latest.periodEnd) : "No records yet"}
          tone="accent"
          icon={<IconWallet size={18} />}
        />
        <KpiCard
          label="Total payslips"
          value={String(myRecords.length)}
          sub={`${paidCount} paid`}
          tone="neutral"
          icon={<IconFileText size={18} />}
        />
        <KpiCard
          label="YTD net income"
          value={formatCurrency(ytdNet)}
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
                      {formatPeriod(p.periodStart, p.periodEnd)}
                    </p>
                    <p className="text-xs text-ink-faint">
                      Gross {formatCurrency(p.gross)} · Paid on{" "}
                      {p.paidAt ? formatDateTime(p.paidAt) : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                      {formatCurrency(p.net)}
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
