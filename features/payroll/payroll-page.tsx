"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useData, salaryByEmployeeId } from "@/lib/store";
import { formatCurrency, formatPeriod, monthOptions } from "@/lib/format";
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
} from "@/components/ui/icons";

function RunPayrollModal({ onClose }: { onClose: () => void }) {
  const { employees, addPayroll } = useData();
  const [employeeId, setEmployeeId] = useState("");
  const [monthValue, setMonthValue] = useState(monthOptions()[0].value);
  const [gross, setGross] = useState("");
  const [payNow, setPayNow] = useState(false);

  const activeEmployees = employees.filter((e) => e.status === "Active");

  const selectedEmployee = activeEmployees.find((e) => e.id === employeeId);
  const suggestedGross = selectedEmployee ? salaryByEmployeeId[selectedEmployee.id] ?? 0 : 0;

  const months = monthOptions(12);

  const canSubmit = employeeId && gross && Number(gross) > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title="Run payroll"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => {
              addPayroll({
                employeeId,
                monthValue,
                gross: Number(gross),
                status: payNow ? "Paid" : "Pending",
              });
              onClose();
            }}
          >
            Create payslip
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Employee"
          value={employeeId}
          onChange={(e) => {
            setEmployeeId(e.target.value);
            const emp = activeEmployees.find((x) => x.id === e.target.value);
            if (emp) {
              setGross(String(salaryByEmployeeId[emp.id] ?? 0));
            }
          }}
        >
          <option value="">Select an employee…</option>
          {activeEmployees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} — {emp.department}
            </option>
          ))}
        </Select>

        <Select label="Pay period" value={monthValue} onChange={(e) => setMonthValue(e.target.value)}>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>

        <Input
          label="Gross pay (£)"
          type="number"
          min="0"
          step="0.01"
          value={gross}
          onChange={(e) => setGross(e.target.value)}
          hint={selectedEmployee ? `Suggested base: ${formatCurrency(suggestedGross)}` : undefined}
        />

        <p className="text-xs text-ink-faint">
          Deductions (income tax, National Insurance, pension) are calculated
          automatically and shown on the payslip.
        </p>

        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border px-3 py-2.5">
          <input
            type="checkbox"
            checked={payNow}
            onChange={(e) => setPayNow(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          <span className="text-sm text-ink">Mark as paid now</span>
        </label>
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
