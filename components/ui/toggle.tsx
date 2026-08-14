"use client";

export default function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:bg-bg/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
    >
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && (
          <span className="mt-0.5 block text-xs text-ink-faint">{hint}</span>
        )}
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-ink-faint/40"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
