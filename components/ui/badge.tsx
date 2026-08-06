"use client";

import type { ReactNode } from "react";

type Tone = "ok" | "warn" | "danger" | "neutral" | "accent";

const toneClasses: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-bg text-ink-muted",
  accent: "bg-accent-soft text-accent-dark",
};

export default function Badge({
  tone = "neutral",
  children,
  dot = false,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]} ${className}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function statusBadgeTone(status: string): Tone {
  switch (status) {
    case "Active":
    case "Paid":
      return "ok";
    case "Pending":
    case "Resigned":
      return "warn";
    case "Overdue":
    case "Terminated":
      return "danger";
    default:
      return "neutral";
  }
}
