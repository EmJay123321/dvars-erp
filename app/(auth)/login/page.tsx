"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/lib/store";
import { IconLock, IconWallet, IconFileText, IconChart, IconGrid, IconReceipt } from "@/components/ui/icons";

const demoAccounts = [
  { label: "Admin demo", email: "admin@pathways.com", password: "demo1234" },
  { label: "Employee demo", email: "maya@pathways.com", password: "demo1234" },
];

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const submit = (em: string, pw: string) => {
    const result = signIn(em, pw);
    if (result.ok) {
      router.push("/dashboard");
    } else {
      setError(result.error ?? "Unable to sign in.");
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-rail-bg p-12 text-white lg:flex lg:flex-col">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rail-accent/20 font-display text-base font-bold text-rail-accent">
            D
          </span>
          <div>
            <p className="font-display text-base font-semibold leading-tight">DVARS</p>
            <p className="text-xs text-white/45">ERP</p>
          </div>
        </div>

        <div className="my-auto max-w-md">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-xs text-rail-accent">
            Dynamic VA Referral Services
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Payroll, invoicing and reporting — in one ledger.
          </h1>
          <p className="mt-4 text-white/60">
            The internal workspace for managing team payroll, invoices and
            financial reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-white/40">
          <span className="flex items-center gap-1.5"><IconWallet size={14} /> Payroll</span>
          <span className="flex items-center gap-1.5"><IconReceipt size={14} /> Invoices</span>
          <span className="flex items-center gap-1.5"><IconChart size={14} /> Reports</span>
          <span className="flex items-center gap-1.5"><IconGrid size={14} /> Team</span>
        </div>
      </div>

      <div className="flex items-center justify-center bg-bg px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft font-display text-base font-bold text-accent-dark">
              D
            </span>
            <div>
              <p className="font-display text-base font-semibold leading-tight text-ink">DVARS</p>
              <p className="text-xs text-ink-faint">ERP</p>
            </div>
          </div>

          <h2 className="font-display text-2xl font-semibold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Use your Dynamic VA account to access the workspace.
          </p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit(email, password);
            }}
          >
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
                  <IconFileText size={16} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@dvvars.com"
                  className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Password</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
                  <IconLock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-16 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-accent-dark hover:text-ink"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error && (
              <div className="rounded-xl border border-danger-soft bg-danger-soft/60 px-3 py-2.5 text-sm text-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="h-11 w-full rounded-full bg-accent text-sm font-semibold text-ink transition-colors hover:bg-accent-dark hover:text-white focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              Sign in
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-border bg-surface p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Demo accounts
            </p>
            <div className="grid gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => submit(acc.email, acc.password)}
                  className="flex items-center justify-between rounded-xl border border-border bg-bg px-3 py-2 text-left text-sm transition-colors hover:border-accent hover:bg-accent-soft"
                >
                  <span className="font-medium text-ink">{acc.label}</span>
                  <span className="font-mono text-xs text-ink-faint">{acc.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
