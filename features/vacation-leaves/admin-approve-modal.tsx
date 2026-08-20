"use client";

import { useState } from "react";
import { useData } from "@/lib/store";
import type { LeaveRequest } from "@/lib/types";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";

export default function AdminApproveModal({
  request,
  action,
  onClose,
}: {
  request: LeaveRequest;
  action: "approve" | "reject";
  onClose: () => void;
}) {
  const { employees, approveLeave, rejectLeave } = useData();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const employee = employees.find((e) => e.id === request.employeeId);

  const handleSubmit = () => {
    if (action === "reject" && !comment.trim()) {
      setError("Please provide a reason for rejection.");
      return;
    }
    if (action === "approve") {
      approveLeave(request.id, comment.trim() || undefined);
    } else {
      rejectLeave(request.id, comment.trim());
    }
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={action === "approve" ? "Approve Leave Request" : "Reject Leave Request"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={action === "approve" ? "primary" : "danger"}
            onClick={handleSubmit}
          >
            {action === "approve" ? "Approve" : "Reject"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-bg/40 p-4">
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Employee</span>
              <span className="font-medium text-ink">{employee?.name ?? "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Leave Type</span>
              <span className="font-medium text-ink">{request.leaveType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Duration</span>
              <span className="font-medium text-ink">
                {request.dateFrom} to {request.dateTo} ({request.totalDays} day{request.totalDays !== 1 ? "s" : ""})
              </span>
            </div>
            <div>
              <span className="text-ink-muted">Reason</span>
              <p className="mt-1 text-ink">{request.reason}</p>
            </div>
            {request.attachments.length > 0 && (
              <div>
                <span className="text-ink-muted">Attachments</span>
                <p className="mt-1 text-ink">{request.attachments.join(", ")}</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">
            {action === "approve" ? "Comment (optional)" : "Reason for rejection (required)"}
          </label>
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setError(null);
            }}
            rows={3}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder={
              action === "approve"
                ? "Add any notes..."
                : "Explain why this request is being rejected..."
            }
          />
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
      </div>
    </Modal>
  );
}
