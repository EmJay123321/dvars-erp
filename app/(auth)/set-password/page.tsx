"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/lib/store";

export default function SetPasswordPage() {
  const router = useRouter();
  const { currentUser, setNewPassword, signOut } = useData();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!currentUser || !currentUser.mustChangePassword) {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.mustChangePassword === undefined) {
    return null;
  }

  if (!currentUser.mustChangePassword) {
    return null;
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const result = setNewPassword(password);
    if (result.ok) {
      router.push("/dashboard");
    } else {
      setError(result.error ?? "Unable to set password.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft font-display text-base font-bold text-accent-dark">
            D
          </span>
          <div>
            <p className="font-display text-base font-semibold leading-tight text-ink">
              DVARS
            </p>
            <p className="text-xs text-ink-faint">ERP</p>
          </div>
        </div>

        <h2 className="font-display text-2xl font-semibold text-ink">
          Set your password
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Welcome, {currentUser.name}. Please set a permanent password before
          continuing.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={submit}
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              New password
            </span>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">
              Confirm password
            </span>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="text-xs font-medium text-accent-dark hover:text-ink"
          >
            {showPassword ? "Hide passwords" : "Show passwords"}
          </button>

          {error && (
            <div className="rounded-xl border border-danger-soft bg-danger-soft/60 px-3 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="h-11 w-full rounded-full bg-accent text-sm font-semibold text-ink transition-colors hover:bg-accent-dark hover:text-white focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            Set password &amp; continue
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            signOut();
            router.replace("/login");
          }}
          className="mt-4 w-full text-center text-xs font-medium text-ink-muted hover:text-ink"
        >
          Sign out and use a different account
        </button>
      </div>
    </div>
  );
}
