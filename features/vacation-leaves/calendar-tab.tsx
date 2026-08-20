"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/store";
import Card from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { IconCalendar, IconChevronLeft, IconChevronRight } from "@/components/ui/icons";

const LEAVE_COLORS: Record<string, string> = {
  "Vacation Leave": "bg-cat-blue text-cat-blue-dark",
  "Sick Leave": "bg-warn-soft text-warn",
  "Emergency Leave": "bg-danger-soft text-danger",
  "Unpaid Leave": "bg-bg text-ink-muted",
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function CalendarTab() {
  const { leaveRequests, employees } = useData();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const approvedLeaves = useMemo(
    () => leaveRequests.filter((r) => r.status === "Approved"),
    [leaveRequests]
  );

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => map.set(e.id, e.name));
    return map;
  }, [employees]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);

  const dayCells: { date: string; day: number; leaves: typeof approvedLeaves }[] =
    [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = isoDate(viewYear, viewMonth, d);
    const leavesOnDay = approvedLeaves.filter(
      (r) => r.dateFrom <= date && r.dateTo >= date
    );
    dayCells.push({ date, day: d, leaves: leavesOnDay });
  }

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-ink">
          {monthLabel}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-bg hover:text-ink"
          >
            <IconChevronLeft size={18} />
          </button>
          <button
            onClick={() => {
              setViewYear(now.getFullYear());
              setViewMonth(now.getMonth());
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-bg hover:text-ink"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-bg hover:text-ink"
          >
            <IconChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div
              key={d}
              className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-ink-faint"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {/* Empty cells before the 1st */}
          {Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map(
            (_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[100px] border-b border-r border-border/50 bg-bg/30"
              />
            )
          )}

          {dayCells.map((cell) => {
            const isToday =
              cell.date ===
              isoDate(now.getFullYear(), now.getMonth(), now.getDate());
            const isWeekend =
              new Date(cell.date + "T00:00:00Z").getUTCDay() === 0 ||
              new Date(cell.date + "T00:00:00Z").getUTCDay() === 6;

            return (
              <div
                key={cell.date}
                className={`min-h-[100px] border-b border-r border-border/50 p-1.5 ${
                  isWeekend ? "bg-bg/50" : "bg-surface"
                } ${isToday ? "ring-2 ring-inset ring-accent/30" : ""}`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday
                      ? "bg-accent text-white"
                      : isWeekend
                        ? "text-ink-faint"
                        : "text-ink"
                  }`}
                >
                  {cell.day}
                </span>

                <div className="mt-1 space-y-0.5">
                  {cell.leaves.slice(0, 3).map((leave) => (
                    <div
                      key={leave.id}
                      className={`truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${
                        LEAVE_COLORS[leave.leaveType] ?? "bg-bg text-ink-muted"
                      }`}
                      title={`${nameById.get(leave.employeeId) ?? "Unknown"} — ${leave.leaveType}`}
                    >
                      {nameById.get(leave.employeeId) ?? "Unknown"}
                    </div>
                  ))}
                  {cell.leaves.length > 3 && (
                    <p className="text-[10px] text-ink-faint">
                      +{cell.leaves.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        {Object.entries(LEAVE_COLORS).map(([type, cls]) => (
          <div key={type} className="flex items-center gap-2 text-xs">
            <span className={`h-3 w-3 rounded ${cls}`} />
            <span className="text-ink-muted">{type}</span>
          </div>
        ))}
      </div>

      {approvedLeaves.length === 0 && (
        <EmptyState
          icon={<IconCalendar size={22} />}
          title="No approved leaves"
          description="Approved leave requests will appear on this calendar."
        />
      )}
    </div>
  );
}
