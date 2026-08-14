"use client";

import { useMemo, useState } from "react";
import {
  revenueByMonth,
  expensesByMonth,
  expenseCategories,
} from "@/lib/mock";
import { formatCurrency, formatWhole } from "@/lib/format";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import LineChart from "@/components/ui/chart";
import { IconDownload, IconPrinter } from "@/components/ui/icons";

type Tab = "income" | "expenses" | "pnl";

const tabs: { id: Tab; label: string }[] = [
  { id: "income", label: "Income" },
  { id: "expenses", label: "Expenses" },
  { id: "pnl", label: "P&L" },
];

function ExportButtons() {
  return (
    <div className="flex gap-2">
      <Button variant="secondary" size="sm" icon={<IconDownload size={15} />} disabled title="CSV export arrives with the backend">
        Export CSV
      </Button>
      <Button variant="secondary" size="sm" icon={<IconPrinter size={15} />} onClick={() => window.print()}>
        Print
      </Button>
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("income");

  const totals = useMemo(() => {
    const income = revenueByMonth.reduce((s, m) => s + m.value, 0);
    const expense = expensesByMonth.reduce((s, m) => s + m.value, 0);
    return { income, expense, net: income - expense };
  }, []);

  const maxCategory = Math.max(...expenseCategories.map((c) => c.value), 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id ? "bg-accent text-ink" : "text-ink-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <ExportButtons />
      </div>

      {tab === "income" && (
        <Card title="Monthly income" action={<span className="text-xs text-ink-faint">Mar – Aug 2026</span>}>
          <div className="p-5">
            <LineChart
              labels={revenueByMonth.map((r) => r.month.split(" ")[0])}
              series={[{ name: "Income", color: "#1DC8CD", values: revenueByMonth.map((r) => r.value) }]}
            />
          </div>
          <div className="grid gap-4 border-t border-border px-5 py-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-ink-muted">Total income</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-ink">
                {formatCurrency(totals.income)}
              </p>
            </div>
            <div>
              <p className="text-sm text-ink-muted">Average per month</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-ink">
                {formatCurrency(
                  Math.round(revenueByMonth.length > 0 ? totals.income / revenueByMonth.length : 0)
                )}
              </p>
            </div>
          </div>
        </Card>
      )}

      {tab === "expenses" && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="Expenses by month" action={<span className="text-xs text-ink-faint">Mar – Aug 2026</span>}>
            <div className="p-5">
              <LineChart
                labels={expensesByMonth.map((r) => r.month.split(" ")[0])}
                series={[{ name: "Expenses", color: "#9CA3AF", values: expensesByMonth.map((r) => r.value) }]}
              />
            </div>
          </Card>

          <Card title="Breakdown by category" action={<span className="text-xs text-ink-faint">6-month total</span>}>
            <div className="space-y-4 p-5">
              {expenseCategories.map((cat) => (
                <div key={cat.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-ink-muted">{cat.name}</span>
                    <span className="font-mono tabular-nums text-ink">{formatWhole(cat.value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-bg">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(cat.value / maxCategory) * 100}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-medium text-ink">Total expenses</span>
                <span className="font-mono font-semibold tabular-nums text-ink">
                  {formatCurrency(totals.expense)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "pnl" && (
        <div className="space-y-4">
          <Card title="Profit & loss" action={<span className="text-xs text-ink-faint">Mar – Aug 2026</span>}>
            <div className="p-5">
              <LineChart
                labels={revenueByMonth.map((r) => r.month.split(" ")[0])}
                series={[
                  { name: "Income", color: "#1DC8CD", values: revenueByMonth.map((r) => r.value) },
                  { name: "Expenses", color: "#9CA3AF", values: expensesByMonth.map((r) => r.value) },
                  {
                    name: "Net",
                    color: "#D97706",
                    values: revenueByMonth.map((r, i) => r.value - expensesByMonth[i].value),
                  },
                ]}
              />
            </div>
          </Card>

          <Card>
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <div>
                <p className="text-sm text-ink-muted">Income</p>
                <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">
                  {formatCurrency(totals.income)}
                </p>
              </div>
              <div>
                <p className="text-sm text-ink-muted">Expenses</p>
                <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">
                  {formatCurrency(totals.expense)}
                </p>
              </div>
              <div>
                <p className="text-sm text-ink-muted">Net profit</p>
                <p className={`mt-1 font-mono text-xl font-semibold tabular-nums ${totals.net >= 0 ? "text-ok" : "text-danger"}`}>
                  {formatCurrency(totals.net)}
                </p>
                <p className="text-xs text-ink-faint">
                  {totals.income > 0
                    ? `${((totals.net / totals.income) * 100).toFixed(1)}% margin`
                    : "0.0% margin"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
