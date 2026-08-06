"use client";

import type { ReactNode } from "react";

export default function Card({
  children,
  className = "",
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          {title && (
            <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
