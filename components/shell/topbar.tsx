"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useData } from "@/lib/store";
import Avatar from "@/components/ui/avatar";
import { IconLogout, IconUser } from "@/components/ui/icons";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/payroll": "Payroll & Payslips",
  "/invoices": "Invoices",
  "/directory": "Directory",
  "/reports": "Financial Reports",
  "/system-report": "System Report",
  "/settings/team": "Team & Permissions",
  "/settings/activity": "Activity Log",
  "/profile": "My Profile",
};

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, signOut } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const title =
    pathname.startsWith("/payroll/")
      ? "Payslip"
      : pathname.startsWith("/invoices/")
        ? "Invoice"
        : titles[pathname] ?? "DVARS ERP";

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, closeMenu]);

  const handleViewProfile = useCallback(() => {
    closeMenu();
    router.push("/profile");
  }, [closeMenu, router]);

  const handleSignOut = useCallback(() => {
    closeMenu();
    signOut();
  }, [closeMenu, signOut]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-bg/80 px-6 backdrop-blur">
      <h1 className="truncate font-display text-lg font-semibold text-ink">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-bg/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Avatar name={currentUser?.name ?? "?"} size={34} />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight text-ink">{currentUser?.name}</p>
              <p className="text-xs leading-tight text-ink-faint">{currentUser?.department}</p>
            </div>
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
              style={{ animation: "backdrop-fade-in 120ms ease-out" }}
              role="menu"
            >
              <button
                onClick={handleViewProfile}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-bg/60"
                role="menuitem"
              >
                <IconUser size={15} />
                View Profile
              </button>
              <div className="border-t border-border" />
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-bg/60"
                role="menuitem"
              >
                <IconLogout size={15} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
