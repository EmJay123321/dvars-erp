# Pathways ERP — Project Context

## What this is

An internal ERP web app for Performance Pathways (an EdTech company selling PE
and school-sport curriculum memberships to international schools). It covers
three areas, with QuickBooks used as the reference for workflow and financial
structure:

- **Payroll / Payslip management** — admin runs payroll, staff view and
  download their own payslips.
- **Invoice management** — admin creates and tracks invoices to school clients.
- **Financial reports** — income, expenses, payroll summary, P&L, cash flow,
  monthly/yearly, exportable.

There are two portals, gated by login:

- **Admin** — full control: manage employee accounts, run payroll, manage
  invoices, view financial reports, manage team status/role, view activity
  log.
- **Employee** (originally called "VA Portal" in early planning) — self-serve:
  view/download own payslips, view own payroll history, update profile,
  submit a written report to their manager. No visibility into other
  employees' data. The core goal is that employees never have to ask admin
  for a payslip copy.

## Reference material in this repo

- **`erp_prototype.jsx`** — a front-end-only UX prototype built in Claude.ai
  (single React file, in-memory mock data, no backend). This is the
  **behavior and screen spec** to rebuild properly, not code to copy as-is.
  It is intentionally a single file with fake data, plaintext mock
  passwords, and no persistence — none of that should carry over. What
  *should* carry over: the screens, the interactions, the information
  architecture, and the visual design system described below.
- **`design.md`** — a style reference called "Slash" (dark theme, copper
  accent, Ivy Presto serif, marketing-site components like hero sections,
  testimonial cards, blog cards, pricing nav). **This is for a possible
  future marketing/landing page, not the internal app.** Do not apply it to
  the Admin/Employee dashboard screens — those follow the design system
  below instead. Only pull from `design.md` if asked to build a public-facing
  marketing site.

## Design system for the internal app (from `erp_prototype.jsx`)

Light app, dark "ledger" sidebar — distinct from `design.md`, do not merge them.

**Colors**
| Token | Value | Use |
|---|---|---|
| `--bg` | `#F5F6F8` | page background |
| `--surface` | `#FFFFFF` | cards, panels |
| `--border` | `#E3E6EC` | hairlines |
| `--ink` / `--ink-muted` / `--ink-faint` | `#14181F` / `#6B7280` / `#9CA3AF` | text |
| `--accent` / `--accent-dark` / `--accent-soft` | `#1B6E5B` / `#14584A` / `#E4F2EE` | primary actions, links, active states |
| `--ok` / `--warn` / `--danger` (+ `-soft` tints) | green / amber / red | status pills (Paid/Active, Pending/Resigned, Overdue/Terminated) |
| `--rail-bg` | `#0F1F1B` | sidebar + login brand panel background |
| `--rail-accent` | `#34B294` | active nav indicator, sidebar accents |

**Type**
- Space Grotesk (500/600/700, italic 600 for "signature" moments) — headings, brand wordmark
- Inter (400/500/600) — body and UI text
- IBM Plex Mono (500/600, tabular figures) — every monetary and numeric value, this is a deliberate signature detail (ledger feel)

**Layout signature**: collapsible left sidebar (icon rail at 68px, expands to 232px on click-to-pin or hover), dark ledger-green, light content area, rounded-2xl cards, pill status badges.

## Modules already speced in the prototype

- **Dashboard** — KPI cards (employees, payroll, invoices, revenue,
  expenses, paid-vs-pending), revenue/expense chart, recent activity. Admin
  and Employee get different dashboards.
- **Payroll / Payslip** — admin: create (manual form or CSV import stub),
  filter by employee/period, click a row to open a payslip document
  (earnings/deductions breakdown, download/print). Employee: same payslip
  view, scoped to their own records only.
- **Invoice** — admin: create, filter by status, click a row to open an
  invoice document (line items, mark as paid).
- **Financial Reports** — admin only: income/expense/P&L charts, expense
  breakdown, export buttons (currently non-functional stubs).
- **Settings → Team & permissions** — admin manages the team list. Two
  controls per person: **Role** (`Admin` / `Employee`, set at invite time,
  not editable inline) and **Status** (`Active` / `Terminated` / `Resigned`,
  editable inline — this is what actually gates login, see Auth below).
  There's also an icon-only status filter and an "Invite user" flow
  (name + email required, role picked at invite, temp password generated).
- **Settings → Activity log** — a simple chronological log.
- **System Report** — a lighter-weight feature: an automated "Admin Portal"
  memo summarizing live stats, plus a free-text box where an Employee can
  write a report to their manager, and Admin can reply inline (threaded).
  Treat this as a nice-to-have, not core to the ERP's purpose.

## Auth (currently prototyped, needs a real implementation)

The prototype has a working *UX* for this that should be preserved:
- Login screen (email + password, demo-account shortcuts in the prototype
  should be removed for the real build), inline error for bad credentials
  or an inactive account.
- Successful login redirects by role: `Admin` → Admin dashboard, `Employee`
  → Employee dashboard. No manual role switcher anywhere in the real app.
- Logout clears the session and returns to the login screen.
- Setting an employee's Status to `Terminated` or `Resigned` should block
  future logins for that account, and if it happens to the currently
  logged-in user, end their session immediately.

**What's fake and must not carry over:** passwords are plaintext strings in
client-side state, there's no server-side verification, and there's no
session mechanism at all — it's just a `currentUser` React state variable.
This is convincing UX, not security.

**What the real build needs:** hashed passwords (bcrypt/argon2), a real
backend to verify credentials, server-side sessions or JWTs in httpOnly
cookies, and role/status checks enforced on the server for every request —
not just hidden in the UI.

## Suggested tech stack

- **Frontend**: React (the existing prototype is a reasonable starting
  point for screens/components; consider Next.js if SSR/routing is wanted)
- **Backend**: Node/Express or Next.js API routes
- **Database**: PostgreSQL + Prisma
- **Auth**: bcrypt for password hashing, JWT or server-side sessions in
  httpOnly cookies, middleware enforcing role + active-status checks
- **PDF generation**: for payslips and invoices (e.g. `pdf-lib` or `pdfkit`)
- **CSV import**: `multer` for upload + `csv-parse` for parsing payroll
  batches
- **File storage**: wherever generated PDFs / uploaded CSVs live (local
  disk is fine to start, object storage for production)

## Rough data model

```
Employee
  id, name, email, password_hash, role (Admin|Employee),
  status (Active|Terminated|Resigned), department, created_at

PayrollRecord
  id, employee_id, period_start, period_end, gross, deductions, net,
  status (Pending|Paid), paid_at

Invoice
  id, client_name, amount, issued_at, due_at,
  status (Pending|Paid|Overdue)

Report            -- optional, "System Report" feature
  id, employee_id, text, created_at

ReportReply        -- optional
  id, report_id, text, created_at

ActivityLogEntry
  id, actor_employee_id, description, created_at
```

## Out of scope for now

- Client-facing portal for schools to view their own invoices (mentioned as
  a "maybe eventually" in the original spec — don't build unless asked).
- The System Report feature is a nice flourish carried over from the
  prototype; deprioritize it if time is tight, the payroll/invoice/reports
  core is what matters.