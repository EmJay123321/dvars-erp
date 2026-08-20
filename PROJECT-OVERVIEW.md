# DVARS ERP — Project Overview

> An internal ERP web app for **DVARS (Dynamic VA Referral Services)** — a virtual staffing agency managing clients (schools) and Virtual Assistants (VAs), handling payroll, invoicing, and financial reporting.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 + TypeScript |
| **Styling** | Tailwind CSS 4 with custom design token system |
| **State Management** | React Context + localStorage (Phase 0 — no backend) |
| **Fonts** | Montserrat (headings), Lato (body), IBM Plex Mono (monospace/numeric) |
| **Linting** | ESLint 9 + `eslint-config-next` (core-web-vitals + TypeScript) |
| **Build** | `next build`, PostCSS via `@tailwindcss/postcss` |

---

## Project Structure

```
dvars-erp/
├── app/                          # Next.js App Router pages & layouts
│   ├── layout.tsx                # Root layout (fonts, metadata, Providers)
│   ├── page.tsx                  # Root page → redirects to /login
│   ├── providers.tsx             # Client providers (Toast + DataProvider)
│   ├── globals.css               # Tailwind + custom theme tokens + print styles
│   ├── (auth)/                   # Unauthenticated route group
│   │   ├── layout.tsx            # Minimal full-height layout
│   │   ├── login/page.tsx        # Login screen (email + password)
│   │   └── set-password/page.tsx # Force-change password (first-login flow)
│   └── (portal)/                 # Authenticated route group
│       ├── layout.tsx            # AppShell wrapper (sidebar + topbar)
│       ├── dashboard/page.tsx    # Role-aware dashboard
│       ├── directory/page.tsx    # Client & VA directory
│       ├── invoices/
│       │   ├── page.tsx          # Invoice listing
│       │   └── [id]/page.tsx     # Invoice detail
│       ├── payroll/
│       │   ├── page.tsx          # Payroll listing
│       │   └── [id]/page.tsx     # Payslip detail
│       ├── reports/page.tsx      # Financial reports (Income/Expenses/P&L)
│       ├── settings/
│       │   ├── team/page.tsx     # Team management (Admin only)
│       │   └── activity/page.tsx # Activity/audit log
│       ├── system-report/page.tsx # Weekly reports + threaded replies
│       └── no-access/page.tsx    # Fallback for users with no permissions
├── components/
│   ├── shell/                    # App chrome & access control
│   │   ├── app-shell.tsx         # Auth guard + sidebar + topbar layout
│   │   ├── sidebar.tsx           # Collapsible nav rail (68px ⇄ 232px)
│   │   ├── topbar.tsx            # Page title, user info, logout
│   │   ├── permission-gate.tsx   # Module-based access control
│   │   └── role-gate.tsx         # Role-based access control (Admin/Sub-admin)
│   ├── ui/                       # Design-system primitives (17 components)
│   │   ├── avatar.tsx            # Deterministic color initial avatars
│   │   ├── badge.tsx             # Status pill badges (ok/warn/danger/neutral/accent)
│   │   ├── button.tsx            # Pill buttons (primary/secondary/ghost/danger)
│   │   ├── card.tsx              # Generic card container
│   │   ├── chart.tsx             # Pure SVG line chart with gradient fills
│   │   ├── confirm-delete-modal.tsx # Safe delete confirmation dialog
│   │   ├── empty-state.tsx       # Empty state placeholder
│   │   ├── icons.tsx             # 30 hand-drawn SVG icons (Feather-style)
│   │   ├── input.tsx             # Text input with label/hint/error
│   │   ├── kpi-card.tsx          # KPI display card with tone variants
│   │   ├── modal.tsx             # Generic modal dialog (sm/md/wide)
│   │   ├── multi-select.tsx      # Searchable multi-select dropdown
│   │   ├── searchable-select.tsx # Searchable single-select dropdown
│   │   ├── select.tsx            # Native select wrapper
│   │   ├── table.tsx             # Generic typed data table
│   │   ├── toast.tsx             # Toast notification system
│   │   └── toggle.tsx            # Toggle/switch input
│   ├── invoice/                  # Invoice document rendering
│   │   ├── invoice-document.tsx  # Invoice detail wrapper + actions
│   │   ├── invoice-sheet.tsx     # Full branded invoice sheet
│   │   └── invoice-sheet.css     # Invoice print/display styles
│   └── payslip/                  # Payslip document rendering
│       ├── payslip-document.tsx  # Payslip detail wrapper + actions
│       └── payslip-sheet.css     # Payslip print/display styles
├── features/                     # Feature page components (3,678 total lines)
│   ├── dashboard/dashboard-page.tsx      # Role-based KPI dashboard (213 lines)
│   ├── directory/
│   │   ├── directory-page.tsx            # Client & VA directory manager (452 lines)
│   │   └── directory-record-modal.tsx    # Create/edit client/VA modal (675 lines)
│   ├── invoices/
│   │   ├── invoices-page.tsx             # Invoice listing (123 lines)
│   │   ├── invoice-view.tsx              # Invoice detail page (76 lines)
│   │   └── invoice-template-modal.tsx    # WYSIWYG invoice creation (668 lines)
│   ├── payroll/
│   │   ├── payroll-page.tsx              # Payroll list + run-payroll modal (536 lines)
│   │   └── payslip-view.tsx              # Payslip detail page (55 lines)
│   ├── reports/reports-page.tsx          # Income/Expenses/P&L charts (181 lines)
│   ├── settings/
│   │   ├── team-page.tsx                 # Team management (331 lines)
│   │   ├── permissions-editor.tsx        # Sub-admin permission toggles (170 lines)
│   │   └── activity-page.tsx             # Activity timeline (39 lines)
│   └── system-report/system-report-page.tsx # Weekly reports + replies (159 lines)
├── lib/                          # Shared utilities & data layer
│   ├── types.ts                  # All TypeScript types, interfaces, constants
│   ├── store.tsx                 # React Context data store (1,107 lines) — the "backend"
│   ├── auth.ts                   # Password generation/hashing (mock, plain-text)
│   ├── format.ts                 # Currency, date, number formatting utilities
│   ├── invoice.ts                # Invoice numbering engine (parse, format, next)
│   ├── directory-delete.ts       # Safe deletion with linked-record checks
│   ├── invite-email.ts           # Placeholder email sender
│   └── mock/                     # Seed data (mostly empty, populated via UI)
│       ├── index.ts              # Barrel re-export
│       ├── employees.ts          # 2 seed employees + salary lookup
│       ├── payroll.ts            # Empty array
│       ├── invoices.ts           # Empty array
│       ├── directory.ts          # Empty arrays (clients + VAs)
│       ├── dashboard.ts          # Zeroed-out chart templates (6 months)
│       ├── reports.ts            # 3 seed reports with 1 reply
│       └── activity.ts           # Empty array
├── public/                       # Static assets (logos, SVGs)
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── PROJECT-CONTEXT.md            # Detailed project context & original spec
├── PLAN.md                       # Build plan & design tokens
├── SCHEMA.md                     # Database schema (MongoDB + Prisma)
├── DESIGN.md                     # Marketing site style guide ("Slash" theme)
└── README.md                     # Default Next.js readme
```

---

## Application Roles & Access Control

| Role | Access Level |
|---|---|
| **Admin** | Full access to all modules and team management |
| **Sub-admin** | Granular per-module permissions (View/Add/Edit/Delete), configurable by Admin |
| **Employee** | Limited to Dashboard, own Payslips, and System Report |

### Module Permission Keys

`dashboard` · `payroll` · `invoices` · `directory` · `reports` · `systemReport` · `activityLog`

The **Team & Permissions** page (`/settings/team`) is restricted to **Admin** role only via `RoleGate`.

---

## URL Route Map

| URL | Feature | Access Control |
|---|---|---|
| `/` | Redirects to `/login` | — |
| `/login` | Sign-in form | Public |
| `/set-password` | Force-change password | `mustChangePassword` guard |
| `/dashboard` | Role-aware KPI dashboard | `PermissionGate: dashboard` |
| `/directory` | Client & VA directory | `PermissionGate: directory` |
| `/invoices` | Invoice listing | `PermissionGate: invoices` |
| `/invoices/:id` | Invoice detail | `PermissionGate: invoices` |
| `/payroll` | Payroll listing | `PermissionGate: payroll` |
| `/payroll/:id` | Payslip detail | `PermissionGate: payroll` |
| `/reports` | Financial reports | `PermissionGate: reports` |
| `/settings/team` | Team management | **`RoleGate: Admin`** |
| `/settings/activity` | Activity log | `PermissionGate: activityLog` |
| `/system-report` | Weekly reports | `PermissionGate: systemReport` |
| `/no-access` | No permissions fallback | None |

---

## Key Features

### Authentication & Session
- Email + password login with inline error handling
- Demo accounts: `admin@pathways.com` / `maya@pathways.com` (password: `demo1234`)
- First-login forced password change flow (`mustChangePassword`)
- Session persisted to `localStorage`
- Terminated/Resigned status blocks login

### Dashboard
- **Admin/Sub-admin:** 6 KPI cards (employees, payroll net, outstanding invoices, revenue, expenses, paid-vs-pending), revenue vs expenses line chart, recent activity feed
- **Employee:** 3 KPI cards (latest net pay, total payslips, YTD net), own payslip history

### Directory (Clients & VAs)
- Tabbed interface for Clients and Virtual Assistants
- Full CRUD with soft-delete (archive/restore)
- Per-client invoice numbering configuration (prefix, separator, year mode, padding, sequence reset)
- VA creation auto-generates team account with temporary access code
- Linked-record checks before deletion (invoices, payroll)

### Payroll & Payslips
- **Admin:** Run payroll with weekly hours/earnings grid, auto-calculates gross-to-net (20% tax, 12% NI, 5% pension), mark as paid
- **Employee:** View own payslips only
- Print-ready payslip documents with company branding

### Invoices
- WYSIWYG invoice creation modal with client/VA selection
- Inline time-log table (date, login/logout times, hours, rate)
- Auto-numbering from client invoice settings
- Discount support (% or flat)
- Mark as paid, print/PDF-ready invoice documents

### Financial Reports
- Three tabs: Income, Expenses, P&L
- SVG line charts with gradient fills
- Expense breakdown by category (horizontal bar chart)
- Export stubs (CSV placeholder, print)

### System Reports
- Employees submit weekly text reports to managers
- Admins/Sub-admins view all reports with threaded reply capability

### Settings
- **Team Management (Admin only):** User table with status/role controls, create Sub-admin, permissions editor
- **Permissions Editor:** Granular per-module View/Add/Edit/Delete toggles for Sub-admin accounts
- **Activity Log:** Chronological audit trail

---

## Design System

Light content area with a dark "ledger" sidebar. Custom Tailwind theme tokens defined in `globals.css`.

### Colors

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#F5F6F8` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, panels |
| `--color-border` | `#E3E6EC` | Hairlines |
| `--color-ink` | `#2B3139` | Primary text |
| `--color-ink-muted` | `#6B7280` | Secondary text |
| `--color-ink-faint` | `#9CA3AF` | Placeholder text |
| `--color-accent` | `#1DC8CD` | Primary actions, links, active states |
| `--color-accent-dark` | `#0B7E85` | Accent hover state |
| `--color-accent-soft` | `#E0F6F7` | Accent background tint |
| `--color-ok` | `#16A34A` | Success (Paid/Active) |
| `--color-warn` | `#D97706` | Warning (Pending/Resigned) |
| `--color-danger` | `#DC2626` | Error (Overdue/Terminated) |
| `--color-rail-bg` | `#2B3139` | Sidebar background |
| `--color-rail-accent` | `#1DC8CD` | Active nav indicator |

### Typography

| Role | Font | Weights |
|---|---|---|
| Display / Headings | Montserrat | 500, 600, 700, 800 |
| Body / UI | Lato | 400, 700 |
| Numeric / Tabular | IBM Plex Mono | 500, 600 (tabular figures) |

### Layout Signature
- Collapsible left sidebar (68px icon rail ⇄ 232px expanded)
- Rounded-2xl cards
- Pill-shaped status badges
- Print-ready A4 document layouts

---

## Data Store

The entire backend is emulated in `lib/store.tsx` (1,107 lines) using React Context + `localStorage`. There is **no real backend** — all data lives client-side.

### localStorage Keys

| Key | Content |
|---|---|
| `pathways-erp-session` | Current user session |
| `pathways-erp-directory` | Clients + VAs (v2) |
| `pathways-erp-employees` | Employee accounts |
| `pathways-erp-invoices` | Invoice records |
| `pathways-erp-payroll` | Payroll records |
| `pathways-erp-invoice-numbering` | Per-client numbering state |

### Payroll Calculations
- **Tax:** 20%
- **National Insurance:** 12%
- **Pension:** 5%
- **Net** = Gross - Tax - NI - Pension

---

## Planned Backend (Phase 1+)

Per `SCHEMA.md`, the target backend stack:

| Layer | Technology |
|---|---|
| **Database** | MongoDB |
| **ORM** | Prisma (MongoDB connector) |
| **Password Hashing** | bcrypt/argon2 |
| **Sessions** | httpOnly cookies with token hashing |
| **API** | Next.js API routes |
| **PDF Generation** | `pdf-lib` or `pdfkit` |
| **CSV Import** | `multer` + `csv-parse` |

### Database Collections (Planned)

`departments` · `clients` · `users` · `user_invites` · `sessions` · `invoices` · `payroll_records` · `expenses` · `reports` · `activity_logs`

---

## Git History

```
e74cba3 payslip name
9cb9253 payslip
409a93f Team Permission changes
1b09858 INVOICE NO.
080f7dc invoices
0685cd6 DVARS Details
2679514 first commit
```

**Repository:** https://github.com/EmJay123321/dvars-erp.git

---

## Reference Documents

| File | Purpose |
|---|---|
| `PROJECT-CONTEXT.md` | Detailed project context, original spec, and data model |
| `PLAN.md` | Build plan, design tokens, project structure, and milestone checklist |
| `SCHEMA.md` | Target MongoDB + Prisma database schema (source of truth for backend) |
| `DESIGN.md` | Marketing/landing page style guide ("Slash" theme) — **not used for internal app** |
