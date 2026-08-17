"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "@/lib/store";
import type { Role } from "@/lib/types";
import { IconPin, IconGrid, IconFileText, IconReceipt, IconContact, IconChart, IconMessage, IconUsers, IconClock } from "@/components/ui/icons";
import Avatar from "@/components/ui/avatar";

interface NavItem {
  href: string;
  label: string;
  icon: (props: { size?: number; className?: string }) => React.ReactNode;
}

const adminNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: IconGrid },
  { href: "/payroll", label: "Payroll & Payslips", icon: IconFileText },
  { href: "/invoices", label: "Invoices", icon: IconReceipt },
  { href: "/directory", label: "Directory", icon: IconContact },
  { href: "/reports", label: "Financial Reports", icon: IconChart },
  { href: "/system-report", label: "System Report", icon: IconMessage },
];

const adminSettingsNav: NavItem[] = [
  { href: "/settings/team", label: "Team & Permissions", icon: IconUsers },
  { href: "/settings/activity", label: "Activity Log", icon: IconClock },
];

const employeeNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: IconGrid },
  { href: "/payroll", label: "My Payslips", icon: IconFileText },
  { href: "/system-report", label: "System Report", icon: IconMessage },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  active,
  expanded,
}: {
  item: NavItem;
  active: boolean;
  expanded: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={expanded ? undefined : item.label}
      className={`group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
        expanded ? "w-full" : "w-10 justify-center"
      } ${
        active
          ? "bg-white/10 text-white"
          : "text-white/55 hover:bg-white/5 hover:text-white"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-rail-accent" />
      )}
      <Icon size={18} />
      {expanded && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export default function Sidebar() {
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const expanded = pinned || hovered;
  const pathname = usePathname();
  const { currentUser } = useData();

  const role: Role = currentUser?.role ?? "Employee";
  const nav = role === "Admin" ? adminNav : employeeNav;
  const showSettings = role === "Admin";

  return (
    <aside
      className="sticky top-0 flex h-screen shrink-0 flex-col bg-rail-bg text-white transition-[width] duration-200 ease-out"
      style={{ width: expanded ? 232 : 68 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex h-16 items-center gap-2.5 px-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rail-accent/20 font-display text-sm font-bold text-rail-accent">
          D
        </span>
        {expanded && (
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold leading-tight">DVARS</p>
            <p className="text-[11px] leading-tight text-white/45">ERP</p>
          </div>
        )}
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
        {nav.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} expanded={expanded} />
        ))}

        {showSettings && (
          <>
            {expanded ? (
              <p className="mb-1 mt-4 px-3 text-[11px] font-semibold uppercase tracking-widest text-white/35">
                Settings
              </p>
            ) : (
              <div className="mb-1 mt-4 h-px bg-white/10" />
            )}
            {adminSettingsNav.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} expanded={expanded} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        {expanded ? (
          <div className="flex items-center gap-2.5">
            <Avatar name={currentUser?.name ?? "?"} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{currentUser?.name}</p>
              <p className="truncate text-[11px] text-white/45">{role}</p>
            </div>
            <button
              onClick={() => setPinned((p) => !p)}
              title={pinned ? "Unpin sidebar" : "Pin sidebar"}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                pinned ? "bg-white/15 text-rail-accent" : "text-white/40 hover:bg-white/10 hover:text-white"
              }`}
            >
              <IconPin size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setPinned((p) => !p)}
            title={pinned ? "Unpin sidebar" : "Pin sidebar"}
            className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              pinned ? "bg-white/15 text-rail-accent" : "text-white/40 hover:bg-white/10 hover:text-white"
            }`}
          >
            <IconPin size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
