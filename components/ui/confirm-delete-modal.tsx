"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Button from "./button";

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  body?: ReactNode;
  warning?: ReactNode;
  onArchive?: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

const FOCUSABLE =
  'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Reusable delete-confirmation dialog. Cancel is focused on open so a stray
 * Enter never deletes. `warning` is informational only — it never blocks
 * deletion. `onArchive` (when provided) is offered as an alternative.
 */
export default function ConfirmDeleteModal({
  open,
  title,
  body,
  warning,
  onArchive,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      aria-describedby="confirm-delete-body"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      style={{ animation: "backdrop-fade-in 150ms ease-out" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={panelRef}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface shadow-xl"
        style={{ animation: "modal-fade-in 160ms cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        <div className="px-5 pb-4 pt-5">
          <h2
            id="confirm-delete-title"
            className="font-display text-base font-semibold text-ink"
          >
            {title}
          </h2>
          <p id="confirm-delete-body" className="mt-1 text-sm text-ink-muted">
            {body ?? "Are you sure you want to delete this record?"}
          </p>
          {warning && (
            <div className="mt-3 rounded-xl bg-danger-soft px-3 py-2.5 text-sm text-danger">
              {warning}
            </div>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="secondary" autoFocus onClick={onCancel}>
            Cancel
          </Button>
          {onArchive && (
            <Button variant="primary" onClick={onArchive}>
              Archive instead
            </Button>
          )}
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
