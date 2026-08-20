"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useData } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { generateTempPassword } from "@/lib/auth";
import type { Employee, EmployeeStatus, Role } from "@/lib/types";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Modal from "@/components/ui/modal";
import Badge, { statusBadgeTone } from "@/components/ui/badge";
import Table from "@/components/ui/table";
import Avatar from "@/components/ui/avatar";
import { IconPlus, IconUsers, IconTrash, IconShield, IconRefresh, IconChevronRight } from "@/components/ui/icons";
import PermissionsEditor from "./permissions-editor";

const statusFilters: (EmployeeStatus | "All")[] = ["All", "Active", "Pending", "Invited", "Terminated", "Resigned"];

const STATUS_DOT_COLORS: Record<string, string> = {
  Active: "#16A34A",
  Pending: "#D97706",
  Invited: "#D97706",
  Resigned: "#D97706",
  Terminated: "#DC2626",
};

function CreateSubAdminModal({ onClose }: { onClose: () => void }) {
  const { createSubAdmin } = useData();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState(generateTempPassword());
  const [done, setDone] = useState(false);
  const [createdPassword, setCreatedPassword] = useState("");

  const valid = name.trim() && /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  if (done) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Sub-Admin created"
        footer={<Button onClick={onClose}>Done</Button>}
      >
        <div className="space-y-4">
          <p className="text-sm text-ink">
            <span className="font-medium">{name}</span> has been created as a Sub-Admin with{" "}
            <span className="font-medium">Active</span> status.
          </p>
          <div className="rounded-xl border border-ok-soft bg-ok-soft/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ok">
              Login credentials — share these manually
            </p>
            <div className="space-y-1.5 text-sm">
              <p className="text-ink">
                <span className="text-ink-muted">Email: </span>
                <span className="font-medium font-mono">{email}</span>
              </p>
              <p className="text-ink">
                <span className="text-ink-muted">Password: </span>
                <span className="font-medium font-mono">{createdPassword}</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-ink-faint">
            This password is shown only once. Share it with the Sub-Admin directly.
            They can change it after logging in. You can now assign their module
            permissions from the team table.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Create Sub-Admin"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!valid}
            onClick={() => {
              setCreatedPassword(password);
              createSubAdmin({
                name: name.trim(),
                email: email.trim(),
                department: department.trim() || "General",
                password: password,
              });
              setDone(true);
            }}
          >
            Create account
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex Morgan"
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@pathways.com"
        />
        <Input
          label="Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="e.g. Curriculum"
        />
        <div>
          <Input
            label="Password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          <button
            type="button"
            onClick={() => setPassword(generateTempPassword())}
            className="mt-1.5 flex items-center gap-1 text-xs font-medium text-accent-dark hover:text-accent"
          >
            <IconRefresh size={12} />
            Generate random password
          </button>
        </div>
        <p className="text-xs text-ink-faint">
          The account will be created as <span className="font-medium">Active</span> immediately.
          The password will be shown once after creation — share it with the Sub-Admin manually.
          Set their module permissions afterward.
        </p>
      </div>
    </Modal>
  );
}

export default function TeamPage() {
  const {
    currentUser,
    teamPermissionsEmployees,
    updateEmployeeStatus,
    deleteEmployee,
    employees,
  } = useData();
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | "All">("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [permsTarget, setPermsTarget] = useState<Employee | null>(null);

  const visible = statusFilter === "All"
    ? teamPermissionsEmployees
    : teamPermissionsEmployees.filter((e) => e.status === statusFilter);

  const adminCount = employees.filter((e) => e.role === "Admin" && e.status === "Active").length;

  const canDelete = useCallback(
    (emp: Employee) => {
      if (emp.id === currentUser?.id) return false;
      if (emp.role === "Admin" && adminCount <= 1) return false;
      return true;
    },
    [currentUser, adminCount]
  );

  const canChangeStatus = useCallback(
    (emp: Employee) => {
      if (emp.id === currentUser?.id) return false;
      if (emp.role === "Admin" && adminCount <= 1) return false;
      return true;
    },
    [currentUser, adminCount]
  );

  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen]);

  const handleFilterSelect = useCallback((value: EmployeeStatus | "All") => {
    setStatusFilter(value);
    setFilterOpen(false);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={`flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors ${
              statusFilter === "All"
                ? "bg-accent text-ink"
                : "border border-border bg-surface text-ink-muted hover:text-ink"
            }`}
            aria-haspopup="listbox"
            aria-expanded={filterOpen}
          >
            {statusFilter === "All" ? (
              <IconUsers size={15} />
            ) : (
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: STATUS_DOT_COLORS[statusFilter] }}
              />
            )}
            {statusFilter}
            <IconChevronRight
              size={14}
              className={`transition-transform ${filterOpen ? "rotate-90" : ""}`}
            />
          </button>
          {filterOpen && (
            <div
              className="absolute left-0 top-full z-40 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
              style={{ animation: "backdrop-fade-in 120ms ease-out" }}
              role="listbox"
              aria-label="Filter by status"
            >
              {statusFilters.map((s) => (
                <button
                  key={s}
                  onClick={() => handleFilterSelect(s)}
                  role="option"
                  aria-selected={statusFilter === s}
                  className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors ${
                    statusFilter === s
                      ? "bg-accent/10 font-medium text-ink"
                      : "text-ink hover:bg-bg/60"
                  }`}
                >
                  {s === "All" ? (
                    <IconUsers size={15} className="text-ink-muted" />
                  ) : (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: STATUS_DOT_COLORS[s] }}
                    />
                  )}
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button icon={<IconPlus size={16} />} onClick={() => setCreateOpen(true)}>
          Create Sub-Admin
        </Button>
      </div>

      <Card>
        <Table<Employee>
          rows={visible}
          rowKey={(e) => e.id}
          empty={<p className="py-8 text-center text-sm text-ink-faint">No users match this filter.</p>}
          columns={[
            {
              key: "employee",
              header: "Employee",
              render: (e) => (
                <div className="flex items-center gap-3">
                  <Avatar name={e.name} size={34} />
                  <div>
                    <p className="font-medium text-ink">{e.name}</p>
                    <p className="text-xs text-ink-faint">{e.email}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "department",
              header: "Department",
              render: (e) => <span className="text-ink-muted">{e.department}</span>,
            },
            {
              key: "role",
              header: "Role",
              render: (e) => (
                <Badge tone={e.role === "Admin" ? "accent" : e.role === "Sub-admin" ? "warn" : "neutral"}>
                  {e.role}
                </Badge>
              ),
            },
            {
              key: "joined",
              header: "Joined",
              render: (e) => <span className="text-ink-muted">{formatDate(e.createdAt)}</span>,
            },
            {
              key: "status",
              header: "Status",
              render: (e) => {
                const allowed = canChangeStatus(e);
                return (
                  <select
                    value={e.status}
                    disabled={!allowed}
                    onChange={(ev) => updateEmployeeStatus(e.id, ev.target.value as EmployeeStatus)}
                    className={`h-8 rounded-full border-0 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                      !allowed ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    } ${
                      e.status === "Active"
                        ? "bg-ok-soft text-ok"
                        : e.status === "Pending"
                          ? "bg-warn-soft text-warn"
                          : e.status === "Resigned"
                            ? "bg-warn-soft text-warn"
                            : e.status === "Invited"
                              ? "bg-warn-soft text-warn"
                              : "bg-danger-soft text-danger"
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Invited">Invited</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                );
              },
            },
            {
              key: "actions",
              header: "",
              render: (e) => {
                const allowed = canDelete(e);
                return (
                  <div className="flex items-center gap-1">
                    {e.role === "Sub-admin" && (
                      <button
                        onClick={() => setPermsTarget(e)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-accent/10 hover:text-accent-dark"
                        title={`Manage permissions for ${e.name}`}
                      >
                        <IconShield size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (!allowed) return;
                        deleteEmployee(e.id);
                      }}
                      disabled={!allowed}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                        allowed
                          ? "text-ink-faint hover:text-danger"
                          : "text-ink-faint/30 cursor-not-allowed"
                      }`}
                      title={
                        !allowed
                          ? e.id === currentUser?.id
                            ? "Can't remove yourself"
                            : "Can't remove the last Admin"
                          : `Remove ${e.name}`
                      }
                    >
                      <IconTrash size={15} />
                    </button>
                  </div>
                );
              },
            },
          ]}
        />
      </Card>

      {createOpen && <CreateSubAdminModal onClose={() => setCreateOpen(false)} />}
      {permsTarget && (
        <PermissionsEditor
          employee={permsTarget}
          onClose={() => setPermsTarget(null)}
        />
      )}
    </div>
  );
}
