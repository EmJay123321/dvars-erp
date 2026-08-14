"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { IconSearch } from "./icons";

export interface MultiOption {
  id: string;
  label: string;
  secondary?: string;
}

export default function MultiSelect({
  value,
  options,
  placeholder,
  onChange,
  hint,
}: {
  value: string[];
  options: MultiOption[];
  placeholder: string;
  onChange: (ids: string[]) => void;
  hint?: string;
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

  const selectedOptions = useMemo(
    () => options.filter((o) => value.includes(o.id)),
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

  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    );
  };

  const summary =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions[0].label} +${selectedOptions.length - 1}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`h-10 w-full truncate rounded-xl border border-border bg-surface px-3 text-left text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${
          selectedOptions.length === 0 ? "text-ink-faint" : "text-ink"
        }`}
      >
        {summary}
      </button>
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}

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
            {filtered.map((o) => {
              const checked = value.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggle(o.id)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-bg"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked ? "border-accent bg-accent text-ink" : "border-ink-faint/40 bg-surface"
                    }`}
                  >
                    {checked && (
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{o.label}</span>
                    {o.secondary && (
                      <span className="block truncate text-xs text-ink-faint">{o.secondary}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedOptions.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full border-t border-border px-3 py-2 text-left text-sm font-medium text-ink-muted hover:bg-bg hover:text-ink"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
