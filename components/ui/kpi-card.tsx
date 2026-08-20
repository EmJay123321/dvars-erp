"use client";

import type { ReactNode } from "react";
import AnimatedNumber from "./animated-number";

export default function KpiCard({
  label,
  value,
  valueNumber,
  valueFormat,
  sub,
  tone = "neutral",
  category,
  icon,
}: {
  label: string;
  value?: string;
  valueNumber?: number;
  valueFormat?: (n: number) => string;
  sub?: ReactNode;
  tone?: "neutral" | "accent" | "ok" | "warn" | "danger";
  category?: "teal" | "blue" | "amber";
  icon?: ReactNode;
}) {
  const iconTone: Record<string, string> = {
    neutral: "bg-bg text-ink-muted",
    accent: "bg-accent-soft text-accent-dark",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
  };

  const categoryStyles: Record<string, { border: string; bg: string }> = {
    teal: {
      border: "border-l-[3px] border-l-accent border-y-0 border-r-0",
      bg: "bg-accent-soft",
    },
    blue: {
      border: "border-l-[3px] border-l-cat-blue border-y-0 border-r-0",
      bg: "bg-cat-blue-soft",
    },
    amber: {
      border: "border-l-[3px] border-l-warn border-y-0 border-r-0",
      bg: "bg-warn-soft",
    },
  };

  const cat = category ? categoryStyles[category] : null;

  return (
    <div
      className={`rounded-2xl border border-border p-5 ${cat ? cat.border : ""} ${cat ? cat.bg : "bg-surface"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-muted">{label}</p>
          <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink">
            {valueNumber !== undefined && valueFormat ? (
              <AnimatedNumber value={valueNumber} format={valueFormat} />
            ) : (
              value
            )}
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
