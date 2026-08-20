"use client";

import { useState, useCallback } from "react";
import { useData } from "@/lib/store";
import type { Employee, ModuleKey, ModulePermissions, PermissionAction, PermissionsMap } from "@/lib/types";
import { MODULE_KEYS, MODULE_LABELS, EMPTY_PERMISSIONS } from "@/lib/types";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import { IconCheck, IconX } from "@/components/ui/icons";

const ACTIONS: PermissionAction[] = ["view", "add", "edit", "delete"];
const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  add: "Add",
  edit: "Edit",
  delete: "Delete",
};

function PermToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        checked ? "bg-accent" : "bg-ink-faint/40"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function PermissionsEditor({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const { updateSubAdminPermissions } = useData();
  const [perms, setPerms] = useState<PermissionsMap>(
    () => employee.permissions ?? { ...EMPTY_PERMISSIONS }
  );

  const setAction = useCallback(
    (mod: ModuleKey, action: PermissionAction, value: boolean) => {
      setPerms((prev) => {
        const next = { ...prev, [mod]: { ...prev[mod], [action]: value } };
        if (action === "view" && !value) {
          next[mod] = { view: false, add: false, edit: false, delete: false };
        }
        if (action !== "view" && value && !next[mod].view) {
          next[mod] = { ...next[mod], view: true };
        }
        return next;
      });
    },
    []
  );

  const selectAll = useCallback((mod: ModuleKey) => {
    setPerms((prev) => ({
      ...prev,
      [mod]: { view: true, add: true, edit: true, delete: true },
    }));
  }, []);

  const clearAll = useCallback((mod: ModuleKey) => {
    setPerms((prev) => ({
      ...prev,
      [mod]: { view: false, add: false, edit: false, delete: false },
    }));
  }, []);

  const handleSave = useCallback(() => {
    updateSubAdminPermissions(employee.id, perms);
    onClose();
  }, [employee.id, perms, updateSubAdminPermissions, onClose]);

  return (
    <Modal
      open
      onClose={onClose}
      title={`Permissions — ${employee.name}`}
      size="wide"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save permissions</Button>
        </>
      }
    >
      <p className="mb-4 text-sm text-ink-muted">
        Control which modules and actions this Sub-admin can access.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2.5 pr-4 text-left font-medium text-ink-muted">Module</th>
              {ACTIONS.map((a) => (
                <th key={a} className="px-3 py-2.5 text-center font-medium text-ink-muted">
                  {ACTION_LABELS[a]}
                </th>
              ))}
              <th className="pl-3 py-2.5 text-right font-medium text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {MODULE_KEYS.map((mod) => {
              const p = perms[mod];
              return (
                <tr key={mod} className="border-b border-border/50 last:border-0">
                  <td className="py-3 pr-4 font-medium text-ink">
                    {MODULE_LABELS[mod]}
                  </td>
                  {ACTIONS.map((a) => (
                    <td key={a} className="px-3 py-3 text-center">
                      <PermToggle
                        checked={p[a]}
                        onChange={(v) => setAction(mod, a, v)}
                        disabled={a !== "view" && !p.view}
                      />
                    </td>
                  ))}
                  <td className="pl-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => selectAll(mod)}
                        className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium text-accent-dark transition-colors hover:bg-accent/10"
                        title="Enable all"
                      >
                        <IconCheck size={12} />
                      </button>
                      <button
                        onClick={() => clearAll(mod)}
                        className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium text-danger transition-colors hover:bg-danger/10"
                        title="Disable all"
                      >
                        <IconX size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
