"use client";

import { createRef, useMemo, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/lib/store";
import { formatCurrency, formatHours, formatPeriod, monthOptions, weekRangesForMonth } from "@/lib/format";
import type { PayrollRecord } from "@/lib/types";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Modal from "@/components/ui/modal";
import Badge, { statusBadgeTone } from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import Table from "@/components/ui/table";
import {
  IconPlus,
  IconUpload,
  IconSearch,
  IconFileText,
  IconTrash,
} from "@/components/ui/icons";

interface WeekRowRefs {
  key: number;
  start: RefObject<HTMLInputElement | null>;
  end: RefObject<HTMLInputElement | null>;
  hours: RefObject<HTMLInputElement | null>;
  earnings: RefObject<HTMLInputElement | null>;
  defaultStart: string;
  defaultEnd: string;
}

let weekRowKeySeq = 0;

function buildWeekRows(monthValue: string): WeekRowRefs[] {
  const [year, month] = monthValue.split("-").map(Number);
  return weekRangesForMonth(year, month - 1).map((range) => ({
    key: (weekRowKeySeq += 1),
    start: createRef<HTMLInputElement>(),
    end: createRef<HTMLInputElement>(),
    hours: createRef<HTMLInputElement>(),
    earnings: createRef<HTMLInputElement>(),
    defaultStart: range.start,
    defaultEnd: range.end,
  }));
}

function buildEmptyWeekRow(): WeekRowRefs {
  return {
    key: (weekRowKeySeq += 1),
    start: createRef<HTMLInputElement>(),
    end: createRef<HTMLInputElement>(),
    hours: createRef<HTMLInputElement>(),
    earnings: createRef<HTMLInputElement>(),
    defaultStart: "",
    defaultEnd: "",
  };
}

function RunPayrollModal({ onClose }: { onClose: () => void }) {
  const { employees, clients, addPayroll, currentUser } = useData();
  const [employeeId, setEmployeeId] = useState("");
  const [clientId, setClientId] = useState("");
  const [monthValue, setMonthValue] = useState(monthOptions()[0].value);
  const [rows, setRows] = useState<WeekRowRefs[]>(() =>
    buildWeekRows(monthOptions()[0].value)
  );
  const [, forceRender] = useState(0);
  const [preparedByName, setPreparedByName] = useState(currentUser?.name ?? "");
  const [preparedByRole, setPreparedByRole] = useState(currentUser?.role ?? "");
  const [signedByName, setSignedByName] = useState("");
  const [signedByRole, setSignedByRole] = useState("");
  const [payNow, setPayNow] = useState(false);

  const activeEmployees = employees.filter((e) => e.status === "Active");

  const selectedEmployee = activeEmployees.find((e) => e.id === employeeId);
  const selectedClient = clients.find((c) => c.id === clientId);

  const months = monthOptions(12);

  // Weekly inputs are uncontrolled so typing never reconciles input values —
  // totals and validation are derived straight from the DOM on each render,
  // with onChange only nudging a re-render to refresh them.
  const refresh = () => forceRender((n) => n + 1);

  let totalHours = 0;
  let totalSalary = 0;
  let filledWeeks = 0;
  for (const row of rows) {
    const hours = Number(row.hours.current?.value) || 0;
    const earnings = Number(row.earnings.current?.value) || 0;
    const start = row.start.current?.value ?? "";
    const end = row.end.current?.value ?? "";
    totalHours += hours;
    totalSalary += earnings;
    if (start && end && hours > 0 && earnings > 0) {
      filledWeeks += 1;
    }
  }

  const canSubmit =
    Boolean(employeeId) &&
    Boolean(clientId) &&
    Boolean(monthValue) &&
    filledWeeks > 0;

  const addWeek = () => {
    setRows((prev) => [...prev, buildEmptyWeekRow()]);
  };

  const removeWeek = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMonthChange = (value: string) => {
    setMonthValue(value);
    setRows(buildWeekRows(value));
  };

  const handleSubmit = () => {
    addPayroll({
      employeeId,
      monthValue,
      weeks: rows
        .map((r) => ({
          start: r.start.current?.value ?? "",
          end: r.end.current?.value ?? "",
          hours: Number(r.hours.current?.value) || 0,
          earnings: Number(r.earnings.current?.value) || 0,
        }))
        .filter(
          (w) => w.start && w.end && w.hours > 0 && w.earnings > 0
        ),
      status: payNow ? "Paid" : "Pending",
      clientName: selectedClient?.clientName,
      companyName: selectedClient?.companyName || undefined,
      preparedBy: { name: preparedByName.trim(), role: preparedByRole.trim() },
      signedBy: signedByName.trim()
        ? { name: signedByName.trim(), role: signedByRole.trim() }
        : null,
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title="Run payroll"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={handleSubmit}>
            Create payslip
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <section>
          <p className="font-display text-sm font-semibold text-ink">
            Employee &amp; client
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Select
              label="Employee"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Select an employee…</option>
              {activeEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.department}
                </option>
              ))}
            </Select>
            <Select
              label="Client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">Select a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.clientName}
                  {c.companyName ? ` — ${c.companyName}` : ""}
                </option>
              ))}
            </Select>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Job Position
              </span>
              <div className="flex h-10 items-center rounded-xl border border-border bg-bg/60 px-3 text-sm text-ink-muted">
                {selectedEmployee?.department || "—"}
              </div>
              <span className="mt-1 block text-xs text-ink-faint">
                Auto-filled from the employee&apos;s record
              </span>
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Company
              </span>
              <div className="flex h-10 items-center rounded-xl border border-border bg-bg/60 px-3 text-sm text-ink-muted">
                {selectedClient?.companyName || "—"}
              </div>
              <span className="mt-1 block text-xs text-ink-faint">
                Auto-filled from the client&apos;s record
              </span>
            </div>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-sm font-semibold text-ink">
                Weekly hours &amp; earnings
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Date ranges are suggested from the pay period — edit them for
                partial weeks. Total salary becomes the gross pay that tax,
                National Insurance and pension are calculated from.
              </p>
            </div>
            <div className="w-48">
              <Select
                label="Pay period"
                value={monthValue}
                onChange={(e) => handleMonthChange(e.target.value)}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-bg">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Date range
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Hours
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Earnings
                  </th>
                  <th className="w-12 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.key} className="border-t border-border">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          ref={row.start}
                          defaultValue={row.defaultStart}
                          className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 text-xs text-ink focus:border-accent focus:outline-none"
                        />
                        <span className="text-ink-faint">→</span>
                        <input
                          type="date"
                          ref={row.end}
                          defaultValue={row.defaultEnd}
                          className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-surface px-2 text-xs text-ink focus:border-accent focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        ref={row.hours}
                        defaultValue=""
                        onChange={refresh}
                        placeholder="0"
                        className="h-8 w-full min-w-0 rounded-lg border border-border bg-surface px-2 text-right font-mono text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        ref={row.earnings}
                        defaultValue=""
                        onChange={refresh}
                        placeholder="0.00"
                        className="h-8 w-full min-w-0 rounded-lg border border-border bg-surface px-2 text-right font-mono text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                      />
                    </td>
                    <td className="px-2 py-2 text-right">
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWeek(index)}
                          aria-label="Remove week"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-danger/10 hover:text-danger"
                        >
                          <IconTrash size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-bg">
                  <td className="px-4 py-2.5 text-sm font-semibold text-ink">
                    Total
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold tabular-nums text-ink">
                    {formatHours(totalHours)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold tabular-nums text-ink">
                    {formatCurrency(totalSalary)}
                  </td>
                  <td className="px-2 py-2.5" />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<IconPlus size={14} />}
              onClick={addWeek}
            >
              Add week
            </Button>
          </div>
        </section>

        <section>
          <p className="font-display text-sm font-semibold text-ink">
            Approval
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Input
              label="Prepared by — name"
              value={preparedByName}
              onChange={(e) => setPreparedByName(e.target.value)}
              hint="Defaults to the person running payroll"
            />
            <Input
              label="Prepared by — role"
              value={preparedByRole}
              onChange={(e) => setPreparedByRole(e.target.value)}
            />
            <Input
              label="Signed by / Approved by — name"
              value={signedByName}
              onChange={(e) => setSignedByName(e.target.value)}
              hint="Left blank until an approver signs off"
            />
            <Input
              label="Signed by / Approved by — role"
              value={signedByRole}
              onChange={(e) => setSignedByRole(e.target.value)}
            />
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2.5 rounded-xl border border-border px-3 py-2.5">
            <input
              type="checkbox"
              checked={payNow}
              onChange={(e) => setPayNow(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            <span className="text-sm text-ink">Mark as paid now</span>
          </label>
        </section>
      </div>
    </Modal>
  );
}

export default function PayrollPage() {
  const router = useRouter();
  const { payroll, employees, currentUser } = useData();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);

  const isAdmin = currentUser?.role === "Admin";

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => map.set(e.id, e.name));
    return map;
  }, [employees]);

  const employeeName = (id: string) => nameById.get(id) ?? "Unknown";

  const visible = useMemo(() => {
    let rows = payroll;
    if (!isAdmin && currentUser) {
      rows = rows.filter((p) => p.employeeId === currentUser.id);
    }
    if (statusFilter !== "All") {
      rows = rows.filter((p) => p.status === statusFilter);
    }
    if (query.trim()) {
      rows = rows.filter((p) =>
        (nameById.get(p.employeeId) ?? "Unknown")
          .toLowerCase()
          .includes(query.toLowerCase())
      );
    }
    return [...rows].sort((a, b) => b.periodStart.localeCompare(a.periodStart));
  }, [payroll, currentUser, isAdmin, statusFilter, query, nameById]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
              <IconSearch size={15} />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isAdmin ? "Search employee…" : "Search periods…"}
              className="h-10 w-56 rounded-xl border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto!">
            <option>All</option>
            <option>Pending</option>
            <option>Paid</option>
          </Select>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={<IconUpload size={15} />}
              disabled
              title="CSV import arrives with the backend"
            >
              Import CSV
            </Button>
            <Button icon={<IconPlus size={16} />} onClick={() => setModalOpen(true)}>
              Run payroll
            </Button>
          </div>
        )}
      </div>

      <Card>
        <Table<PayrollRecord>
          rows={visible}
          rowKey={(p) => p.id}
          onRowClick={(p) => router.push(`/payroll/${p.id}`)}
          empty={
            <EmptyState
              icon={<IconFileText size={22} />}
              title="No payroll records found"
              description={
                isAdmin
                  ? "Run payroll to generate the first payslips."
                  : "You don't have any payslips yet."
              }
            />
          }
          columns={[
            {
              key: "employee",
              header: "Employee",
              render: (p) => {
                const emp = employees.find((e) => e.id === p.employeeId);
                return (
                  <div>
                    <p className="font-medium text-ink">{employeeName(p.employeeId)}</p>
                    <p className="text-xs text-ink-faint">{emp?.department}</p>
                  </div>
                );
              },
            },
            {
              key: "period",
              header: "Period",
              render: (p) => (
                <span className="text-ink-muted">{formatPeriod(p.periodStart, p.periodEnd)}</span>
              ),
            },
            {
              key: "gross",
              header: "Gross",
              className: "text-right",
              render: (p) => (
                <span className="font-mono tabular-nums text-ink">{formatCurrency(p.gross)}</span>
              ),
            },
            {
              key: "net",
              header: "Net",
              className: "text-right",
              render: (p) => (
                <span className="font-mono font-semibold tabular-nums text-ink">
                  {formatCurrency(p.net)}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (p) => <Badge tone={statusBadgeTone(p.status)} dot>{p.status}</Badge>,
            },
          ]}
        />
      </Card>

      {modalOpen && <RunPayrollModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
