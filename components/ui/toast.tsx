"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { IconX } from "./icons";

interface ToastItem {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextValue {
  show: (
    message: string,
    options?: { actionLabel?: string; onAction?: () => void; duration?: number }
  ) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextToastId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (
      message: string,
      options?: { actionLabel?: string; onAction?: () => void; duration?: number }
    ) => {
      const id = nextToastId++;
      setToasts((prev) => [
        ...prev,
        { id, message, actionLabel: options?.actionLabel, onAction: options?.onAction },
      ]);
      const timer = setTimeout(() => dismiss(id), options?.duration ?? 5000);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const handleAction = (toast: ToastItem) => {
    toast.onAction?.();
    dismiss(toast.id);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-lg"
            style={{ animation: "toast-in 180ms ease-out" }}
          >
            <p className="text-sm font-medium text-ink">{t.message}</p>
            <div className="flex shrink-0 items-center gap-2">
              {t.actionLabel && t.onAction && (
                <button
                  type="button"
                  onClick={() => handleAction(t)}
                  className="text-sm font-semibold text-accent-dark transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  {t.actionLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="flex h-6 w-6 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-bg hover:text-ink"
              >
                <IconX size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
