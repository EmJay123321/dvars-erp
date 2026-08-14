"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/store";
import Modal from "@/components/ui/modal";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Toggle from "@/components/ui/toggle";
import MultiSelect from "@/components/ui/multi-select";
import {
  highestUsedSequenceForClient,
  nextInvoiceNumber,
  parseInvoiceNumber,
  resolveInvoiceYear,
} from "@/lib/invoice";
import type {
  Client,
  DirectoryStatus,
  InvoiceNumberDefaults,
  InvoiceNumberSettings,
  VA,
} from "@/lib/types";

interface FormState {
  clientName: string;
  companyName: string;
  leadManagerName: string;
  contactPerson: string;
  email: string;
  phone: string;
  billingAddress: string;
  defaultBillRate: string;
  defaultDiscountPercent: string;
  vaName: string;
  vaRole: string;
  assignedClientIds: string[];
  payRate: string;
  billRate: string;
  dateStarted: string;
  status: DirectoryStatus;
  notes: string;
  numberingPrefix: string;
  numberingSeparator: string;
  numberingYearIncluded: boolean;
  numberingPadding: string;
  numberingLastNumber: string;
  numberingResetEachYear: boolean;
}

const emptyForm: FormState = {
  clientName: "",
  companyName: "",
  leadManagerName: "",
  contactPerson: "",
  email: "",
  phone: "",
  billingAddress: "",
  defaultBillRate: "",
  defaultDiscountPercent: "0",
  vaName: "",
  vaRole: "",
  assignedClientIds: [],
  payRate: "",
  billRate: "",
  dateStarted: "",
  status: "Active",
  notes: "",
  numberingPrefix: "",
  numberingSeparator: " - ",
  numberingYearIncluded: true,
  numberingPadding: "4",
  numberingLastNumber: "",
  numberingResetEachYear: false,
};

function numberingFields(
  settings: InvoiceNumberSettings | null | undefined,
  defaults: InvoiceNumberDefaults
) {
  const source = settings ?? defaults;
  return {
    numberingPrefix: settings?.prefix ?? defaults.prefix,
    numberingSeparator: settings?.separator ?? defaults.separator,
    numberingYearIncluded:
      settings?.yearIncluded ?? defaults.yearIncluded,
    numberingPadding: String(source.padding),
    numberingLastNumber: settings?.lastNumberUsed ?? "",
    numberingResetEachYear:
      settings?.resetEachYear ?? defaults.resetEachYear,
  };
}

function toForm(
  record: Client | VA | undefined,
  defaults: InvoiceNumberDefaults
): FormState {
  if (!record) {
    return { ...emptyForm, ...numberingFields(null, defaults) };
  }
  if ("clientName" in record) {
    return {
      ...emptyForm,
      clientName: record.clientName,
      companyName: record.companyName,
      leadManagerName: record.leadManagerName,
      contactPerson: record.contactPerson,
      email: record.email,
      phone: record.phone,
      billingAddress: record.billingAddress,
      defaultBillRate: record.defaultBillRate ? String(record.defaultBillRate) : "",
      defaultDiscountPercent: String(record.defaultDiscountPercent),
      status: record.status,
      notes: record.notes,
      ...numberingFields(record.invoiceNumbering, defaults),
    };
  }
  return {
    ...emptyForm,
    vaName: record.vaName,
    vaRole: record.vaRole,
    email: record.email,
    phone: record.phone,
    assignedClientIds: Array.isArray(record.assignedClientIds)
      ? record.assignedClientIds
      : [],
    payRate: record.payRate ? String(record.payRate) : "",
    billRate: record.billRate ? String(record.billRate) : "",
    dateStarted: record.dateStarted,
    status: record.status,
    notes: record.notes,
  };
}

function numberingFromForm(
  form: FormState,
  defaults: InvoiceNumberDefaults
): InvoiceNumberSettings {
  return {
    prefix: form.numberingPrefix.trim() || defaults.prefix,
    separator: form.numberingSeparator,
    yearIncluded: form.numberingYearIncluded,
    // Per the spec the client's year segment always comes from the issue date.
    yearMode: "issuedAt",
    fixedYear: new Date().getFullYear(),
    padding: Math.max(1, Number(form.numberingPadding) || defaults.padding),
    lastNumberUsed: form.numberingLastNumber.trim(),
    resetEachYear: form.numberingResetEachYear,
  };
}

function isValidEmail(value: string): boolean {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}

export default function DirectoryRecordModal({
  mode,
  record,
  onClose,
  onSaved,
}: {
  mode: "client" | "va";
  record?: Client | VA;
  onClose: () => void;
  onSaved: (record: Client | VA) => void;
}) {
  const { clients, invoices, addClient, updateClient, addVA, updateVA, invoiceNumberingDefaults } =
    useData();
  const [form, setForm] = useState<FormState>(() =>
    toForm(record, invoiceNumberingDefaults)
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [confirm, setConfirm] = useState<{ highest: number; seq: number } | null>(null);

  const isEdit = Boolean(record);
  const title = isEdit
    ? `Edit ${mode === "client" ? "client" : "VA"}`
    : `Add ${mode === "client" ? "client" : "VA"}`;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const numberingSettings = useMemo(
    () => numberingFromForm(form, invoiceNumberingDefaults),
    [form, invoiceNumberingDefaults]
  );

  const numberingPreview = useMemo(
    () => nextInvoiceNumber(numberingSettings, new Date().toISOString()),
    [numberingSettings]
  );

  const prefixConflict = useMemo(() => {
    const prefix = form.numberingPrefix.trim().toLowerCase();
    if (!prefix) return null;
    const recordId = record && "clientName" in record ? record.id : null;
    return (
      clients.find(
        (c) =>
          c.id !== recordId &&
          c.invoiceNumbering &&
          c.invoiceNumbering.prefix.trim().toLowerCase() === prefix
      ) ?? null
    );
  }, [form.numberingPrefix, clients, record]);

  const clientOptions = useMemo(
    () =>
      clients.map((c) => ({
        id: c.id,
        label: c.clientName,
        secondary: c.status === "Inactive" ? `${c.companyName || "Client"} · Inactive` : c.companyName,
      })),
    [clients]
  );

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (mode === "client") {
      if (!form.clientName.trim()) next.clientName = "Client name is required.";
      if (!form.defaultBillRate.trim() || Number(form.defaultBillRate) < 0)
        next.defaultBillRate = "Enter a valid rate.";
      if (form.defaultDiscountPercent.trim() && Number(form.defaultDiscountPercent) < 0)
        next.defaultDiscountPercent = "Enter 0 or more.";
      if (!form.numberingPrefix.trim()) next.numberingPrefix = "Invoice prefix is required.";
    } else {
      if (!form.vaName.trim()) next.vaName = "VA name is required.";
      if (!form.vaRole.trim()) next.vaRole = "VA role is required.";
      if (!form.payRate.trim() || Number(form.payRate) < 0)
        next.payRate = "Enter a valid rate.";
      if (!form.billRate.trim() || Number(form.billRate) < 0)
        next.billRate = "Enter a valid rate.";
    }
    if (form.email.trim() && !isValidEmail(form.email)) next.email = "Enter a valid email.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveClient = (settings: InvoiceNumberSettings) => {
    const payload = {
      clientName: form.clientName.trim(),
      companyName: form.companyName.trim(),
      leadManagerName: form.leadManagerName.trim(),
      contactPerson: form.contactPerson.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      billingAddress: form.billingAddress.trim(),
      defaultBillRate: Number(form.defaultBillRate) || 0,
      defaultDiscountPercent: Number(form.defaultDiscountPercent) || 0,
      status: form.status,
      notes: form.notes.trim(),
      invoiceNumbering: settings,
    };
    if (record) {
      updateClient(record.id, payload);
      onSaved({ ...(record as Client), ...payload });
    } else {
      onSaved(addClient(payload));
    }
  };

  const handleSave = () => {
    if (!validate()) return;
    if (mode === "client") {
      const settings = numberingFromForm(form, invoiceNumberingDefaults);
      if (record && "clientName" in record) {
        const parsed = parseInvoiceNumber(settings.lastNumberUsed, settings);
        if (parsed) {
          const compareYear =
            parsed.year ??
            (settings.yearIncluded
              ? resolveInvoiceYear(settings, new Date().toISOString())
              : null);
          const highest = highestUsedSequenceForClient(
            settings,
            invoices,
            { id: record.id, clientName: record.clientName },
            compareYear
          );
          if (parsed.seq < highest) {
            setConfirm({ highest, seq: parsed.seq });
            return;
          }
        }
      }
      saveClient(settings);
    } else {
      const payload = {
        vaName: form.vaName.trim(),
        vaRole: form.vaRole.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        assignedClientIds: form.assignedClientIds,
        payRate: Number(form.payRate) || 0,
        billRate: Number(form.billRate) || 0,
        dateStarted: form.dateStarted,
        status: form.status,
        notes: form.notes.trim(),
      };
      if (record) {
        updateVA(record.id, payload);
        onSaved({ ...(record as VA), ...payload });
      } else {
        onSaved(addVA(payload));
      }
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{isEdit ? "Save changes" : "Add"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {mode === "client" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Client name"
                value={form.clientName}
                onChange={(e) => set("clientName", e.target.value)}
                error={errors.clientName}
                placeholder="e.g. International Academy"
              />
              <Input
                label="Company name"
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                placeholder="Legal entity (optional)"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Assigned VA"
                value={form.leadManagerName}
                onChange={(e) => set("leadManagerName", e.target.value)}
                hint="Auto fills the invoice"
                placeholder="Who manages this account"
              />
              <Input
                label="Contact person"
                value={form.contactPerson}
                onChange={(e) => set("contactPerson", e.target.value)}
                placeholder="Primary contact"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                error={errors.email}
                placeholder="billing@client.com"
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+66 2 123 4567"
              />
            </div>
            <Input
              label="Billing address"
              value={form.billingAddress}
              onChange={(e) => set("billingAddress", e.target.value)}
              placeholder="Street, City, Country"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Default bill rate (USD)"
                type="number"
                min={0}
                value={form.defaultBillRate}
                onChange={(e) => set("defaultBillRate", e.target.value)}
                error={errors.defaultBillRate}
                hint="Auto fills invoice rate"
                placeholder="250"
              />
              <Input
                label="Default discount (%)"
                type="number"
                min={0}
                value={form.defaultDiscountPercent}
                onChange={(e) => set("defaultDiscountPercent", e.target.value)}
                error={errors.defaultDiscountPercent}
                placeholder="0"
              />
            </div>
            <div className="space-y-4 rounded-xl border border-border bg-bg/40 p-4">
              <div>
                <p className="font-display text-sm font-semibold text-ink">
                  Invoice numbering
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Continues from this client&apos;s Excel sequence. Overrides the
                  global defaults in Settings.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Invoice prefix"
                  value={form.numberingPrefix}
                  onChange={(e) => set("numberingPrefix", e.target.value)}
                  error={errors.numberingPrefix}
                  placeholder="MS"
                  hint="Shown before the number."
                />
                <Input
                  label="Separator"
                  value={form.numberingSeparator}
                  onChange={(e) => set("numberingSeparator", e.target.value)}
                  placeholder=" - "
                  hint='Renders as "MS - 20250064".'
                />
              </div>
              <Toggle
                checked={form.numberingYearIncluded}
                onChange={(v) => set("numberingYearIncluded", v)}
                label="Include a year segment"
                hint="The YYYY part comes from the invoice issue date."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Sequence padding"
                  type="number"
                  min={1}
                  max={10}
                  value={form.numberingPadding}
                  onChange={(e) => set("numberingPadding", e.target.value)}
                  hint="Digits in the sequence, e.g. 4 renders 64 as 0064."
                />
                <Input
                  label="Last invoice number used"
                  value={form.numberingLastNumber}
                  onChange={(e) => set("numberingLastNumber", e.target.value)}
                  placeholder="e.g. 20250064 or MS - 20250064"
                  hint="Your last number from Excel. The next invoice continues after it."
                />
              </div>
              <Toggle
                checked={form.numberingResetEachYear}
                onChange={(v) => set("numberingResetEachYear", v)}
                label="Reset sequence each year"
                hint="Restarts at 1 on the first invoice of a new year. Off keeps counting."
              />
              <div className="rounded-xl bg-accent-soft px-4 py-3">
                <p className="text-sm text-accent-dark">
                  Next invoice for this client will be:{" "}
                  <span className="font-mono font-semibold">
                    {numberingPreview}
                  </span>
                </p>
                {prefixConflict && (
                  <p className="mt-1.5 text-xs font-medium text-warn">
                    Another client (&ldquo;{prefixConflict.clientName}&rdquo;)
                    already uses this prefix. Prefixes may be shared, but this is
                    usually a typo — check before saving.
                  </p>
                )}
              </div>
            </div>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => set("status", e.target.value as DirectoryStatus)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
            <Input
              label="Notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Anything worth remembering (optional)"
            />
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="VA name"
                value={form.vaName}
                onChange={(e) => set("vaName", e.target.value)}
                error={errors.vaName}
                placeholder="e.g. Leah Garcia"
              />
              <Input
                label="VA role"
                value={form.vaRole}
                onChange={(e) => set("vaRole", e.target.value)}
                error={errors.vaRole}
                hint="Shown on the invoice"
                placeholder="e.g. Executive Assistant"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                error={errors.email}
                placeholder="va@dvars.ph"
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+63 917 555 0101"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Assigned clients
              </label>
              <MultiSelect
                value={form.assignedClientIds}
                options={clientOptions}
                placeholder="Select one or more clients"
                onChange={(ids) => set("assignedClientIds", ids)}
                hint="This VA appears in the invoice dropdown for every selected client."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Pay rate (PHP)"
                type="number"
                min={0}
                value={form.payRate}
                onChange={(e) => set("payRate", e.target.value)}
                error={errors.payRate}
                placeholder="22000"
              />
              <Input
                label="Bill rate (USD)"
                type="number"
                min={0}
                value={form.billRate}
                onChange={(e) => set("billRate", e.target.value)}
                error={errors.billRate}
                hint="Auto fills invoice rate"
                placeholder="250"
              />
              <Input
                label="Date started"
                type="date"
                value={form.dateStarted}
                onChange={(e) => set("dateStarted", e.target.value)}
              />
            </div>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => set("status", e.target.value as DirectoryStatus)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
            <Input
              label="Notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Anything worth remembering (optional)"
            />
          </>
        )}
      </div>

      {confirm && (
        <Modal
          open
          onClose={() => setConfirm(null)}
          title="Move this client's numbering backwards?"
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  const settings = numberingFromForm(form, invoiceNumberingDefaults);
                  setConfirm(null);
                  saveClient(settings);
                }}
              >
                Save anyway
              </Button>
            </>
          }
        >
          <p className="text-sm text-ink">
            The last number you entered (sequence{" "}
            <span className="font-mono font-semibold">{confirm.seq}</span>) is
            below the highest number already issued to this client (sequence{" "}
            <span className="font-mono font-semibold">{confirm.highest}</span>).
            Saving this could reuse an existing invoice number. Confirm you want
            to continue.
          </p>
        </Modal>
      )}
    </Modal>
  );
}
