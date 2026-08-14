"use client";

import type { ReactNode } from "react";

export default function KpiCard({
  label,
  value,
  sub,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  tone?: "neutral" | "accent" | "ok" | "warn" | "danger";
  icon?: ReactNode;
}) {
  const iconTone: Record<string, string> = {
    neutral: "bg-bg text-ink-muted",
    accent: "bg-accent-soft text-accent-dark",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
  };
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-muted">{label}</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink">
            {value}
          </p>
          {sub && <div className="mt-1.5 text-xs text-ink-faint">{sub}</div>}
        </div>
        {icon && (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconTone[tone]}`}
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
