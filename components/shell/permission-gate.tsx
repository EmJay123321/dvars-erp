"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useData } from "@/lib/store";
import type { ModuleKey, PermissionAction } from "@/lib/types";
import Card from "@/components/ui/card";
import { IconLock } from "@/components/ui/icons";

export default function PermissionGate({
  module,
  action = "view",
  children,
}: {
  module: ModuleKey;
  action?: PermissionAction;
  children: ReactNode;
}) {
  const { currentUser, hasPermission, getFirstAccessiblePath } = useData();

  if (!currentUser) return null;

  if (!hasPermission(module, action)) {
    const homePath = getFirstAccessiblePath();
    return (
      <Card className="max-w-md">
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-bg text-ink-faint">
            <IconLock size={22} />
          </span>
          <p className="font-medium text-ink">Access Denied</p>
          <p className="mt-1 text-sm text-ink-muted">
            You don&apos;t have permission to access this page.
          </p>
          <Link
            href={homePath}
            className="mt-4 text-sm font-medium text-accent-dark hover:text-ink"
          >
            Back to home
          </Link>
        </div>
      </Card>
    );
  }

  return <>{children}</>;
}
