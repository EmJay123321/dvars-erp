"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useData } from "@/lib/store";
import type { Client, DirectoryStatus, VA } from "@/lib/types";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Badge, { statusBadgeTone } from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import Select from "@/components/ui/select";
import {
  IconArchive,
  IconContact,
  IconEdit,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUsers,
} from "@/components/ui/icons";
import ConfirmDeleteModal from "@/components/ui/confirm-delete-modal";
import { useToast } from "@/components/ui/toast";
import {
  deleteDirectoryRecord,
  getLinkedRecordCounts,
  linkedRecordDescription,
} from "@/lib/directory-delete";
import { nextInvoiceNumber } from "@/lib/invoice";
import DirectoryRecordModal from "./directory-record-modal";

type TabKey = "clients" | "vas";
type StatusFilter = "All" | DirectoryStatus;

const tabs: { key: TabKey; label: string }[] = [
  { key: "clients", label: "Clients" },
  { key: "vas", label: "VAs" },
];

function formatUSD(value: number): string {
  return "$" + value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatPHP(value: number): string {
  return "₱" + value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function DirectoryPage() {
  const {
    clients,
    vas,
    invoices,
    payroll,
    setClientStatus,
    setVAStatus,
    deleteClient,
    deleteVA,
    restoreClient,
    restoreVA,
  } = useData();
  const { show: showToast } = useToast();
  const [tab, setTab] = useState<TabKey>("clients");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [modal, setModal] = useState<
    { mode: TabKey; record?: Client | VA } | null
  >(null);
  const [confirm, setConfirm] = useState<{
    mode: TabKey;
    record: Client | VA;
  } | null>(null);

  const clientById = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients]
  );

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (status !== "All" && c.status !== status) return false;
      if (!q) return true;
      return [c.clientName, c.companyName, c.leadManagerName, c.contactPerson, c.email]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [clients, query, status]);

  const filteredVAs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vas.filter((v) => {
      if (status !== "All" && v.status !== status) return false;
      if (!q) return true;
      const clientNames = (v.assignedClientIds ?? [])
        .map((id) => clientById.get(id)?.clientName ?? "")
        .join(" ");
      return [v.vaName, v.vaRole, v.email, clientNames]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [vas, query, status, clientById]);

  const toggleStatus = (record: Client | VA) => {
    const next: DirectoryStatus = record.status === "Active" ? "Inactive" : "Active";
    if ("clientName" in record) {
      setClientStatus(record.id, next);
    } else {
      setVAStatus(record.id, next);
    }
  };

  const confirmLinked = confirm
    ? getLinkedRecordCounts(confirm.record, invoices, payroll)
    : null;

  const handleConfirmDelete = () => {
    if (!confirm) return;
    const { mode, record } = confirm;
    setConfirm(null);
    void deleteDirectoryRecord(record).then(() => {
      if (mode === "clients") {
        deleteClient(record.id);
        showToast("Client deleted", {
          actionLabel: "Undo",
          onAction: () => restoreClient(record as Client),
        });
      } else {
        deleteVA(record.id);
        showToast("VA deleted", {
          actionLabel: "Undo",
          onAction: () => restoreVA(record as VA),
        });
      }
    });
  };

  const handleArchiveFromConfirm = () => {
    if (!confirm) return;
    toggleStatus(confirm.record);
    setConfirm(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Directory</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Manage clients and the VAs assigned to them
          </p>
        </div>
        <Button
          icon={<IconPlus size={15} />}
          onClick={() => setModal({ mode: tab })}
        >
          Add {tab === "clients" ? "client" : "VA"}
        </Button>
      </div>

      <div className="inline-flex rounded-full border border-border bg-surface p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key);
              setQuery("");
              setStatus("All");
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-accent text-ink shadow-sm" : "text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <IconSearch
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${tab === "clients" ? "clients" : "VAs"}...`}
            className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="w-40"
        >
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {tab === "clients" ? (
          <ClientTable
            clients={filteredClients}
            total={clients.length}
            onAdd={() => setModal({ mode: "clients" })}
            onEdit={(c) => setModal({ mode: "clients", record: c })}
            onToggle={toggleStatus}
            onDelete={(c) => setConfirm({ mode: "clients", record: c })}
          />
        ) : (
          <VATable
            vas={filteredVAs}
            total={vas.length}
            clientById={clientById}
            onAdd={() => setModal({ mode: "vas" })}
            onEdit={(v) => setModal({ mode: "vas", record: v })}
            onToggle={toggleStatus}
            onDelete={(v) => setConfirm({ mode: "vas", record: v })}
          />
        )}
      </Card>

      {modal && (
        <DirectoryRecordModal
          mode={modal.mode === "clients" ? "client" : "va"}
          record={modal.record}
          onClose={() => setModal(null)}
          onSaved={() => setModal(null)}
        />
      )}

      {confirm && confirmLinked && (
        <ConfirmDeleteModal
          open
          title={`Delete ${confirm.mode === "clients" ? "client" : "VA"}?`}
          body={
            <>
              Permanently delete{" "}
              <span className="font-medium text-ink">
                &ldquo;
                {"clientName" in confirm.record
                  ? confirm.record.clientName
                  : confirm.record.vaName}
                &rdquo;
              </span>
              ? This cannot be undone.
            </>
          }
          warning={
            confirmLinked.total > 0 ? (
              <>
                This {confirm.mode === "clients" ? "client" : "VA"} has{" "}
                <span className="font-semibold">
                  {linkedRecordDescription(confirmLinked)}
                </span>{" "}
                and cannot be deleted. Archive it instead to keep its history safe.
              </>
            ) : undefined
          }
          onArchive={handleArchiveFromConfirm}
          onCancel={() => setConfirm(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-ink-faint">
        <EmptyState title={label} description="Try adjusting your search or filters." />
      </td>
    </tr>
  );
}

function StartEmptyRow({
  colSpan,
  icon,
  title,
  description,
  action,
}: {
  colSpan: number;
  icon: ReactNode;
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8">
        <EmptyState icon={icon} title={title} description={description} action={action} />
      </td>
    </tr>
  );
}

function ClientTable({
  clients,
  total,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
}: {
  clients: Client[];
  total: number;
  onAdd: () => void;
  onEdit: (client: Client) => void;
  onToggle: (record: Client | VA) => void;
  onDelete: (client: Client) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Client
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Assigned VA
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-faint md:table-cell">
              Contact
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Bill rate (USD)
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {clients.length === 0 ? (
            total === 0 ? (
              <StartEmptyRow
                colSpan={6}
                icon={<IconContact size={22} />}
                title="No clients yet"
                description="Add your first client to start building the directory."
                action={
                  <Button icon={<IconPlus size={15} />} onClick={onAdd}>
                    Add client
                  </Button>
                }
              />
            ) : (
              <EmptyRow colSpan={6} label="No clients found." />
            )
          ) : (
            clients.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-bg/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{c.clientName}</p>
                    {c.companyName && (
                      <p className="text-xs text-ink-faint">{c.companyName}</p>
                    )}
                    <p className="mt-1">
                      {c.invoiceNumbering ? (
                        <span className="font-mono text-xs font-semibold text-accent-dark">
                          Next: {nextInvoiceNumber(c.invoiceNumbering, new Date().toISOString())}
                        </span>
                      ) : (
                        <span className="text-xs text-warn">
                          Invoice numbering not set up
                        </span>
                      )}
                    </p>
                  </td>
                <td className="px-4 py-3 text-ink-muted">{c.leadManagerName || "—"}</td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <p className="text-ink-muted">{c.contactPerson || "—"}</p>
                  <p className="text-xs text-ink-faint">{c.email || "—"}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-semibold tabular-nums text-ink">
                  {formatUSD(c.defaultBillRate)}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge tone={statusBadgeTone(c.status)}>{c.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(c)}
                      title="Edit client"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-bg hover:text-ink"
                    >
                      <IconEdit size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggle(c)}
                      title={c.status === "Active" ? "Archive client" : "Restore client"}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-bg hover:text-ink"
                    >
                      <IconArchive size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(c)}
                      title="Delete client"
                      aria-label="Delete client"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger focus-visible:bg-danger-soft focus-visible:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
                    >
                      <IconTrash size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function VATable({
  vas,
  total,
  clientById,
  onAdd,
  onEdit,
  onToggle,
  onDelete,
}: {
  vas: VA[];
  total: number;
  clientById: Map<string, Client>;
  onAdd: () => void;
  onEdit: (va: VA) => void;
  onToggle: (record: Client | VA) => void;
  onDelete: (va: VA) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-faint">
              VA
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Assigned client
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ink-faint lg:table-cell">
              Contact
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Pay (PHP)
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Bill (USD)
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {vas.length === 0 ? (
            total === 0 ? (
              <StartEmptyRow
                colSpan={7}
                icon={<IconUsers size={22} />}
                title="No VAs yet"
                description="Add your first VA to start building the directory."
                action={
                  <Button icon={<IconPlus size={15} />} onClick={onAdd}>
                    Add VA
                  </Button>
                }
              />
            ) : (
              <EmptyRow colSpan={7} label="No VAs found." />
            )
          ) : (
            vas.map((v) => {
              const clients = (v.assignedClientIds ?? [])
                .map((id) => clientById.get(id))
                .filter((c): c is Client => Boolean(c));
              return (
                <tr key={v.id} className="border-b border-border last:border-0 hover:bg-bg/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{v.vaName}</p>
                    <p className="text-xs text-ink-faint">{v.vaRole || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {clients.length === 0
                      ? "Unassigned"
                      : clients.map((c) => c.clientName).join(", ")}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <p className="text-ink-muted">{v.email || "—"}</p>
                    <p className="text-xs text-ink-faint">{v.phone || "—"}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm tabular-nums text-ink">
                    {formatPHP(v.payRate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-semibold tabular-nums text-ink">
                    {formatUSD(v.billRate)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge tone={statusBadgeTone(v.status)}>{v.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(v)}
                        title="Edit VA"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-bg hover:text-ink"
                      >
                        <IconEdit size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggle(v)}
                        title={v.status === "Active" ? "Archive VA" : "Restore VA"}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-bg hover:text-ink"
                      >
                        <IconArchive size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(v)}
                        title="Delete VA"
                        aria-label="Delete VA"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger focus-visible:bg-danger-soft focus-visible:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/30"
                      >
                        <IconTrash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
