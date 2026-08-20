# DVARS ERP — Project Context

## What this is

An internal ERP web app for DVARS (a VA referral / EdTech company). It covers
payroll, invoicing, directory management, financial reporting, vacation/leave
tracking, and team management — with role-based access for Admin, Sub-admin,
and Employee users.

There are two portals, gated by login:

- **Admin** — full control: manage employee accounts, run payroll, manage
  invoices, manage directory (clients & VAs), view financial reports, manage
  team status/role/permissions, approve leaves, view activity log.
- **Sub-admin** — granular per-module access configured by Admin. Sidebar
  filtered to only show modules the Sub-admin has `view` permission for.
- **Employee** — self-serve: view/download own payslips, request
  vacation/leaves, submit system reports, manage own profile. No visibility
  into other employees' data.

## Modules

- **Dashboard** — KPI cards (employees, payroll, invoices, revenue,
  expenses, paid-vs-pending), revenue/expense chart, recent activity.
  Admin and Employee get different dashboards.
- **Payroll / Payslip** — admin: run payroll (manual form with weekly
  breakdown rows, client/company fields, prepared-by/signed-by signers),
  mark as paid. Employee: view own payslips only. Each payslip shows
  weekly hours/earnings, auto-calculated tax/NI/pension, net pay.
- **Invoice** — admin: create via full-featured modal (client search-select,
  VA search-select, lead manager, work week selector with inline time
  tracking per line item, discount % or flat, per-client invoice numbering).
  Filter by status, mark as paid, print/download PDF.
- **Directory** — tabbed Clients & VAs management. Client form: name,
  company, assigned VA, contact info, billing address, default bill rate
  (USD), default discount %, invoice numbering configuration, status, notes.
  VA form: name, role, email, phone, assigned clients (multi-select), pay
  rate (PHP), bill rate (USD), date started, status, notes. Auto-creates
  Employee account for VAs with email. Soft-delete with restore.
- **Financial Reports** — admin only: Income (monthly line chart, total/
  average), Expenses (monthly line chart + horizontal bar breakdown by
  category: salaries, software, marketing, travel), P&L (income/expenses/
  net overlay chart, summary cards with margin %). Print button.
- **Vacation & Leaves** — tabbed module: Apply (leave balance cards + request
  form), Pending, Approved, Rejected (request cards with cancel for pending).
  Admin-only tabs: Calendar (monthly grid showing approved leaves by
  employee), Settings (leave policy configuration per type: annual credits,
  carry-over toggle). CSV export. Business-day calculation excludes weekends.
- **System Report** — weekly report/message board. Users submit text reports.
  Admin sees all reports; employees see only their own. Threaded reply system
  with author, role, and timestamp.
- **Team & Permissions** (Settings) — admin manages team list. Status filter,
  "Create Sub-Admin" button (generates random password, shows credentials
  once). Status change per row (Active/Pending/Invited/Resigned/Terminated).
  Permission editor modal per Sub-admin (8 modules x 4 actions).
  Safety: cannot delete/deactivate last Admin, cannot remove yourself.
- **Activity Log** (Settings) — timeline-style chronological log with actor
  avatar, description, and timestamp. Automatic logging for payroll runs,
  invoice creation, status changes, employee management, leave operations,
  report submissions, profile changes, password changes.
- **Profile** — self-service profile page with left sidebar + right content
  layout. Left: profile card (avatar, name, join date, role badge,
  department, email, local time/timezone) + vertical tab navigation.
  Right content tabs:
  - **Profile** (read-only): avatar, name, email, role, department, date
    joined. Sub-admins see a module permissions table.
  - **Account Settings**: three sections in white cards:
    - *Personal Info*: editable full name, email, avatar upload (placeholder),
      read-only department field.
    - *Preferences*: display currency (GBP/USD/PHP), date format (DD/MM or
      MM/DD), notification toggles.
    - *Security*: current/new/confirm password fields, validation, last
      changed date.
    Unified "Save changes" button at bottom (dirty detection, disabled when
    nothing changed, inline validation errors, toast on save).
  - **Vacation & Leaves**: embeds the full VacationLeavesPage component.

## Role & Permission System

### Roles
- `Admin` — full access to all modules, all permissions implicitly true
- `Sub-admin` — granular per-module view/add/edit/delete configured by Admin
- `Employee` — hardcoded limited access (dashboard, payslips, system report,
  profile, vacation & leaves)

### Permission Modules (8)
dashboard, payroll, invoices, directory, reports, systemReport,
activityLog, vacationLeaves

### Permission Actions (4)
view, add, edit, delete

### Route-Level Access Control
- **PermissionGate** wraps: dashboard, payroll, payroll/[id], invoices,
  invoices/[id], directory, reports, system-report, vacation-leaves,
  settings/activity
- **RoleGate** (Admin/Sub-admin) wraps: settings/team, settings/activity
- **Profile**: no gate (accessible to all authenticated users)
- **NoAccess page**: shown when Sub-admin has zero module permissions

### Employee Statuses
Active | Terminated | Resigned | Invited | Pending

Setting status to Terminated or Resigned blocks future logins. If it happens
to the currently logged-in user, their session ends immediately.

## Auth

- Login screen (email + password), inline error for bad credentials or
  inactive account. Demo account shortcuts available.
- Successful login redirects by role: Admin/Sub-admin → Admin dashboard,
  Employee → Employee dashboard.
- Logout clears session and returns to login screen.
- Invite flow: Admin creates employee → invite token with 48h expiry →
  employee sets password via `/set-password`.
- VA flow: VA added in Directory → temp password generated → must-change-
  password on first login.
- Password change: from Profile > Account Settings, requires current
  password verification. `passwordChangedAt` timestamp tracked.

## Invoice Numbering System

- **Per-client numbering**: each client has `InvoiceNumberSettings`
  (prefix, separator, year inclusion, year mode [issuedAt or fixed],
  padding, last number used, reset-each-year toggle).
- **Number generation**: `nextInvoiceNumber()` auto-increments with
  year-aware logic.
- **Duplicate detection**: prevents creating invoices with already-used
  numbers.
- **Conflict warnings**: warns when setting a "last number" below the
  highest already issued; warns when two clients share the same prefix.
- **Live preview**: "Next invoice number" shown in the client edit form.
- **Global defaults**: `InvoiceNumberDefaults` template new clients inherit.

## User Preferences System

- **Display currency**: GBP (source of truth), USD (rate: 1.27), PHP (rate:
  71.0). All stored values in GBP, converted for display only.
- **Date format**: DD/MM/YYYY or MM/DD/YYYY
- **Notifications**: 3 toggleable preferences (invoice overdue, payroll run
  completed, system report reply)
- Preference-aware formatters: `formatCurrencyPref()`, `formatDatePref()`,
  `formatDateTimePref()`, `formatPeriodPref()`.

## Design System

Light app, dark "ledger" sidebar.

**Colors**
| Token | Value | Use |
|---|---|---|
| `--bg` | `#F5F6F8` | page background |
| `--surface` | `#FFFFFF` | cards, panels |
| `--border` | `#E3E6EC` | hairlines |
| `--ink` / `--ink-muted` / `--ink-faint` | `#2B3139` / `#6B7280` / `#9CA3AF` | text |
| `--accent` / `--accent-dark` / `--accent-soft` | `#1DC8CD` / `#0B7E85` / `#E0F6F7` | primary actions, links, active states |
| `--ok` / `--warn` / `--danger` (+ `-soft` tints) | green / amber / red | status pills (Paid/Active, Pending/Resigned, Overdue/Terminated) |
| `--rail-bg` | `#2B3139` | sidebar background |
| `--rail-accent` | `#1DC8CD` | active nav indicator, sidebar accents |

**Type**
- Montserrat (500/600/700/800) — headings, brand wordmark
- Lato (400/700) — body and UI text
- IBM Plex Mono (500/600, tabular figures) — every monetary and numeric value

**Layout**: collapsible left sidebar (icon rail at 68px, expands to 232px on
hover or pin), dark ledger-green, light content area, rounded-2xl cards,
pill status badges.

## Tech Stack

- **Frontend**: Next.js (App Router) + React 19
- **State**: React Context (`DataProvider` in `lib/store.tsx`) with
  `localStorage` persistence
- **Styling**: Tailwind CSS v4
- **Charts**: Pure SVG line charts (custom `Chart` component)
- **Auth**: bcrypt password hashing (mock), localStorage session
- **PDF**: Browser print-to-PDF (print-optimized CSS)
- **Export**: CSV via Blob download

## File Structure

```
app/
  (auth)/login/          — Login page
  (auth)/set-password/   — First-time password setup
  (portal)/dashboard/    — Dashboard
  (portal)/payroll/      — Payroll list + [id] payslip detail
  (portal)/invoices/     — Invoice list + [id] invoice detail
  (portal)/directory/    — Client & VA directory
  (portal)/reports/      — Financial reports
  (portal)/system-report/ — System report board
  (portal)/vacation-leaves/ — Vacation & leaves module
  (portal)/profile/      — User profile + account settings
  (portal)/settings/team/   — Team & permissions
  (portal)/settings/activity/ — Activity log
  (portal)/no-access/    — Access denied page

components/
  shell/         — AppShell, Sidebar, Topbar, RoleGate, PermissionGate
  ui/            — Button, Card, Input, Select, Toggle, Modal, Table,
                   Avatar, Badge, KPI Card, Chart, Toast, Icons, etc.
  invoice/       — InvoiceDocument, InvoiceSheet (branded layout)
  payslip/       — PayslipDocument (branded layout)

features/
  dashboard/     — DashboardPage (admin + employee views)
  payroll/       — PayrollPage, PayslipView
  invoices/      — InvoicesPage, InvoiceView, InvoiceTemplateModal
  directory/     — DirectoryPage, DirectoryRecordModal
  reports/       — ReportsPage (Income, Expenses, P&L tabs)
  system-report/ — SystemReportPage
  vacation-leaves/ — VacationLeavesPage, ApplyTab, RequestsTab,
                     CalendarTab, SettingsTab, AdminApproveModal,
                     export-utils
  profile/       — ProfilePage (Profile, Account Settings, Vacation & Leaves tabs)
  settings/      — TeamPage, PermissionsEditor, ActivityPage

lib/
  store.tsx      — DataContext (auth, CRUD, business logic)
  types.ts       — TypeScript types, module keys, defaults
  format.ts      — Currency/date/period formatters
  mock/          — Seed data (employees, payroll, invoices, directory,
                   activity, reports, leaves, dashboard metrics)
```

## Reference Material

- **`erp_prototype.jsx`** — front-end-only UX prototype (single React file,
  in-memory mock data, no backend). This was the original behavior and screen
  spec. What should carry over: screens, interactions, information
  architecture, visual design.
- **`design.md`** — "Slash" style reference (dark theme, copper accent,
  marketing-site components). For a possible future public-facing marketing
  site, not the internal app.
