"use client";

import { useCallback, useMemo, useState } from "react";
import { useData } from "@/lib/store";
import { useToast } from "@/components/ui/toast";
import type {
  UserPreferences,
  DisplayCurrency,
  DateFormat,
  PermissionsMap,
} from "@/lib/types";
import { DEFAULT_PREFERENCES, MODULE_KEYS, MODULE_LABELS } from "@/lib/types";
import Avatar from "@/components/ui/avatar";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import Toggle from "@/components/ui/toggle";
import {
  IconUser,
  IconSettings,
  IconCalendar,
  IconShield,
} from "@/components/ui/icons";
import { formatDatePref } from "@/lib/format";
import VacationLeavesPage from "@/features/vacation-leaves/vacation-leaves-page";

type Tab = "profile" | "account-settings" | "vacation-leaves";

const NAV_ITEMS: {
  key: Tab;
  label: string;
  icon: (props: { size?: number; className?: string }) => React.ReactNode;
}[] = [
  { key: "profile", label: "Profile", icon: IconUser },
  { key: "account-settings", label: "Account Settings", icon: IconSettings },
  { key: "vacation-leaves", label: "Vacation & Leaves", icon: IconCalendar },
];

const ACTIONS: ("view" | "add" | "edit" | "delete")[] = ["view", "add", "edit", "delete"];
const ACTION_LABELS: Record<string, string> = {
  view: "View",
  add: "Add",
  edit: "Edit",
  delete: "Delete",
};

/* ── Profile Tab (read-only) ──────────────────────────────────── */

function ProfileTab() {
  const { currentUser } = useData();
  if (!currentUser) return null;

  const roleTone =
    currentUser.role === "Admin"
      ? "accent"
      : currentUser.role === "Sub-admin"
        ? "warn"
        : "neutral";

  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center gap-5">
          <Avatar name={currentUser.name} size={72} />
          <div>
            <h3 className="font-display text-xl font-semibold text-ink">{currentUser.name}</h3>
            <p className="text-sm text-ink-muted">{currentUser.email}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-bg/40 px-4 py-3">
            <p className="text-xs font-medium text-ink-faint">Role</p>
            <div className="mt-1">
              <Badge tone={roleTone}>{currentUser.role}</Badge>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-bg/40 px-4 py-3">
            <p className="text-xs font-medium text-ink-faint">Department</p>
            <p className="mt-1 text-sm font-medium text-ink">{currentUser.department}</p>
          </div>
          {currentUser.createdAt && (
            <div className="rounded-xl border border-border bg-bg/40 px-4 py-3">
              <p className="text-xs font-medium text-ink-faint">Date Joined</p>
              <p className="mt-1 text-sm font-medium text-ink">
                {formatDatePref(currentUser.createdAt, currentUser.preferences?.dateFormat ?? "DD/MM/YYYY")}
              </p>
            </div>
          )}
          <div className="rounded-xl border border-border bg-bg/40 px-4 py-3">
            <p className="text-xs font-medium text-ink-faint">Email</p>
            <p className="mt-1 text-sm font-medium text-ink">{currentUser.email}</p>
          </div>
        </div>
      </div>

      {currentUser.role === "Sub-admin" && currentUser.permissions && (
        <div className="border-t border-border p-5">
          <PermissionsReadOnly permissions={currentUser.permissions} />
        </div>
      )}
    </Card>
  );
}

function PermissionsReadOnly({ permissions }: { permissions: PermissionsMap }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-ink">Module Permissions</h4>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/40">
              <th className="px-4 py-2.5 text-left font-medium text-ink-muted">Module</th>
              {ACTIONS.map((a) => (
                <th key={a} className="px-3 py-2.5 text-center font-medium text-ink-muted">
                  {ACTION_LABELS[a]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULE_KEYS.map((mod) => {
              const p = permissions[mod];
              return (
                <tr key={mod} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-ink">{MODULE_LABELS[mod]}</td>
                  {ACTIONS.map((a) => (
                    <td key={a} className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                          p[a]
                            ? "bg-ok-soft text-ok"
                            : "bg-ink-faint/20 text-ink-faint"
                        }`}
                      >
                        {p[a] ? "\u2713" : "\u2014"}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Account Settings Tab ──────────────────────────────────────── */

function AccountSettingsTab() {
  const { currentUser, updateUserPreferences, changePassword, updateCurrentUserProfile } = useData();
  const { show } = useToast();

  /* ── Personal Info state ─────────────────────────────────────── */
  const [fullName, setFullName] = useState(currentUser?.name ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");

  /* ── Preferences state ───────────────────────────────────────── */
  const [prefs, setPrefs] = useState<UserPreferences>(
    () => currentUser?.preferences ?? { ...DEFAULT_PREFERENCES }
  );

  /* ── Security state ──────────────────────────────────────────── */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  /* ── Validation errors ───────────────────────────────────────── */
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  /* ── Track if password section has pending changes ───────────── */
  const hasPasswordFields =
    currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0;

  /* ── Dirty detection ─────────────────────────────────────────── */
  const [savedPrefs, setSavedPrefs] = useState<UserPreferences>(
    () => currentUser?.preferences ?? { ...DEFAULT_PREFERENCES }
  );
  const isPrefsDirty = useMemo(() => {
    return JSON.stringify(prefs) !== JSON.stringify(savedPrefs);
  }, [prefs, savedPrefs]);

  const isProfileDirty = fullName !== (currentUser?.name ?? "") || email !== (currentUser?.email ?? "");

  const isPasswordDirty = hasPasswordFields;

  const isDirty = isProfileDirty || isPrefsDirty || isPasswordDirty;

  /* ── Preferences handlers ────────────────────────────────────── */
  const updateCurrency = useCallback((currency: DisplayCurrency) => {
    setPrefs((prev) => ({ ...prev, displayCurrency: currency }));
  }, []);

  const updateDateFormat = useCallback((format: DateFormat) => {
    setPrefs((prev) => ({ ...prev, dateFormat: format }));
  }, []);

  const updateNotification = useCallback(
    (key: keyof UserPreferences["notifications"], value: boolean) => {
      setPrefs((prev) => ({
        ...prev,
        notifications: { ...prev.notifications, [key]: value },
      }));
    },
    []
  );

  /* ── Save handler ────────────────────────────────────────────── */
  const handleSave = useCallback(() => {
    let hasError = false;

    /* validate profile fields */
    setNameError(null);
    setEmailError(null);

    if (isProfileDirty) {
      if (fullName.trim().length === 0) {
        setNameError("Full name is required.");
        hasError = true;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailError("Please enter a valid email address.");
        hasError = true;
      }
    }

    /* validate security fields */
    setPasswordError(null);
    setPasswordSuccess(false);

    if (isPasswordDirty) {
      if (newPassword.length < 6) {
        setPasswordError("Password must be at least 6 characters.");
        hasError = true;
      } else if (newPassword !== confirmPassword) {
        setPasswordError("Passwords do not match.");
        hasError = true;
      } else {
        const result = changePassword(currentPassword, newPassword);
        if (!result.ok) {
          setPasswordError(result.error ?? "Unable to change password.");
          hasError = true;
        } else {
          setPasswordSuccess(true);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }
      }
    }

    if (hasError) return;

    /* save profile */
    if (isProfileDirty) {
      const result = updateCurrentUserProfile({ name: fullName.trim(), email: email.trim() });
      if (!result.ok) {
        setEmailError(result.error ?? "Unable to update profile.");
        return;
      }
    }

    /* save preferences */
    if (isPrefsDirty) {
      updateUserPreferences(prefs);
      setSavedPrefs(prefs);
    }

    show("Your changes have been saved.");
  }, [
    isProfileDirty,
    isPrefsDirty,
    isPasswordDirty,
    fullName,
    email,
    prefs,
    currentPassword,
    newPassword,
    confirmPassword,
    updateCurrentUserProfile,
    updateUserPreferences,
    changePassword,
    show,
  ]);

  return (
    <div className="space-y-6">
      {/* ── Section A: Personal Info ───────────────────────────── */}
      <Card>
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <IconUser size={18} className="text-accent" />
            <h3 className="text-base font-semibold text-ink">Personal Info</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-4">
                <Avatar name={fullName || "?"} size={56} />
                <button
                  type="button"
                  className="text-sm font-medium text-accent hover:text-accent-dark transition-colors"
                >
                  Upload photo
                </button>
              </div>
              <p className="mt-1.5 text-xs text-ink-faint">
                Your initials will be used as a fallback avatar.
              </p>
            </div>

            <Input
              id="profile-fullname"
              label="Full name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (nameError) setNameError(null);
              }}
              error={nameError ?? undefined}
            />

            <Input
              id="profile-email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              error={emailError ?? undefined}
              hint="A confirmation email may be sent when you change your email."
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Department</label>
              <input
                type="text"
                value={currentUser?.department ?? ""}
                disabled
                className="w-full rounded-xl border border-border bg-bg/60 px-3.5 py-2.5 text-sm text-ink-muted cursor-not-allowed"
              />
              <p className="mt-1.5 text-xs text-ink-faint">
                Only admin/HR can update this field.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Section B: Preferences ─────────────────────────────── */}
      <Card>
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <IconSettings size={18} className="text-accent" />
            <h3 className="text-base font-semibold text-ink">Preferences</h3>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-ink">Display Currency</h4>
            <Select
              id="pref-currency"
              value={prefs.displayCurrency}
              onChange={(e) => updateCurrency(e.target.value as DisplayCurrency)}
            >
              <option value="GBP">GBP (\u00a3 British Pound)</option>
              <option value="USD">USD ($ US Dollar)</option>
              <option value="PHP">PHP (\u20b1 Philippine Peso)</option>
            </Select>
            <p className="mt-1.5 text-xs text-ink-faint">
              All amounts are stored in GBP and converted for display only.
            </p>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-ink">Date Format</h4>
            <Select
              id="pref-date-format"
              value={prefs.dateFormat}
              onChange={(e) => updateDateFormat(e.target.value as DateFormat)}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 19/08/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/19/2026)</option>
            </Select>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-ink">Notifications</h4>
            <Toggle
              checked={prefs.notifications.invoiceOverdue}
              onChange={(v) => updateNotification("invoiceOverdue", v)}
              label="Notify me when an invoice is marked overdue"
            />
            <Toggle
              checked={prefs.notifications.payrollRunCompleted}
              onChange={(v) => updateNotification("payrollRunCompleted", v)}
              label="Notify me when a payroll run is completed"
            />
            <Toggle
              checked={prefs.notifications.systemReportReply}
              onChange={(v) => updateNotification("systemReportReply", v)}
              label="Notify me when someone replies to my system report"
            />
          </div>
        </div>
      </Card>

      {/* ── Section C: Security ────────────────────────────────── */}
      <Card>
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <IconShield size={18} className="text-accent" />
            <h3 className="text-base font-semibold text-ink">Security</h3>
          </div>

          {currentUser?.passwordChangedAt && (
            <p className="text-xs text-ink-faint">
              Last changed: {formatDatePref(currentUser.passwordChangedAt, currentUser.preferences?.dateFormat ?? "DD/MM/YYYY")}
            </p>
          )}

          <div className="space-y-4">
            <Input
              id="current-password"
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (passwordError) setPasswordError(null);
                if (passwordSuccess) setPasswordSuccess(false);
              }}
              autoComplete="current-password"
            />
            <Input
              id="new-password"
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (passwordError) setPasswordError(null);
                if (passwordSuccess) setPasswordSuccess(false);
              }}
              autoComplete="new-password"
              hint="Must be at least 6 characters"
            />
            <Input
              id="confirm-password"
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (passwordError) setPasswordError(null);
                if (passwordSuccess) setPasswordSuccess(false);
              }}
              autoComplete="new-password"
            />

            {passwordError && (
              <p className="text-sm text-danger">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-ok">Password changed successfully.</p>
            )}
          </div>
        </div>
      </Card>

      {/* ── Save Button ────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!isDirty}>
          Save changes
        </Button>
      </div>
    </div>
  );
}

/* ── Profile Sidebar Card ─────────────────────────────────────── */

function ProfileCard() {
  const { currentUser } = useData();
  if (!currentUser) return null;

  const roleTone =
    currentUser.role === "Admin"
      ? "accent"
      : currentUser.role === "Sub-admin"
        ? "warn"
        : "neutral";

  const dateFormat = currentUser.preferences?.dateFormat ?? "DD/MM/YYYY";
  const joinedDate = currentUser.createdAt
    ? `Since ${formatDatePref(currentUser.createdAt, dateFormat)}`
    : null;

  const now = new Date();
  const localTime = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col items-center px-5 pt-6 pb-5">
        <div className="relative">
          <Avatar name={currentUser.name} size={80} />
          <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-surface bg-ok" />
        </div>

        <h3 className="mt-4 text-center font-display text-lg font-bold text-ink">
          {currentUser.name}
        </h3>

        {joinedDate && (
          <p className="mt-1 text-xs text-ink-muted">{joinedDate}</p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <Badge tone={roleTone}>{currentUser.role}</Badge>
        </div>

        <div className="mt-4 w-full space-y-2 text-sm">
          <div className="flex items-center gap-2 text-ink-muted">
            <span className="font-medium text-ink">Department:</span>
            <span>{currentUser.department}</span>
          </div>
          <div className="flex items-center gap-2 text-ink-muted">
            <span className="font-medium text-ink">Email:</span>
            <span className="truncate">{currentUser.email}</span>
          </div>
        </div>

        <div className="mt-4 w-full border-t border-border pt-3">
          <p className="text-center text-xs text-ink-faint">
            {localTime} &middot; {timezone}
          </p>
        </div>
      </div>
    </Card>
  );
}

/* ── Vertical Navigation ──────────────────────────────────────── */

function ProfileNav({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onTabChange(item.key)}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-accent-soft text-accent-dark"
                : "text-ink-muted hover:bg-bg hover:text-ink"
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
            )}
            <Icon size={18} className={isActive ? "text-accent" : ""} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ── Profile Page ─────────────────────────────────────────────── */

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div className="flex gap-6">
      {/* Left sidebar panel */}
      <aside className="w-72 shrink-0 space-y-4">
        <ProfileCard />
        <Card className="p-2">
          <ProfileNav activeTab={activeTab} onTabChange={setActiveTab} />
        </Card>
      </aside>

      {/* Right content area */}
      <main className="min-w-0 flex-1">
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "account-settings" && <AccountSettingsTab />}
        {activeTab === "vacation-leaves" && <VacationLeavesPage />}
      </main>
    </div>
  );
}
