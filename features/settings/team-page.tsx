"use client";

import { useState } from "react";
import { useData } from "@/lib/store";
import { formatDate } from "@/lib/format";
import type { Employee, EmployeeStatus, Role } from "@/lib/types";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Modal from "@/components/ui/modal";
import Badge, { statusBadgeTone } from "@/components/ui/badge";
import Table from "@/components/ui/table";
import Avatar from "@/components/ui/avatar";
import { IconPlus, IconUsers, IconCopy, IconTrash } from "@/components/ui/icons";

const statusFilters: (EmployeeStatus | "All")[] = ["All", "Active", "Pending", "Invited", "Terminated", "Resigned"];

function InviteUserModal({ onClose }: { onClose: () => void }) {
  const { addEmployee } = useData();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<Role>("Employee");
  const [result, setResult] = useState<{ inviteLink: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const valid = name.trim() && /\S+@\S+\.\S+/.test(email);

  if (result) {
    return (
      <Modal
        open
        onClose={onClose}
        title="User invited"
        footer={<Button onClick={onClose}>Done</Button>}
      >
        <p className="text-sm text-ink">
          <span className="font-medium">{result.name}</span> has been invited as an{" "}
          {role} with status <span className="font-medium">Invited</span>.
        </p>
        <div className="mt-4">
          <p className="mb-1.5 text-sm font-medium text-ink">Invite link</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-xl border border-border bg-bg px-3 py-2.5 font-mono text-sm text-ink">
              {result.inviteLink}
            </code>
            <Button
              variant="secondary"
              size="sm"
              icon={<IconCopy size={14} />}
              onClick={() => {
                navigator.clipboard?.writeText(result.inviteLink);
                setCopied(true);
              }}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            Share this link with the user. They will use it to set their own password.
            The link expires in 48 hours and can only be used once.
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            <span className="font-medium">Note:</span> No email system is configured yet.
            Copy and send this link manually.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Invite user"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!valid}
            onClick={() => {
              const { employee, inviteLink } = addEmployee({
                name: name.trim(),
                email: email.trim(),
                role,
                department: department.trim() || "General",
              });
              setResult({ inviteLink, name: employee.name });
            }}
          >
            Send invite
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex Morgan" />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@pathways.com" />
        <Input label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Curriculum" />
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="Employee">Employee</option>
          <option value="Sub-admin">Sub-admin</option>
          <option value="Admin">Admin</option>
        </Select>
        <p className="text-xs text-ink-faint">
          Role is set at invite time and can&apos;t be edited inline. The invited user
          will receive an email/link to set their own password.
        </p>
      </div>
    </Modal>
  );
}

export default function TeamPage() {
  const { teamPermissionsEmployees, updateEmployeeStatus, deleteEmployee } = useData();
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | "All">("All");
  const [inviteOpen, setInviteOpen] = useState(false);

  const visible = statusFilter === "All" ? teamPermissionsEmployees : teamPermissionsEmployees.filter((e) => e.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              title={s === "All" ? "All statuses" : s}
              className={`flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors ${
                statusFilter === s ? "bg-accent text-ink" : "border border-border bg-surface text-ink-muted hover:text-ink"
              }`}
            >
              {s === "All" ? (
                <IconUsers size={15} />
              ) : (
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusBadgeTone(s) === "ok" ? "#16A34A" : statusBadgeTone(s) === "warn" ? "#D97706" : "#DC2626" }} />
              )}
              {s}
            </button>
          ))}
        </div>
        <Button icon={<IconPlus size={16} />} onClick={() => setInviteOpen(true)}>
          Invite user
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
              render: (e) => <Badge tone={e.role === "Admin" ? "accent" : e.role === "Sub-admin" ? "warn" : "neutral"}>{e.role}</Badge>,
            },
            {
              key: "joined",
              header: "Joined",
              render: (e) => <span className="text-ink-muted">{formatDate(e.createdAt)}</span>,
            },
            {
              key: "status",
              header: "Status",
              render: (e) => (
                <select
                  value={e.status}
                  onChange={(ev) => updateEmployeeStatus(e.id, ev.target.value as EmployeeStatus)}
                  className={`h-8 cursor-pointer rounded-full border-0 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 ${
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
              ),
            },
            {
              key: "actions",
              header: "",
              render: (e) => (
                <button
                  onClick={() => deleteEmployee(e.id)}
                  className="text-ink-faint transition-colors hover:text-danger"
                  title={`Remove ${e.name}`}
                >
                  <IconTrash size={15} />
                </button>
              ),
            },
          ]}
        />
      </Card>

      {inviteOpen && <InviteUserModal onClose={() => setInviteOpen(false)} />}
    </div>
  );
}
