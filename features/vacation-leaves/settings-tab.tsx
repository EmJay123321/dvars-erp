"use client";

import { useCallback, useState } from "react";
import { useData } from "@/lib/store";
import type { LeavePolicy, LeaveType } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Toggle from "@/components/ui/toggle";

export default function SettingsTab() {
  const { leavePolicies, updateLeavePolicies } = useData();
  const { show } = useToast();
  const [policies, setPolicies] = useState<LeavePolicy[]>(() =>
    leavePolicies.map((p) => ({ ...p }))
  );

  const updateCredits = useCallback((leaveType: LeaveType, value: string) => {
    const num = parseInt(value, 10);
    setPolicies((prev) =>
      prev.map((p) =>
        p.leaveType === leaveType
          ? { ...p, annualCredits: isNaN(num) ? 0 : Math.max(0, num) }
          : p
      )
    );
  }, []);

  const updateCarryOver = useCallback((leaveType: LeaveType, value: boolean) => {
    setPolicies((prev) =>
      prev.map((p) =>
        p.leaveType === leaveType ? { ...p, carryOver: value } : p
      )
    );
  }, []);

  const handleSave = useCallback(() => {
    updateLeavePolicies(policies);
    show("Leave policies updated");
  }, [policies, updateLeavePolicies, show]);

  const hasChanges =
    JSON.stringify(policies) !== JSON.stringify(leavePolicies);

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-5 space-y-6">
          <div>
            <h3 className="font-display text-sm font-semibold text-ink">
              Leave Policy Settings
            </h3>
            <p className="mt-1 text-xs text-ink-faint">
              Configure the number of leave days each employee is entitled to per
              year. Changes apply to all employees.
            </p>
          </div>

          {policies.map((policy) => (
            <div
              key={policy.leaveType}
              className="rounded-xl border border-border p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-ink">
                    {policy.leaveType}
                  </h4>
                </div>
                <div className="w-40">
                  <label className="block" htmlFor={`credits-${policy.leaveType}`}>
                    <span className="mb-1.5 block text-sm font-medium text-ink">
                      Annual credits
                    </span>
                    <input
                      id={`credits-${policy.leaveType}`}
                      type="number"
                      min="0"
                      max="365"
                      value={policy.annualCredits}
                      onChange={(e) =>
                        updateCredits(policy.leaveType, e.target.value)
                      }
                      className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </label>
                </div>
              </div>

              <div className="mt-3">
                <Toggle
                  checked={policy.carryOver}
                  onChange={(v) => updateCarryOver(policy.leaveType, v)}
                  label="Carry over unused days to next year"
                  hint={
                    policy.leaveType === "Unpaid Leave"
                      ? "Not applicable for unpaid leave"
                      : "When enabled, unused days are added to next year's balance"
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges}>
          Save Policies
        </Button>
      </div>
    </div>
  );
}
