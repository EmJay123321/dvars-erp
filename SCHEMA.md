# Pathways ERP — Database Schema

> Target stack: **MongoDB + Prisma ORM**
> This document is the source of truth for the backend data model. It is
> designed to support every dashboard in the Admin and Employee portals so the
> backend and database can be built without rework.

## Money handling

Prisma's MongoDB connector **does not support `Decimal`**. All monetary values
are stored as **`Int` minor units (pence)** — exact, aggregation-friendly, and
converted to pounds only at the UI boundary via a `lib/money.ts` helper.

- `8400.00` → stored as `840000`
- Every monetary field name is suffixed with nothing (documented below as pence)
- `currency` is stored per-invoice (default `GBP`)

## Conventions

| Convention | Rule |
|---|---|
| IDs | `String @id @default(auto()) @map("_id") @db.ObjectId` (BSON ObjectId) |
| Foreign keys | `String @db.ObjectId` + `@relation(fields: [...], references: [id])` |
| Timestamps | `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt` |
| Money | `Int` pence |
| Status / role / category | Prisma-level enums (MongoDB has no native enums) |
| Collections | snake_case, set via `@@map` |

## Enums

| Enum | Values | Used on |
|---|---|---|
| `Role` | `Admin`, `Employee` | `users.role` |
| `EmployeeStatus` | `Active`, `Terminated`, `Resigned` | `users.status` — gates login |
| `PayrollStatus` | `Pending`, `Paid` | `payroll_records.status` |
| `InvoiceStatus` | `Pending`, `Paid`, `Overdue` | `invoices.status` |
| `ExpenseCategory` | `Salaries`, `Software`, `Marketing`, `Travel`, `Other` | `expenses.category` |
| `InviteStatus` | `Pending`, `Accepted`, `Expired`, `Revoked` | `user_invites.status` |

## Collections

### `departments`

Master list of departments (normalizes the old free-text `department`).

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId | PK |
| `name` | String | `@unique` |
| `createdAt` / `updatedAt` | DateTime | |

Indexes: `name` (unique).

### `clients`

School clients that invoices are raised against.

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId | PK |
| `name` | String | `@unique` |
| `contactEmail` | String? | |
| `notes` | String? | |
| `createdAt` / `updatedAt` | DateTime | |

Indexes: `name` (unique).

### `users`

Every account in the system. `status` determines whether the account may log in
(`Terminated` / `Resigned` blocks login and ends live sessions).

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId | PK |
| `name` | String | |
| `email` | String | `@unique`, used for login |
| `passwordHash` | String | bcrypt/argon2 hash — never plaintext |
| `role` | `Role` | set at invite, not edited inline |
| `status` | `EmployeeStatus` | editable inline in Settings → Team |
| `departmentId` | ObjectId? | FK → `departments.id` |
| `lastLoginAt` | DateTime? | |
| `createdAt` / `updatedAt` | DateTime | |

Relations: `payrollRecords[]`, `reports[]`, `sessions[]`, `invoicesCreated[]`,
`expenses[]`, `activityLogs[]`, `invitesSent[]`.
Indexes: `email` (unique), `status`, `departmentId`.

### `user_invites`

Pending / used invitations created in Settings → Team (name + email, role
picked, temp password generated once).

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId | PK |
| `email` | String | invited address |
| `role` | `Role` | role picked at invite |
| `departmentId` | ObjectId? | FK → `departments.id` |
| `tokenHash` | String | `@unique`, hashed invite token |
| `status` | `InviteStatus` | |
| `invitedById` | ObjectId | FK → `users.id` |
| `expiresAt` | DateTime | |
| `acceptedAt` | DateTime? | |
| `createdAt` | DateTime | |

Indexes: `tokenHash` (unique), `email`, `status`.

### `sessions`

Server-side login sessions (httpOnly cookie session token).

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId | PK |
| `userId` | ObjectId | FK → `users.id` |
| `tokenHash` | String | `@unique`, never store raw token |
| `userAgent` / `ip` | String? | audit metadata |
| `createdAt` | DateTime | |
| `expiresAt` | DateTime | |
| `revokedAt` | DateTime? | set on logout / forced termination |

Indexes: `tokenHash` (unique), `userId`, `expiresAt`.

### `invoices`

Invoices to school clients. `totalAmount` is denormalized from `lineItems` so
dashboard KPIs aggregate without unwinding.

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId | PK |
| `invoiceNumber` | String | `@unique`, e.g. `INV-1024` |
| `clientId` | ObjectId | FK → `clients.id` |
| `lineItems` | Json | `[{ label, qty, rate, amount }]` — matches `InvoiceLineItem` |
| `totalAmount` | Int | pence, sum of line items |
| `currency` | String | default `GBP` |
| `status` | `InvoiceStatus` | `Pending` / `Paid` / `Overdue` |
| `issuedAt` | DateTime | |
| `dueAt` | DateTime | |
| `paidAt` | DateTime? | set by "mark as paid" |
| `notes` | String? | |
| `createdById` | ObjectId | FK → `users.id`, audit |
| `createdAt` / `updatedAt` | DateTime | |

Indexes: `invoiceNumber` (unique), `clientId`, `status`, `issuedAt`.

### `payroll_records`

One document per employee per pay period. `gross` / `net` are denormalized from
`earnings` / `deductions` for fast filtering and charting.

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId | PK |
| `employeeId` | ObjectId | FK → `users.id` |
| `periodKey` | String | `@unique` = `employeeId:periodStart:periodEnd` — prevents double-paying a period (Mongo has no compound unique) |
| `periodStart` / `periodEnd` | DateTime | |
| `gross` | Int | pence |
| `net` | Int | pence |
| `earnings` | Json | `[{ label, amount }]` — matches `EarningsLine` |
| `deductions` | Json | `[{ label, amount }]` — matches `DeductionLine` |
| `status` | `PayrollStatus` | `Pending` / `Paid` |
| `paidAt` | DateTime? | |
| `paidById` | ObjectId? | FK → `users.id`, admin who ran/paid it |
| `createdAt` / `updatedAt` | DateTime | |

Indexes: `periodKey` (unique), `employeeId`, `status`, `[periodStart, periodEnd]`.

### `expenses`

Operating expenses outside payroll. Powers the expense breakdown and P&L views.
Payroll salaries appear in the Salaries category via `payroll_records`.

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId | PK |
| `category` | `ExpenseCategory` | |
| `description` | String | |
| `amount` | Int | pence |
| `expenseDate` | DateTime | |
| `createdById` | ObjectId | FK → `users.id` |
| `createdAt` / `updatedAt` | DateTime | |

Indexes: `category`, `expenseDate`.

### `reports`

Employee "System Report" to their manager, with threaded inline replies.
Replies are embedded (bounded child data).

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId | PK |
| `employeeId` | ObjectId | FK → `users.id`, author |
| `text` | String | |
| `replies` | Json | `[{ authorId, authorName, role, text, createdAt }]` — matches `ReportReply` |
| `createdAt` / `updatedAt` | DateTime | |

Indexes: `employeeId`.

### `activity_logs`

Chronological audit log shown in Settings → Activity.

| Field | Type | Notes |
|---|---|---|
| `id` | ObjectId | PK |
| `actorId` | ObjectId? | FK → `users.id`, null for system events |
| `action` | String | e.g. `create_invoice`, `mark_paid`, `run_payroll`, `update_status`, `invite_user` |
| `entityType` | String? | e.g. `invoice`, `payroll`, `user` |
| `entityId` | String? | id of the affected document |
| `description` | String | human-readable line |
| `metadata` | Json? | extra context, e.g. `{ from: "Active", to: "Resigned" }` |
| `createdAt` | DateTime | |

Indexes: `actorId`, `createdAt`.

## Relations map

```
departments 1──N users (departmentId)
users       1──N payroll_records (employeeId)
users       1──N reports (employeeId)
users       1──N invoices (createdById)
users       1──N expenses (createdById)
users       1──N activity_logs (actorId)
users       1──N sessions (userId)
users       1──N user_invites (invitedById)
departments 1──N user_invites (departmentId)
clients     1──N invoices (clientId)
```

Embedded (no collection): `invoices.lineItems`, `payroll_records.earnings`,
`payroll_records.deductions`, `reports.replies`.

## Dashboard → collection mapping

| Feature | Where it reads from |
|---|---|
| Admin KPI cards | `users` (count/status), `payroll_records` (gross/net sums), `invoices` (amount sums by status), `expenses` |
| Admin revenue/expense chart | paid `invoices` grouped by month vs `expenses` + paid `payroll_records` by month |
| Expense breakdown | `expenses` grouped by `category` (+ Salaries from payroll) |
| Top clients | `invoices` grouped by `clientId` |
| Paid vs pending | `invoices` / `payroll_records` grouped by `status` |
| Employee dashboard | own `payroll_records` by `employeeId` (latest payslip, YTD net) |
| Payroll list/filter | `payroll_records` filtered by `employeeId` / `periodStart`–`periodEnd` / `status` |
| Payslip document | `payroll_records` + embedded `earnings` / `deductions` |
| Invoice list/filter | `invoices` filtered by `status`; document = `lineItems` |
| Settings → Team | `users` (update `status`), `user_invites` (invite flow) |
| Settings → Activity | `activity_logs` |
| System Report | `reports` (employee writes, admin replies → `replies`) |

## Mock (`lib/mock/*`) → schema mapping

| Mock export | Schema target |
|---|---|
| `initialEmployees` | `users` (+ `departments` for `department` string) |
| `salaryByEmployeeId` | derived → seeded `payroll_records` |
| `initialPayroll` | `payroll_records` (+ embedded earnings/deductions) |
| `initialInvoices` | `clients` + `invoices` (+ embedded line items) |
| `initialActivity` | `activity_logs` |
| `initialReports` | `reports` (+ embedded replies) |
| `revenueByMonth` / `expensesByMonth` | derived from `invoices` / `expenses` + `payroll_records` |
| `expenseCategories` / `monthlyExpenses` | `expenses` |
| `topClients` | derived from `invoices` grouped by `clientId` |

## Future-proofing notes

- Adding a client-facing school invoice portal later = a new collection
  (`client_portal_accounts`) referencing `clients.id`; invoices already model
  client membership.
- `expense_categories` can be promoted from an enum to a collection if admin
  needs to create categories without a deploy.
- If a relational DB is ever chosen, this maps cleanly: enums → Postgres enums,
  embedded Json → child tables, `periodKey` → compound unique.
