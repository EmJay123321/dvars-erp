"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useData } from "@/lib/store";
import Modal from "@/components/ui/modal";
import Button from "@/components/ui/button";
import SearchableSelect from "@/components/ui/searchable-select";
import { IconPrinter } from "@/components/ui/icons";
import {
  formatDayLabel,
  formatWeekRangeLabel,
  nextInvoiceNumber,
  weekDates,
} from "@/lib/invoice";
import { INVOICE_CONFIG } from "@/components/invoice/invoice-sheet";
import type { Client, DayPeriod, VA } from "@/lib/types";
import DirectoryRecordModal from "../directory/directory-record-modal";

type WeekKey = "this" | "last";

interface RowDraft {
  date: string; // ISO yyyy-mm-dd
  logIn: string; // 24h "HH:MM"
  logInPeriod: DayPeriod;
  logOut: string; // 24h "HH:MM"
  logOutPeriod: DayPeriod;
  qty: number;
}

function formatUSD(value: number): string {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return `$${rounded.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatQty(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatTime(hhmm: string, period: DayPeriod): string {
  if (!hhmm) return "—";
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const hours12 = h % 12 === 0 ? 12 : h % 12;
  return `${hours12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDateValue(date: string): string {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function defaultRows(dates: string[]): RowDraft[] {
  return dates.map((date) => ({
    date,
    logIn: "08:00",
    logInPeriod: "AM",
    logOut: "12:00",
    logOutPeriod: "PM",
    qty: 4,
  }));
}

function parseDiscount(discount: string, subtotal: number): number {
  const raw = discount.trim();
  if (!raw) return 0;
  if (raw.endsWith("%")) {
    const pct = Number(raw.slice(0, -1));
    if (Number.isNaN(pct) || pct < 0) return 0;
    return (subtotal * pct) / 100;
  }
  const amount = Number(raw);
  if (Number.isNaN(amount) || amount < 0) return 0;
  return Math.min(amount, subtotal);
}

function useBlurClose<T extends HTMLElement>(active: boolean, onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [active, onClose]);
  return ref;
}

function InlineNumberCell({
  value,
  format,
  editing,
  onStart,
  onStop,
  onChange,
  readOnly = false,
  step,
  className = "",
}: {
  value: number;
  format: (value: number) => string;
  editing: boolean;
  onStart: () => void;
  onStop: () => void;
  onChange: (value: number) => void;
  readOnly?: boolean;
  step?: number;
  className?: string;
}) {
  const ref = useBlurClose<HTMLDivElement>(editing, onStop);

  if (readOnly) {
    return <span className={`tabular-nums ${className}`}>{format(value)}</span>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={onStart}
        className={`tabular-nums ${className} cursor-text hover:rounded hover:bg-bg hover:px-1.5 hover:py-0.5`}
      >
        {format(value)}
      </button>
    );
  }

  return (
    <div ref={ref} className="flex justify-end">
      <input
        autoFocus
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") {
            e.stopPropagation();
            onStop();
          }
        }}
        className="w-20 rounded-md border border-accent bg-surface px-1.5 py-0.5 text-right text-sm tabular-nums focus:outline-none"
      />
    </div>
  );
}

function InlineTimeCell({
  time,
  period,
  editing,
  onStart,
  onStop,
  onChangeTime,
  onChangePeriod,
}: {
  time: string;
  period: DayPeriod;
  editing: boolean;
  onStart: () => void;
  onStop: () => void;
  onChangeTime: (time: string) => void;
  onChangePeriod: (period: DayPeriod) => void;
}) {
  const ref = useBlurClose<HTMLDivElement>(editing, onStop);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={onStart}
        className="cursor-text whitespace-nowrap text-ink tabular-nums hover:rounded hover:bg-bg hover:px-1.5 hover:py-0.5"
      >
        {formatTime(time, period)}
      </button>
    );
  }

  return (
    <div ref={ref} className="inline-flex items-center gap-1">
      <input
        autoFocus
        type="time"
        value={time}
        onChange={(e) => onChangeTime(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onStop();
          }
        }}
        className="w-[6.5rem] rounded-md border border-accent bg-surface px-1 py-0.5 text-sm tabular-nums focus:outline-none"
      />
      <select
        value={period}
        onChange={(e) => onChangePeriod(e.target.value as DayPeriod)}
        className="rounded-md border border-accent bg-surface px-1 py-0.5 text-sm focus:outline-none"
      >
        <option>AM</option>
        <option>PM</option>
      </select>
    </div>
  );
}

export default function InvoiceTemplateModal({ onClose }: { onClose: () => void }) {
  const { addInvoice, clients, vas } = useData();
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [leadManager, setLeadManager] = useState("");
  const [vaId, setVaId] = useState<string | null>(null);
  const [vaName, setVaName] = useState("");
  const [vaRole, setVaRole] = useState("");
  const [week, setWeek] = useState<WeekKey | null>(null);
  const [rows, setRows] = useState<RowDraft[]>([]);
  const [rate, setRate] = useState(0);
  const [dueAt, setDueAt] = useState("");
  const [discount, setDiscount] = useState("");
  const [editing, setEditing] = useState<{ row: number; field: string } | null>(null);
  const [addRecord, setAddRecord] = useState<"client" | "va" | null>(null);
  const [saveError, setSaveError] = useState("");

  const clientOptions = useMemo(
    () =>
      clients
        .filter(
          (c) =>
            (c.status === "Active" || c.id === clientId) &&
            (!c.deletedAt || c.id === clientId)
        )
        .map((c) => ({
          id: c.id,
          label: c.clientName,
          secondary: c.leadManagerName || c.companyName,
        })),
    [clients, clientId]
  );

  const visibleVAs = useMemo(
    () =>
      vas.filter(
        (v) =>
          (v.status === "Active" || v.id === vaId) &&
          (!v.deletedAt || v.id === vaId) &&
          (!clientId || (v.assignedClientIds ?? []).includes(clientId) || v.id === vaId)
      ),
    [vas, clientId, vaId]
  );

  const vaOptions = useMemo(
    () => visibleVAs.map((v) => ({ id: v.id, label: v.vaName, secondary: v.vaRole })),
    [visibleVAs]
  );

  const selectClient = (id: string) => {
    const client = clients.find((c) => c.id === id);
    if (!client) return;
    setClientId(client.id);
    setClientName(client.clientName);
    setLeadManager(client.leadManagerName);
    setVaId(null);
    setVaName("");
    setVaRole("");
    setRate(0);
  };

  const selectVA = (id: string) => {
    const va = vas.find((v) => v.id === id);
    if (!va) return;
    setVaId(va.id);
    setVaName(va.vaName);
    setVaRole(va.vaRole);
    setRate(va.billRate);
  };

  const handleSavedRecord = (record: Client | VA) => {
    if ("clientName" in record) {
      setClientId(record.id);
      setClientName(record.clientName);
      setLeadManager(record.leadManagerName);
      setVaId(null);
      setVaName("");
      setVaRole("");
      setRate(0);
    } else {
      setVaId(record.id);
      setVaName(record.vaName);
      setVaRole(record.vaRole);
      setRate(record.billRate);
    }
  };

  const invoiceNumber = useMemo(() => {
    const client = clients.find((c) => c.id === clientId) ?? null;
    if (!client?.invoiceNumbering) return null;
    const issuedAt =
      rows.length > 0
        ? new Date(`${rows[0].date}T00:00:00`).toISOString()
        : new Date().toISOString();
    return nextInvoiceNumber(client.invoiceNumbering, issuedAt);
  }, [clients, clientId, rows]);
  const weekLabel = useMemo(
    () => (rows.length > 0 ? formatWeekRangeLabel(rows.map((r) => r.date)) : ""),
    [rows]
  );

  const subtotal = useMemo(
    () => rows.reduce((sum, r) => sum + (r.qty || 0) * (rate || 0), 0),
    [rows, rate]
  );
  const hours = useMemo(() => rows.reduce((sum, r) => sum + (r.qty || 0), 0), [rows]);
  const discountValue = parseDiscount(discount, subtotal);
  const total = Math.max(0, subtotal - discountValue);

  const valid =
    clientName.trim().length > 0 &&
    vaName.trim().length > 0 &&
    week !== null &&
    dueAt.trim().length > 0;

  const startEditing = (row: number, field: string) => setEditing({ row, field });
  const stopEditing = () => setEditing(null);

  const selectWeek = (key: WeekKey) => {
    const dates = weekDates(key === "this" ? 0 : 1);
    setWeek(key);
    setRows(defaultRows(dates));
    setRate(0);
    setDueAt(dates[dates.length - 1]);
    setEditing(null);
  };

  const updateRow = (index: number, patch: Partial<RowDraft>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const handleCreate = () => {
    if (!valid || rows.length === 0) return;
    const result = addInvoice({
      clientName: clientName.trim(),
      clientId: clientId ?? undefined,
      vaName: vaName.trim(),
      vaId: vaId ?? undefined,
      vaRole: vaRole.trim(),
      leadManager: leadManager.trim() || undefined,
      lineItems: rows.map((r) => ({
        label: formatDayLabel(r.date),
        qty: r.qty || 0,
        rate: rate || 0,
        date: r.date,
        logIn: r.logIn,
        logInPeriod: r.logInPeriod,
        logOut: r.logOut,
        logOutPeriod: r.logOutPeriod,
      })),
      issuedAt: new Date(`${rows[0].date}T00:00:00`).toISOString(),
      dueAt: new Date(`${dueAt}T00:00:00`).toISOString(),
      discount: discountValue,
      discountType: discount.trim().endsWith("%") ? "percent" : "flat",
    });
    if (!result.ok) {
      setSaveError(result.error ?? "Could not create the invoice.");
      return;
    }
    onClose();
  };

  const isEditing = (row: number, field: string) =>
    editing !== null && editing.row === row && editing.field === field;

  return (
    <Modal
      open
      onClose={() => {
        if (!addRecord) onClose();
      }}
      title="Create invoice"
      size="wide"
      footer={
        <div className="print:hidden">
          {saveError && (
            <p className="mb-3 rounded-xl bg-danger-soft px-3 py-2.5 text-sm text-danger">
              {saveError}
            </p>
          )}
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="secondary" icon={<IconPrinter size={15} />} onClick={() => window.print()}>
              Print
            </Button>
            <Button disabled={!valid} onClick={handleCreate}>
              Create invoice
            </Button>
          </div>
        </div>
      }
    >
      <div className="print-sheet invoice-sheet">
        <div className="invoice-sheet__band">
          <div className="invoice-sheet__band-top">
            <div className="invoice-sheet__company">
              <h1 className="invoice-sheet__company-name">
                {INVOICE_CONFIG.companyName}
              </h1>
              <p className="invoice-sheet__company-line">{INVOICE_CONFIG.addressLine1}</p>
              <p className="invoice-sheet__company-line">{INVOICE_CONFIG.addressLine2}</p>
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
            <p className="invoice-sheet__subheading">
              {weekLabel || "Select a work week below"}
            </p>
          </div>
        </div>

        <div className="invoice-sheet__body">
          <div className="invoice-sheet__identity">
            <div className="invoice-sheet__client">
              <SearchableSelect
                value={clientId}
                options={clientOptions}
                placeholder="Client name"
                onSelect={selectClient}
                addNewLabel="Add new client"
                onAddNew={() => setAddRecord("client")}
                triggerClassName="text-lg font-bold"
              />
              <input
                value={leadManager}
                onChange={(e) => setLeadManager(e.target.value)}
                placeholder="Assigned VA"
                className="mt-2 w-full rounded border-b border-dashed border-ink-faint/40 bg-transparent px-1 py-0.5 text-sm text-ink-muted placeholder:font-normal placeholder:text-ink-faint/70 focus:border-accent focus:outline-none"
              />
              <SearchableSelect
                value={vaId}
                options={vaOptions}
                placeholder="VA name"
                onSelect={selectVA}
                addNewLabel="Add new VA"
                onAddNew={() => setAddRecord("va")}
                triggerClassName="mt-2 text-base font-bold"
              />
              <input
                value={vaRole}
                onChange={(e) => setVaRole(e.target.value)}
                placeholder="Role of VA"
                className="mt-2 w-full rounded border-b border-dashed border-ink-faint/40 bg-transparent px-1 py-0.5 text-sm text-ink-muted placeholder:font-normal placeholder:text-ink-faint/70 focus:border-accent focus:outline-none"
              />
            </div>
            <div className="invoice-sheet__meta">
              <p className="invoice-sheet__meta-label">Invoice No.</p>
              <p className="invoice-sheet__meta-value invoice-sheet__meta-value--preview">
                {invoiceNumber ?? (clientId ? "Set up numbering" : "—")}
              </p>
              <p className="print:hidden text-xs text-ink-faint">
                {clientId
                  ? invoiceNumber
                    ? "Will be assigned on save"
                    : "Edit this client in Directory to set their prefix and last number."
                  : "Select a client to preview the number."}
              </p>
            </div>
          </div>

          <div className="invoice-sheet__dates">
            <div>
              <p className="invoice-sheet__meta-label">Issued</p>
              <p className="invoice-sheet__meta-value">
                {rows.length > 0 ? formatDateValue(rows[0].date) : "—"}
              </p>
            </div>
            <div>
              <p className="invoice-sheet__meta-label">Due</p>
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="print:hidden mt-1 w-40 rounded border-b border-dashed border-ink-faint/40 bg-transparent px-1 py-0.5 text-right font-mono text-sm font-medium tabular-nums text-ink focus:border-accent focus:outline-none"
              />
              <p className="invoice-sheet__meta-value hidden print:block">
                {dueAt ? formatDateValue(dueAt) : "—"}
              </p>
            </div>
          </div>

          <div className="invoice-sheet__divider" />
        </div>

        <div className="invoice-sheet__controls print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-ink-muted">Work week</p>
            <div className="inline-flex rounded-full border border-border bg-bg p-1">
              <button
                type="button"
                onClick={() => selectWeek("last")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  week === "last" ? "bg-accent text-ink shadow-sm" : "text-ink-muted hover:text-ink"
                }`}
              >
                Last week
              </button>
              <button
                type="button"
                onClick={() => selectWeek("this")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  week === "this" ? "bg-accent text-ink shadow-sm" : "text-ink-muted hover:text-ink"
                }`}
              >
                This week
              </button>
            </div>
          </div>
        </div>

        <div className="invoice-sheet__table-wrap">
          <table className="invoice-sheet__table">
            <thead>
              <tr>
                <th>Date</th>
                <th>LogIn</th>
                <th>LogOut</th>
                <th className="invoice-sheet__num">Qty</th>
                <th className="invoice-sheet__num">Rate</th>
                <th className="invoice-sheet__num">Total price</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="invoice-sheet__empty text-center text-sm text-ink-faint">
                    Pick a work week above to generate the line items.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.date}>
                    <td className="whitespace-nowrap font-medium text-ink">
                      {formatDayLabel(row.date)}
                    </td>
                    <td className="whitespace-nowrap">
                      <InlineTimeCell
                        time={row.logIn}
                        period={row.logInPeriod}
                        editing={isEditing(i, "logIn")}
                        onStart={() => startEditing(i, "logIn")}
                        onStop={stopEditing}
                        onChangeTime={(v) => updateRow(i, { logIn: v })}
                        onChangePeriod={(v) => updateRow(i, { logInPeriod: v })}
                      />
                    </td>
                    <td className="whitespace-nowrap">
                      <InlineTimeCell
                        time={row.logOut}
                        period={row.logOutPeriod}
                        editing={isEditing(i, "logOut")}
                        onStart={() => startEditing(i, "logOut")}
                        onStop={stopEditing}
                        onChangeTime={(v) => updateRow(i, { logOut: v })}
                        onChangePeriod={(v) => updateRow(i, { logOutPeriod: v })}
                      />
                    </td>
                    <td className="invoice-sheet__num">
                      <InlineNumberCell
                        value={row.qty}
                        format={formatQty}
                        editing={isEditing(i, "qty")}
                        onStart={() => startEditing(i, "qty")}
                        onStop={stopEditing}
                        onChange={(v) => updateRow(i, { qty: v })}
                      />
                    </td>
                    <td className="invoice-sheet__num">
                      {i === 0 ? (
                        <InlineNumberCell
                          value={rate}
                          format={formatUSD}
                          step={0.01}
                          editing={isEditing(i, "rate")}
                          onStart={() => startEditing(i, "rate")}
                          onStop={stopEditing}
                          onChange={setRate}
                        />
                      ) : (
                        <span className="tabular-nums text-ink-muted">{formatUSD(rate)}</span>
                      )}
                    </td>
                    <td className="invoice-sheet__num font-mono font-semibold tabular-nums text-ink">
                      {formatUSD((row.qty || 0) * (rate || 0))}
                    </td>
                  </tr>
                ))
              )}
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
            <div className="invoice-sheet__total-row">
              <span className="invoice-sheet__total-label">No. of Hours</span>
              <span className="invoice-sheet__total-value">{formatQty(hours)}</span>
            </div>
            <div className="invoice-sheet__total-row">
              <span className="invoice-sheet__total-label">Subtotal (USD)</span>
              <span className="invoice-sheet__total-value">{formatUSD(subtotal)}</span>
            </div>
            <div className="invoice-sheet__total-row">
              <span className="invoice-sheet__total-label">Discount Percent/Value</span>
              <input
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="10% or 50.00"
                className="w-24 rounded border border-border bg-surface px-1.5 py-0.5 text-right font-mono text-sm tabular-nums placeholder:text-ink-faint focus:border-accent focus:outline-none"
              />
            </div>
            <div className="invoice-sheet__total-row">
              <span className="invoice-sheet__total-label">Total (USD)</span>
              <span className="invoice-sheet__total-value invoice-sheet__total-value--grand">
                {formatUSD(total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {addRecord && (
        <DirectoryRecordModal
          mode={addRecord}
          onClose={() => setAddRecord(null)}
          onSaved={handleSavedRecord}
        />
      )}
    </Modal>
  );
}
