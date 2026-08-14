"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { IconPlus, IconSearch } from "./icons";

export interface SearchableOption {
  id: string;
  label: string;
  secondary?: string;
}

export default function SearchableSelect({
  value,
  options,
  placeholder,
  onSelect,
  addNewLabel,
  onAddNew,
  triggerClassName = "",
}: {
  value: string | null;
  options: SearchableOption[];
  placeholder: string;
  onSelect: (id: string) => void;
  addNewLabel?: string;
  onAddNew?: () => void;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = useMemo(
    () => options.find((o) => o.id === value) ?? null,
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.secondary ?? "").toLowerCase().includes(q)
    );
  }, [options, query]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full rounded border-b border-dashed border-ink-faint/40 bg-transparent px-1 py-0.5 text-left focus:border-accent focus:outline-none ${
          value ? "text-ink" : "text-ink-faint/70"
        } ${triggerClassName}`}
      >
        {selected ? selected.label : placeholder}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <IconSearch size={14} className="text-ink-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.stopPropagation();
                  setOpen(false);
                }
              }}
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-ink-faint">No matches.</p>
            )}
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  onSelect(o.id);
                  setOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-bg"
              >
                <span className="truncate font-medium text-ink">{o.label}</span>
                {o.secondary && (
                  <span className="shrink-0 text-xs text-ink-faint">{o.secondary}</span>
                )}
              </button>
            ))}
          </div>
          {addNewLabel && onAddNew && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setQuery("");
                onAddNew();
              }}
              className="flex w-full items-center gap-1.5 border-t border-border px-3 py-2.5 text-left text-sm font-medium text-accent-dark hover:bg-bg"
            >
              <IconPlus size={14} />
              {addNewLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
