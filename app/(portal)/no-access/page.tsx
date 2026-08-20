"use client";

import { useData } from "@/lib/store";
import Card from "@/components/ui/card";
import { IconShield } from "@/components/ui/icons";

export default function NoAccessPage() {
  const { currentUser } = useData();

  return (
    <div className="flex items-center justify-center py-16">
      <Card className="max-w-md w-full">
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <IconShield size={26} />
          </span>
          <p className="font-display text-lg font-semibold text-ink">
            No modules assigned yet
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Your account ({currentUser?.email}) has been created, but no module
            access has been assigned to you yet.
          </p>
          <p className="mt-3 text-sm text-ink-muted">
            Please contact your Admin to get access to the modules you need.
          </p>
        </div>
      </Card>
    </div>
  );
}
