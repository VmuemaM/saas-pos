# NexusERP

An all-in-one, multi-tenant **SaaS ERP** built with Next.js 16, TypeScript, Prisma 7 and PostgreSQL. It bundles four operational modules behind a single workspace with role-based auth:

- **Point of Sale** — product catalog, inventory & stock movements, a touch-friendly POS terminal, sales/receipts, customers
- **Human Resources** — employees, departments, attendance, leave requests/approvals, payroll
- **Accounting** — chart of accounts, double-entry general journal, invoices, expenses, and live financial reports (P&L, Balance Sheet, Trial Balance)
- **Manufacturing** — bills of materials (BOM), work orders, and production tracking that consumes raw materials and yields finished goods

Modules are integrated: POS sales, payroll runs, invoice payments and expenses automatically post double-entry journal entries, and completed work orders move stock between raw materials and finished goods.

## Tech stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **TypeScript**, **Tailwind CSS**
- **Prisma 7** ORM with the `@prisma/adapter-pg` driver adapter
- **PostgreSQL**
- Custom JWT session auth (`jose` + `bcryptjs`), multi-tenant (every record scoped by `organizationId`)

## Getting started

### 1. Database

A PostgreSQL database is required. For local development:

```bash
docker run -d --name erp-postgres \
  -e POSTGRES_USER=erp -e POSTGRES_PASSWORD=erp -e POSTGRES_DB=erp \
  -p 5433:5432 postgres:16
```

### 2. Environment

Create `.env` (see `.env.example`):

```
DATABASE_URL="postgresql://erp:erp@localhost:5433/erp?schema=public"
AUTH_SECRET="change-me-to-a-long-random-string"
```

### 3. Install, migrate, seed, run

```bash
npm install
npx prisma migrate deploy   # or: npx prisma migrate dev
npm run db:seed             # optional demo data
npm run dev
```

Visit http://localhost:3000.

### Demo login (after seeding)

```
Email:    owner@demo.com
Password: password123
```

Or create a fresh workspace from the **Sign up** page — a new organization is provisioned with a standard chart of accounts.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript checks |
| `npm run db:seed` | Seed demo data |

## Notes

- Monetary values use `Float` for simplicity in this scaffold. For production accounting, migrate money columns to `Decimal` and handle serialization to client components accordingly.
- This is **Phase 1** — it implements the core features of each module with a clean foundation to extend (deeper reporting, purchase orders, multi-currency, granular permissions, etc.).
