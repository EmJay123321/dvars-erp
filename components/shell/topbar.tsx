"use client";

import { usePathname } from "next/navigation";
import { useData } from "@/lib/store";
import Avatar from "@/components/ui/avatar";
import { IconLogout } from "@/components/ui/icons";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/payroll": "Payroll & Payslips",
  "/invoices": "Invoices",
  "/directory": "Directory",
  "/reports": "Financial Reports",
  "/system-report": "System Report",
  "/settings/team": "Team & Permissions",
  "/settings/activity": "Activity Log",
};

export default function Topbar() {
  const pathname = usePathname();
  const { currentUser, signOut } = useData();

  const title =
    pathname.startsWith("/payroll/")
      ? "Payslip"
      : pathname.startsWith("/invoices/")
        ? "Invoice"
        : titles[pathname] ?? "DVARS ERP";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-bg/80 px-6 backdrop-blur">
      <h1 className="truncate font-display text-lg font-semibold text-ink">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={currentUser?.name ?? "?"} size={34} />
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-tight text-ink">{currentUser?.name}</p>
            <p className="text-xs leading-tight text-ink-faint">{currentUser?.department}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          title="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-ink-muted transition-colors hover:border-ink-faint hover:text-ink"
        >
          <IconLogout size={17} />
          <span className="sr-only">Sign out</span>
        </button>
      </div>
    </header>
  );
}
