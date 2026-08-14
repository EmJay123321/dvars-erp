"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/store";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Toggle from "@/components/ui/toggle";
import { useToast } from "@/components/ui/toast";
import { formatInvoiceNumber, resolveInvoiceYear } from "@/lib/invoice";
import type { InvoiceNumberDefaults } from "@/lib/types";

export default function InvoiceNumberingPage() {
  const { invoiceNumberingDefaults, saveInvoiceNumberingDefaults } = useData();
  const { show: showToast } = useToast();
  const [draft, setDraft] = useState<InvoiceNumberDefaults>(invoiceNumberingDefaults);
  const [error, setError] = useState("");

  const update = (patch: Partial<InvoiceNumberDefaults>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setError("");
  };

  const preview = useMemo(() => {
    const year = resolveInvoiceYear(draft, new Date().toISOString());
    return formatInvoiceNumber(draft, year, 1);
  }, [draft]);

  const handleSave = () => {
    if (!draft.prefix.trim()) {
      setError("A prefix is required — every client inherits it as a starting point.");
      return;
    }
    saveInvoiceNumberingDefaults(draft);
    showToast("Invoice numbering defaults saved");
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">
              Invoice numbering defaults
            </h2>
            <p className="mt-0.5 text-sm text-ink-muted">
              New clients inherit these settings. Each client keeps its own
              running number — set that in Directory → Edit client.
            </p>
          </div>
          <Button onClick={handleSave}>Save changes</Button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Default invoice prefix"
              value={draft.prefix}
              onChange={(e) => update({ prefix: e.target.value })}
              placeholder="MS"
              hint="Shown before the number. Override per client."
            />
            <Input
              label="Default separator"
              value={draft.separator}
              onChange={(e) => update({ separator: e.target.value })}
              placeholder=" - "
              hint='Renders as "MS - 20250064".'
            />
          </div>

          <div className="space-y-2">
            <Toggle
              checked={draft.yearIncluded}
              onChange={(v) => update({ yearIncluded: v })}
              label="Include a year segment"
              hint="Toggles the YYYY part of MS - YYYYNNNN. New clients take the year from the invoice issue date."
            />
            {draft.yearIncluded && (
              <div className="grid gap-4 rounded-xl border border-border bg-bg/40 p-4 sm:grid-cols-2">
                <Select
                  label="Year comes from"
                  value={draft.yearMode}
                  onChange={(e) =>
                    update({ yearMode: e.target.value as "issuedAt" | "fixed" })
                  }
                >
                  <option value="issuedAt">Invoice issue date</option>
                  <option value="fixed">Fixed year</option>
                </Select>
                {draft.yearMode === "fixed" && (
                  <Input
                    label="Fixed year"
                    type="number"
                    value={draft.fixedYear || ""}
                    onChange={(e) =>
                      update({
                        fixedYear: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    min={2000}
                    max={2100}
                  />
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Default sequence padding"
              type="number"
              value={draft.padding || ""}
              onChange={(e) =>
                update({
                  padding: e.target.value === "" ? 1 : Number(e.target.value),
                })
              }
              min={1}
              max={10}
              hint="Digits in the sequence, e.g. 4 renders 64 as 0064."
            />
          </div>

          <Toggle
            checked={draft.resetEachYear}
            onChange={(v) => update({ resetEachYear: v })}
            label="Reset sequence each year"
            hint="Restarts at 1 on the first invoice of a new year. Off keeps counting."
          />

          <div className="rounded-xl bg-accent-soft px-4 py-3">
            <p className="text-sm text-accent-dark">
              New clients will start at:{" "}
              <span className="font-mono font-semibold">{preview}</span>
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              This is the default only. Each client&apos;s actual next number is
              based on the last number you set for them in the Directory.
            </p>
          </div>

          <p className="text-xs text-ink-faint">
            Invoice numbers are assigned only when an invoice is saved, so
            cancelling the create dialog never burns a number. Each client&apos;s
            sequence continues from the last number issued to them.
          </p>

          {error && (
            <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
