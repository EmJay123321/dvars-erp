"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useData } from "@/lib/store";
import type { Role } from "@/lib/types";
import Card from "@/components/ui/card";
import { IconLock } from "@/components/ui/icons";

export default function RoleGate({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const { currentUser } = useData();

  if (currentUser?.role !== role) {
    return (
      <Card className="max-w-md">
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-bg text-ink-faint">
            <IconLock size={22} />
          </span>
          <p className="font-medium text-ink">You don&apos;t have access to this page</p>
          <p className="mt-1 text-sm text-ink-muted">
            This area is restricted to administrators.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 text-sm font-medium text-accent-dark hover:text-ink"
          >
            Back to dashboard
          </Link>
        </div>
      </Card>
    );
  }

  return <>{children}</>;
}
