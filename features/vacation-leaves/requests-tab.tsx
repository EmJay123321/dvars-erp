"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/store";
import type { LeaveRequest, LeaveStatus } from "@/lib/types";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import Modal from "@/components/ui/modal";
import { IconCalendar } from "@/components/ui/icons";

function RequestCard({
  request,
  isAdmin,
  onCancel,
}: {
  request: LeaveRequest;
  isAdmin: boolean;
  onCancel: () => void;
}) {
  const { employees } = useData();
  const employee = employees.find((e) => e.id === request.employeeId);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-bg/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{request.leaveType}</Badge>
            <Badge
              tone={
                request.status === "Approved"
                  ? "ok"
                  : request.status === "Rejected"
                    ? "danger"
                    : request.status === "Cancelled"
                      ? "neutral"
                      : "warn"
              }
              dot
            >
              {request.status}
            </Badge>
          </div>

          {isAdmin && employee && (
            <p className="mt-2 text-sm font-medium text-ink">{employee.name}</p>
          )}

          <div className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
            <IconCalendar size={14} className="shrink-0" />
            <span>
              {request.dateFrom} to {request.dateTo} ({request.totalDays} day
              {request.totalDays !== 1 ? "s" : ""})
            </span>
          </div>

          <p className="mt-2 text-sm text-ink">{request.reason}</p>

          {request.attachments.length > 0 && (
            <p className="mt-1 text-xs text-ink-faint">
              Attachments: {request.attachments.join(", ")}
            </p>
          )}

          {request.status === "Rejected" && request.rejectionReason && (
            <div className="mt-3 rounded-lg border border-danger/20 bg-danger-soft/50 px-3 py-2">
              <p className="text-xs font-medium text-danger">
                Rejection reason:
              </p>
              <p className="mt-0.5 text-xs text-danger/80">
                {request.rejectionReason}
              </p>
            </div>
          )}

          <p className="mt-2 text-[11px] text-ink-faint">
            Submitted: {new Date(request.submittedAt).toLocaleDateString("en-GB")}
          </p>
        </div>

        {request.status === "Pending" && !isAdmin && (
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

export default function RequestsTab({ status }: { status: LeaveStatus }) {
  const { currentUser, leaveRequests, cancelLeave } = useData();
  const isAdmin =
    currentUser?.role === "Admin" || currentUser?.role === "Sub-admin";
  const [cancelId, setCancelId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let rows = leaveRequests;
    if (!isAdmin && currentUser) {
      rows = rows.filter((r) => r.employeeId === currentUser.id);
    }
    return rows
      .filter((r) => r.status === status)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [leaveRequests, currentUser, isAdmin, status]);

  const emptyTitle =
    status === "Pending"
      ? "No pending requests"
      : status === "Approved"
        ? "No approved leaves"
        : status === "Rejected"
          ? "No rejected requests"
          : "No cancelled requests";

  const emptyDescription =
    status === "Pending"
      ? isAdmin
        ? "No leave requests are awaiting your review."
        : "You haven't submitted any leave requests yet."
      : status === "Approved"
        ? isAdmin
          ? "No leave requests have been approved yet."
          : "You don't have any approved leaves yet."
        : "Nothing here yet.";

  const cancelTarget = cancelId
    ? leaveRequests.find((r) => r.id === cancelId)
    : null;

  return (
    <div className="space-y-4">
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconCalendar size={22} />}
            title={emptyTitle}
            description={emptyDescription}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              isAdmin={isAdmin}
              onCancel={() => setCancelId(request.id)}
            />
          ))}
        </div>
      )}

      {cancelTarget && (
        <Modal
          open
          onClose={() => setCancelId(null)}
          title="Cancel Leave Request"
          footer={
            <>
              <Button variant="secondary" onClick={() => setCancelId(null)}>
                Keep Request
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  cancelLeave(cancelTarget.id);
                  setCancelId(null);
                }}
              >
                Yes, Cancel
              </Button>
            </>
          }
        >
          <p className="text-sm text-ink">
            Are you sure you want to cancel your{" "}
            <strong>{cancelTarget.leaveType}</strong> request from{" "}
            {cancelTarget.dateFrom} to {cancelTarget.dateTo}?
          </p>
        </Modal>
      )}
    </div>
  );
}
