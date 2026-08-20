"use client";

import { useCallback, useMemo, useState } from "react";
import { useData } from "@/lib/store";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { IconDownload } from "@/components/ui/icons";
import ApplyTab from "./apply-tab";
import RequestsTab from "./requests-tab";
import CalendarTab from "./calendar-tab";
import SettingsTab from "./settings-tab";
import { exportLeavesToCSV } from "./export-utils";

type Tab =
  | "apply"
  | "pending"
  | "approved"
  | "rejected"
  | "calendar"
  | "settings";

export default function VacationLeavesPage() {
  const { currentUser, leaveRequests, employees } = useData();
  const [activeTab, setActiveTab] = useState<Tab>("apply");

  const isAdmin =
    currentUser?.role === "Admin" || currentUser?.role === "Sub-admin";

  const myRequests = useMemo(
    () =>
      isAdmin
        ? leaveRequests
        : leaveRequests.filter((r) => r.employeeId === currentUser?.id),
    [leaveRequests, currentUser, isAdmin]
  );

  const pendingCount = useMemo(
    () => myRequests.filter((r) => r.status === "Pending").length,
    [myRequests]
  );
  const approvedCount = useMemo(
    () => myRequests.filter((r) => r.status === "Approved").length,
    [myRequests]
  );
  const rejectedCount = useMemo(
    () =>
      myRequests.filter(
        (r) => r.status === "Rejected" || r.status === "Cancelled"
      ).length,
    [myRequests]
  );

  const tabs: {
    key: Tab;
    label: string;
    count?: number;
    adminOnly?: boolean;
  }[] = [
    { key: "apply", label: "Apply" },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "approved", label: "Approved", count: approvedCount },
    { key: "rejected", label: "Rejected", count: rejectedCount },
    { key: "calendar", label: "Calendar", adminOnly: true },
    { key: "settings", label: "Settings", adminOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdmin);

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => map.set(e.id, e.name));
    return map;
  }, [employees]);

  const handleExport = useCallback(() => {
    exportLeavesToCSV(myRequests, (id) => nameById.get(id) ?? "Unknown");
  }, [myRequests, nameById]);

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-1">
          <nav className="flex gap-1 overflow-x-auto">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-accent-dark after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                      activeTab === tab.key
                        ? "bg-accent text-white"
                        : "bg-bg text-ink-muted"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {(activeTab === "pending" || activeTab === "approved" || activeTab === "rejected") && (
            <div className="shrink-0 pr-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<IconDownload size={14} />}
                onClick={handleExport}
              >
                Export CSV
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Tab Content */}
      {activeTab === "apply" && (
        <ApplyTab onComplete={() => setActiveTab("pending")} />
      )}
      {activeTab === "pending" && (
        <RequestsTab status="Pending" />
      )}
      {activeTab === "approved" && (
        <RequestsTab status="Approved" />
      )}
      {activeTab === "rejected" && (
        <RequestsTab status="Rejected" />
      )}
      {activeTab === "calendar" && isAdmin && <CalendarTab />}
      {activeTab === "settings" && isAdmin && <SettingsTab />}
    </div>
  );
}
