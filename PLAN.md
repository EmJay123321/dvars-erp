# Pathways ERP — Build Plan

> Front-end first. Mock data, no backend. The prototype UX spec in
> `PROJECT-CONTEXT.md` is the source of truth for screens and behavior.
> `DESIGN.md` ("Slash") is **not** used for the internal app — see the design
> tokens below.

## Phase 0 — Front-end-only (current phase)

Everything in this phase runs entirely in the browser. Data lives in typed
in-memory mock modules; auth is a mock session in React state (localStorage for
persistence). No backend, no real passwords, no real security. This phase
validates screens, interactions, and information architecture before the
backend is built.

**Explicitly deferred to a later phase:** bcrypt/argon2 password hashing,
server-side sessions or JWTs in httpOnly cookies, PostgreSQL + Prisma,
Express/Next API routes, PDF generation, CSV import parsing, file storage,
server-enforced role/status checks.

## Tech stack (Phase 0)

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 (already configured)
- Fonts via `next/font/google`: Space Grotesk, Inter, IBM Plex Mono
- No UI component library — small hand-rolled primitives (Button, Badge, Card,
  Input, Select, Table, Modal, EmptyState) so the design system stays tight.
- Charts: hand-drawn SVG (or a tiny dependency if needed later); no heavy chart
  lib in Phase 0 unless requested.
- Icons: inline SVG set (hand-picked, 1px stroke, matches token colors).

## Design system tokens (internal app — not Slash)

Light content area + dark "ledger" sidebar. Never merge with `DESIGN.md`.

```css
--bg:            #F5F6F8   /* page background */
--surface:       #FFFFFF   /* cards, panels */
--border:        #E3E6EC   /* hairlines */
--ink:           #14181F
--ink-muted:     #6B7280
--ink-faint:     #9CA3AF
--accent:        #1B6E5B   /* primary actions, links, active states */
--accent-dark:   #14584A
--accent-soft:   #E4F2EE
--ok:      #16A34A  (soft: #DCFCE7)   /* Paid / Active */
--warn:    #D97706  (soft: #FEF3C7)   /* Pending / Resigned */
--danger:  #DC2626  (soft: #FEE2E2)   /* Overdue / Terminated */
--rail-bg:       #0F1F1B   /* sidebar + login brand panel */
--rail-accent:   #34B294   /* active nav indicator */
```

Type roles: Space Grotesk 500–700 (headings, wordmark, italic 600 for
"signature" moments) · Inter 400–600 (body/UI) · **IBM Plex Mono 500/600
tabular figures for every monetary and numeric value** (signature ledger feel).

Layout signature: collapsible left sidebar (icon rail 68px → 232px on
hover/pin), rounded-2xl cards, pill status badges. Register all tokens as
Tailwind theme variables in `globals.css`.

## Project Structure (App Router)

```
├── app/
│   ├── (auth)/                    # Auth route group (no sidebar)
│   │   ├── layout.tsx             # Split layout: dark brand panel + form card
│   │   └── login/page.tsx         # Login form — validates against mock employees
│   └── (portal)/                  # Authenticated route group (shared sidebar shell)
│       ├── layout.tsx             # <SessionGuard/> + <Sidebar/> + <Topbar/> + children
│       ├── dashboard/page.tsx     # Role-aware dashboard (Admin vs Employee KPIs)
│       ├── payroll/
│       │   ├── page.tsx           # Admin: run/filter payroll · Employee: own history
│       │   └── [id]/page.tsx      # Payslip document (earnings/deductions, print)
│       ├── invoices/
│       │   ├── page.tsx           # Admin only: list + filters + create
│       │   └── [id]/page.tsx      # Invoice document (line items, mark as paid)
│       ├── reports/page.tsx       # Admin only: income/expense/P&L charts, export stubs
│       ├── settings/
│       │   ├── team/page.tsx      # Admin only: team table, status/role, invite flow
│       │   └── activity/page.tsx  # Admin only: chronological activity log
│       └── system-report/page.tsx # Nice-to-have: employee report + threaded replies
├── components/
│   ├── shell/                     # App chrome + guards
│   │   ├── sidebar.tsx            # Collapsible ledger sidebar (68px ⇄ 232px)
│   │   ├── topbar.tsx             # Page title, current user, logout
│   │   ├── session-guard.tsx      # Redirect to /login if unauthenticated
│   │   └── role-gate.tsx          # Block Admin-only routes for Employees
│   ├── ui/                        # Design-system primitives
│   │   ├── button.tsx, badge.tsx, card.tsx, input.tsx, select.tsx,
│   │   ├── table.tsx, modal.tsx, kpi-card.tsx, chart.tsx, avatar.tsx
│   │   └── empty-state.tsx
│   ├── payslip/
│   │   ├── payslip-document.tsx   # Full payslip layout (mono figures)
│   │   ├── earnings-table.tsx
│   │   └── deductions-table.tsx
│   └── invoice/
│       ├── invoice-document.tsx
│       └── line-items-table.tsx
├── features/                      # Feature page components (rendered by (portal)/ pages)
│   ├── dashboard/dashboard-page.tsx
│   ├── payroll/payroll-page.tsx, payslip-view.tsx
│   ├── invoices/invoices-page.tsx, invoice-view.tsx
│   ├── reports/reports-page.tsx
│   ├── settings/team-page.tsx, activity-page.tsx
│   └── system-report/system-report-page.tsx
├── lib/
│   ├── types.ts                   # Domain types: Employee, PayrollRecord, Invoice, Report, ...
│   ├── design.ts                  # Design tokens consumed by components
│   ├── format.ts                  # Currency (GBP), date, period, mono-figure helpers
│   ├── auth.ts                    # Mock session: login/logout/currentUser (localStorage)
│   ├── defaults.ts                # All hardcoded fallback content (hero, labels, etc.)
│   └── mock/                      # In-memory mock data (front-end only)
│       ├── employees.ts, payroll.ts, invoices.ts,
│       ├── activity.ts, reports.ts, dashboard.ts
├── public/                        # Static assets (brand, placeholder photos)
└── PLAN.md
```

## Mock data & auth

- `lib/mock/*` export typed arrays following the Rough data model in
  `PROJECT-CONTEXT.md` (Employee, PayrollRecord, Invoice, Report,
  ReportReply, ActivityLogEntry).
- Demo accounts (prototype shortcuts, kept for Phase 0 usability):
  - `admin@pathways.com` → role `Admin`, status `Active`
  - `maya@pathways.com` → role `Employee`, status `Active`
  - one inactive account to demonstrate the blocked-login error.
- `lib/auth.ts` stores `currentUser` in React state + `localStorage`; login
  validates against mock employees, shows inline error for bad credentials
  **or** non-Active status; logout clears session → redirect to `/login`.
- `SessionGuard` (client layout) redirects to `/login` when unauthenticated.
- `RoleGate` blocks Admin-only routes for Employees (redirect to their
  dashboard).
- Status `Terminated`/`Resigned` blocks login. Setting the current user's
  status to inactive (in Settings) ends the session immediately.
- Inline role/status edits mutate in-memory mock state only (no persistence
  across reloads for writes — acceptable in Phase 0).

## Screens & behavior checklist (per module)

### Login
- Brand panel (rail-bg) + form card, email + password, inline error, role-based
  redirect (Admin → `/dashboard`, Employee → `/dashboard`), logout returns here.

### Dashboard
- **Admin:** KPI cards (employees, payroll total, invoices, revenue, expenses,
  paid-vs-pending), revenue/expense chart, recent activity feed.
- **Employee:** own-data KPI summary (recent payslip, YTD net), no finance
  overview of company, no other employees.

### Payroll / Payslip
- **Admin:** create (manual form + CSV-import stub button), filter by
  employee/period/status, click row → payslip document (earnings/deductions
  breakdown, net, download/print stub).
- **Employee:** same payslip view, scoped to own records only; view/download own
  payslips and payroll history.

### Invoices (admin only)
- Create invoice, filter by status (Pending/Paid/Overdue), click row → invoice
  document (line items, amount, mark as paid).

### Financial Reports (admin only)
- Income, expense, P&L views; expense breakdown; monthly/yearly toggle; export
  buttons as non-functional stubs (Phase 0).

### Settings → Team & permissions (admin only)
- Team list; **Role** (`Admin`/`Employee`, set at invite, not editable inline);
  **Status** (`Active`/`Terminated`/`Resigned`, editable inline); icon-only
  status filter; Invite user flow (name + email, role picked, generated temp
  password shown once).

### Settings → Activity log (admin only)
- Chronological log of actions.

### System Report (nice-to-have)
- Employee free-text report to manager; admin inline threaded reply.

## Build order (Phase 0 milestones)

1. **Foundation** — Tailwind tokens in `globals.css`, fonts in `layout.tsx`,
   `lib/design.ts`, `lib/format.ts`, domain types.
2. **Mock data + auth** — `lib/mock/*`, `lib/auth.ts`, demo accounts.
3. **Shell** — `SessionGuard`, `RoleGate`, sidebar (68px↔232px collapse),
   topbar, login page with redirects.
4. **Dashboard** — KPI cards, SVG chart, activity feed, admin vs employee.
5. **Payroll/Payslip** — list + filters + create modal + payslip document.
6. **Invoices** — list + filters + create + invoice document + mark paid.
7. **Reports** — charts, breakdown, export stubs.
8. **Settings** — team table, status/role controls, invite flow, activity log.
9. **System Report** — employee report + threaded replies (if time permits).
10. **Polish + QA** — responsive, empty states, keyboard/focus, lint + build.

## Definition of done (Phase 0)

- All screens above reachable and functional with mock data, per the prototype
  behavior spec.
- Numeric values render in IBM Plex Mono tabular figures; design tokens match
  the table above.
- `npm run lint` and `npm run build` pass.

## Out of scope

- Any backend, database, real auth, real PDF/CSV generation, file storage.
- Marketing/landing page built from `DESIGN.md` (only if explicitly asked).
- Client-facing school invoice portal.
