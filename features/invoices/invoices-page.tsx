"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/lib/store";
import { formatUSD, formatDate } from "@/lib/format";
import type { Invoice } from "@/lib/types";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Select from "@/components/ui/select";
import Badge, { statusBadgeTone } from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import Table from "@/components/ui/table";
import { IconPlus, IconReceipt, IconSearch } from "@/components/ui/icons";
import InvoiceTemplateModal from "./invoice-template-modal";

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
      const q = query.trim().toLowerCase();
      rows = rows.filter(
        (i) =>
          i.clientName.toLowerCase().includes(q) ||
          (i.number ?? i.id).toLowerCase().includes(q) ||
          i.id.toLowerCase().includes(q)
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
              render: (i) => <span className="font-mono text-sm font-semibold text-ink">{i.number ?? i.id}</span>,
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
                  {formatUSD(i.amount)}
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

      {modalOpen && <InvoiceTemplateModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
