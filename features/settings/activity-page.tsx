"use client";

import { useData } from "@/lib/store";
import { formatDateTime } from "@/lib/format";
import Card from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { IconClock } from "@/components/ui/icons";
import Avatar from "@/components/ui/avatar";

export default function ActivityPage() {
  const { activity } = useData();

  return (
    <Card>
      {activity.length === 0 ? (
        <EmptyState icon={<IconClock size={22} />} title="No activity recorded yet" />
      ) : (
        <ol className="relative ml-5 border-l border-border">
          {activity.map((entry) => (
            <li key={entry.id} className="relative pb-6 pl-8 last:pb-2">
              <span className="absolute -left-[7px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-accent" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={entry.actor} size={28} />
                  <p className="text-sm text-ink">
                    <span className="font-medium">{entry.actor}</span> — {entry.description}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-ink-faint">
                  {formatDateTime(entry.createdAt)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
