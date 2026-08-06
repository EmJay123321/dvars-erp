"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Invoice } from "@/lib/types";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Modal from "@/components/ui/modal";
import Badge, { statusBadgeTone } from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import Table from "@/components/ui/table";
import { IconPlus, IconReceipt, IconSearch } from "@/components/ui/icons";

interface DraftLine {
  label: string;
  qty: number;
  rate: number;
}

function CreateInvoiceModal({ onClose }: { onClose: () => void }) {
  const { addInvoice } = useData();
  const [clientName, setClientName] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([
    { label: "", qty: 1, rate: 0 },
  ]);

  const updateLine = (index: number, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const total = lines.reduce((sum, line) => sum + (line.qty || 0) * (line.rate || 0), 0);
  const valid = clientName.trim() && dueAt && lines.some((l) => l.label.trim() && l.rate > 0);

  return (
    <Modal
      open
      onClose={onClose}
      title="Create invoice"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!valid}
            onClick={() => {
              addInvoice({
                clientName: clientName.trim(),
                lineItems: lines.filter((l) => l.label.trim()).map((l) => ({ label: l.label.trim(), qty: l.qty || 1, rate: l.rate || 0 })),
                issuedAt: new Date().toISOString(),
                dueAt: new Date(dueAt).toISOString(),
              });
              onClose();
            }}
          >
            Create invoice
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Client / school" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. Dulwich College Shanghai" />
        <Input label="Due date" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">Line items</p>
          <div className="space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-[1fr_64px_96px_28px] items-center gap-2">
                <input
                  value={line.label}
                  onChange={(e) => updateLine(i, { label: e.target.value })}
                  placeholder="Description"
                  className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm focus:border-accent focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  value={line.qty}
                  onChange={(e) => updateLine(i, { qty: Number(e.target.value) })}
                  placeholder="Qty"
                  className="h-9 rounded-lg border border-border bg-surface px-2 text-sm font-mono tabular-nums focus:border-accent focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.rate}
                  onChange={(e) => updateLine(i, { rate: Number(e.target.value) })}
                  placeholder="Rate £"
                  className="h-9 rounded-lg border border-border bg-surface px-2 text-sm font-mono tabular-nums focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                  disabled={lines.length === 1}
                  className="h-9 w-7 rounded-lg text-ink-faint hover:bg-bg hover:text-danger disabled:opacity-30"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLines((prev) => [...prev, { label: "", qty: 1, rate: 0 }])}
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-dark"
          >
            <IconPlus size={14} /> Add line item
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-bg px-4 py-3">
          <span className="text-sm text-ink-muted">Total</span>
          <span className="font-mono text-lg font-semibold tabular-nums text-ink">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </Modal>
  );
}

export default function InvoicesPage() {
  const router = useRouter();
  const { invoices } = useData();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);

  const visible = useMemo(() => {
    let rows = invoices;
    if (statusFilter !== "All") {
      rows = rows.filter((i) => i.status === statusFilter);
    }
    if (query.trim()) {
      rows = rows.filter((i) =>
        i.clientName.toLowerCase().includes(query.toLowerCase()) || i.id.toLowerCase().includes(query.toLowerCase())
      );
    }
    return [...rows].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  }, [invoices, statusFilter, query]);

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
              placeholder="Search client or invoice…"
              className="h-10 w-60 rounded-xl border border-border bg-surface pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-auto!">
            <option>All</option>
            <option>Pending</option>
            <option>Paid</option>
            <option>Overdue</option>
          </Select>
        </div>
        <Button icon={<IconPlus size={16} />} onClick={() => setModalOpen(true)}>
          Create invoice
        </Button>
      </div>

      <Card>
        <Table<Invoice>
          rows={visible}
          rowKey={(i) => i.id}
          onRowClick={(i) => router.push(`/invoices/${i.id}`)}
          empty={
            <EmptyState
              icon={<IconReceipt size={22} />}
              title="No invoices found"
              description="Create an invoice to bill a school client."
            />
          }
          columns={[
            {
              key: "id",
              header: "Invoice",
              render: (i) => <span className="font-mono text-sm font-semibold text-ink">{i.id}</span>,
            },
            {
              key: "client",
              header: "Client",
              render: (i) => <span className="font-medium text-ink">{i.clientName}</span>,
            },
            {
              key: "issued",
              header: "Issued",
              render: (i) => <span className="text-ink-muted">{formatDate(i.issuedAt)}</span>,
            },
            {
              key: "due",
              header: "Due",
              render: (i) => <span className="text-ink-muted">{formatDate(i.dueAt)}</span>,
            },
            {
              key: "amount",
              header: "Amount",
              className: "text-right",
              render: (i) => (
                <span className="font-mono font-semibold tabular-nums text-ink">
                  {formatCurrency(i.amount)}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (i) => <Badge tone={statusBadgeTone(i.status)} dot>{i.status}</Badge>,
            },
          ]}
        />
      </Card>

      {modalOpen && <CreateInvoiceModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
