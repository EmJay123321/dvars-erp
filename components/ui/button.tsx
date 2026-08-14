"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-ink hover:bg-accent-dark hover:text-white focus-visible:ring-accent/40 disabled:bg-ink-faint/60 disabled:text-white",
  secondary:
    "border border-border bg-surface text-ink hover:border-ink-faint hover:bg-bg focus-visible:ring-ink-faint/30",
  ghost:
    "text-ink-muted hover:bg-bg hover:text-ink focus-visible:ring-ink-faint/30",
  danger:
    "bg-danger text-white hover:opacity-90 focus-visible:ring-danger/40",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  icon,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-70 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
