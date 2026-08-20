"use client";

import { useCallback, useMemo, useState } from "react";
import { useData } from "@/lib/store";
import type { LeaveType } from "@/lib/types";
import { calcBusinessDays } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";

export default function ApplyTab({ onComplete }: { onComplete: () => void }) {
  const { currentUser, leavePolicies, getLeaveBalance, requestLeave } =
    useData();
  const { show } = useToast();

  const [leaveType, setLeaveType] = useState<LeaveType>("Vacation Leave");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reason, setReason] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const balance = useMemo(
    () => (currentUser ? getLeaveBalance(currentUser.id) : null),
    [currentUser, getLeaveBalance]
  );

  const totalDays = useMemo(() => {
    if (!dateFrom || !dateTo) return 0;
    return calcBusinessDays(dateFrom, dateTo);
  }, [dateFrom, dateTo]);

  const availableTypes = leavePolicies.filter((p) => p.annualCredits > 0);
  const currentBalance = balance?.[leaveType];
  const exceedsBalance = currentBalance ? totalDays > currentBalance.remaining : false;

  const canSubmit =
    Boolean(dateFrom) &&
    Boolean(dateTo) &&
    totalDays > 0 &&
    reason.trim().length >= 5 &&
    !exceedsBalance;

  const handleSubmit = useCallback(() => {
    if (!currentUser) return;
    setError(null);

    if (!dateFrom || !dateTo) {
      setError("Please select both start and end dates.");
      return;
    }
    if (dateTo < dateFrom) {
      setError("End date must be on or after the start date.");
      return;
    }
    if (totalDays === 0) {
      setError("The selected dates contain no business days.");
      return;
    }
    if (reason.trim().length < 5) {
      setError("Please provide a reason (at least 5 characters).");
      return;
    }
    if (exceedsBalance) {
      setError(`You only have ${currentBalance?.remaining ?? 0} ${leaveType} day(s) remaining.`);
      return;
    }

    requestLeave({
      employeeId: currentUser.id,
      leaveType,
      dateFrom,
      dateTo,
      totalDays,
      reason: reason.trim(),
      attachments: attachmentName.trim() ? [attachmentName.trim()] : [],
      notifyUsers: [],
    });

    show("Leave request submitted successfully");
    setLeaveType("Vacation Leave");
    setDateFrom("");
    setDateTo("");
    setReason("");
    setAttachmentName("");
    onComplete();
  }, [
    currentUser,
    leaveType,
    dateFrom,
    dateTo,
    totalDays,
    reason,
    attachmentName,
    exceedsBalance,
    currentBalance,
    requestLeave,
    show,
    onComplete,
  ]);

  if (!currentUser || !balance) return null;

  return (
    <div className="space-y-6">
      {/* Leave Balance Summary */}
      <Card>
        <div className="p-5">
          <h3 className="mb-3 font-display text-sm font-semibold text-ink">
            Your Leave Balance ({new Date().getFullYear()})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {leavePolicies
              .filter((p) => p.annualCredits > 0)
              .map((policy) => {
                const b = balance[policy.leaveType];
                return (
                  <div
                    key={policy.leaveType}
                    className="rounded-xl border border-border bg-bg/40 px-4 py-3"
                  >
                    <p className="text-xs font-medium text-ink-faint">
                      {policy.leaveType}
                    </p>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="font-display text-lg font-bold text-ink">
                        {b.remaining}
                      </span>
                      <span className="text-xs text-ink-muted">
                        of {policy.annualCredits} remaining
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{
                          width: `${
                            policy.annualCredits > 0
                              ? (b.used / policy.annualCredits) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-ink-faint">
                      {b.used} used
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      </Card>

      {/* Leave Request Form */}
      <Card>
        <div className="p-5 space-y-5">
          <h3 className="font-display text-sm font-semibold text-ink">
            Request Leave
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Leave Type"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
            >
              {availableTypes.map((p) => (
                <option key={p.leaveType} value={p.leaveType}>
                  {p.leaveType} ({p.annualCredits} days/year)
                </option>
              ))}
            </Select>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Total Days
              </span>
              <div className="flex h-10 items-center rounded-xl border border-border bg-bg/60 px-3 text-sm">
                {totalDays > 0 ? (
                  <span className="font-medium text-ink">
                    {totalDays} business day{totalDays !== 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-ink-faint">Select dates first</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="leave-date-from"
              label="From"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                if (!dateTo || e.target.value > dateTo) setDateTo(e.target.value);
              }}
            />
            <Input
              id="leave-date-to"
              label="To"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {exceedsBalance && totalDays > 0 && (
            <p className="text-sm text-danger">
              This request exceeds your remaining balance ({currentBalance?.remaining ?? 0}{" "}
              {leaveType} day{currentBalance?.remaining !== 1 ? "s" : ""} left).
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Reason / Comments <span className="text-danger">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Explain the reason for your leave request..."
            />
            {reason.length > 0 && reason.length < 5 && (
              <p className="mt-1 text-xs text-danger">
                Please provide at least 5 characters.
              </p>
            )}
          </div>

          <Input
            id="leave-attachment"
            label="Attachment (optional)"
            value={attachmentName}
            onChange={(e) => setAttachmentName(e.target.value)}
            hint="e.g. medical-certificate.pdf"
            placeholder="File name"
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end pt-2">
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              Submit Request
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
