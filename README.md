# Greenfield Library — Library Management System

A responsive full-stack Library Management System for schools, colleges, universities, and other learning organizations. It uses Next.js App Router, React, strict TypeScript, Tailwind CSS, Mongoose, and MongoDB Atlas. The interface uses a custom-built Emerald/Slate design system rather than a copied admin template.

> **Implementation status:** This repository contains a working application baseline for authentication, role-protected workspaces, book and member catalog management, borrowing/return processing, reservations, fine payments, notification center, settings, reports, audit logs, and seed/test tooling. Production readiness still depends on configuring MongoDB Atlas and running the checks and workflows listed below. Do not deploy without testing in your own configured environment.

## Main features

- Secure email/password login with bcrypt password hashing, opaque database-backed sessions, HTTP-only cookies, logout, login throttling, member-only public registration, and password change that invalidates other sessions.
- Three roles: Admin, Librarian, and Member. Protected API handlers enforce roles on the server, and member record APIs filter by the signed-in user's own membership.
- Book catalog CRUD, unique ISBN protection, category/author/publisher references, archive-safe deletion, inventory fields, search, and pagination.
- Member directory CRUD and account status synchronization.
- Book issue/return workflows with membership checks, borrowing limits, conditional inventory updates, optional unpaid-fine restrictions, reservation hand-off, and return-time fine assessment.
- Loan renewal rules that check renewal limits and competing reservations.
- Reservation creation, duplicate-active-reservation protection, member cancellation, pickup status, and notifications.
- Fine-payment recording, partial payments, balance validation, payment methods, audit events, and member notices.
- Database-backed dashboard counts, monthly circulation series, category inventory, popular-books and operational reports; CSV export for books, members, and borrowing history.
- In-app notifications, read/unread state, library-policy configuration, admin audit log, role-aware global search, member/book details pages, responsive sidebar, mobile navigation, and light/dark theme toggle.
- Loading, empty, error, and not-found states. Layout adapts to mobile, tablet, laptop, and desktop.

## Technology stack

- **Frontend:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Lucide React, Recharts, React Hook Form + Zod for authentication forms, server-side Zod validation, Sonner toast notifications.
- **Backend:** Next.js Route Handlers, Mongoose ODM, bcryptjs, Zod validation, database-backed session cookies.
- **Database:** MongoDB Atlas. Multi-document borrowing/return and payment operations use MongoDB transactions, which require an Atlas deployment or another transaction-capable replica set.
- **Quality tools:** ESLint, TypeScript, Vitest, Prettier-ready source formatting.

The UI components in `components/` are written specifically for this project. Runtime dependencies are used for framework capabilities, icons, charts, validation and database access; no external website template or remote code import is used.

## Roles and core permissions

| Role | Main access |
|---|---|
| Admin | Full library administration, users/roles, catalog, members, circulation, fines/payments, reporting, policy settings and audit logs |
| Librarian | Catalog, members, borrowing and returns, reservations, payments and reports; cannot administer roles or restricted settings |
| Member | Own dashboard, public catalog, own loans/history, reservations, fines/payment history, notifications and permitted profile fields |

API permissions are enforced server-side. Hiding a link in the UI is not treated as authorization. Public registration always assigns the `Member` role on the server.

## MongoDB data model

The Mongoose models live in `models/`:

- `User`: normalized email, bcrypt hash, role, account status, image, login timestamp.
- `Session`: hashed random session token, user reference, expiry and user-agent metadata.
- `Member`: member ID, optional user reference, contact details, membership type/status, expiry and borrowing limit.
- `Book`: ISBN, author references, category/publisher references, publication and cover details, total/available copies, shelf, archive timestamp and borrowing count.
- `Author`, `Category`, `Publisher`: reference data for the collection.
- `BorrowingRecord`: member/book references, borrowed/due/return dates, status and renewal history.
- `Reservation`: member/book references, queue metadata, pickup expiry and lifecycle status.
- `Fine`, `FinePayment`: assessed amount and recorded payments, preserving historical rates and partial payment history.
- `Notification`: recipient, type, content, target URL, read timestamp and optional deduplication key.
- `LibrarySettings`: one controlled `key: "default"` policy record.
- `AuditLog`: actor, action, resource, timestamp and safe before/after snapshots.
- `RateLimit`: database-backed counters for sensitive authentication actions.

Important relationships: `Book.authorIds` references `Author`; `Book.categoryId` references `Category`; `Book.publisherId` references `Publisher`; circulation and fine records reference `Member`, `Book`, `User` and related transaction records. Indexes protect unique emails, member IDs, categories, author/publisher names, ISBNs, session token hashes and useful circulation filters.

## Folder structure

```text
app/
  (auth)/login/                 # sign in
  (auth)/register/              # member registration only
  (admin)/admin/dashboard/      # database-backed operations dashboard
  (admin)/admin/books/          # catalog and inventory CRUD UI
  (admin)/admin/members/        # member management
  (admin)/admin/borrowings/     # issue/renew flows
  (admin)/admin/returns/        # return flow
  (admin)/admin/{authors,categories,publishers}/
  (admin)/admin/{reservations,fines,payments,reports}/
  (admin)/admin/{notifications,users,settings,audit-logs}/
  (member)/member/              # reader portal routes, including catalog and book detail pages
  api/                          # server-side route handlers
components/                     # application UI and feature components
lib/                             # auth, database, validators, services and utilities
models/                          # Mongoose schemas and indexes
scripts/seed.ts                  # idempotent sample catalog/admin seeding
 tests/unit/                     # pure utility tests
```

## Prerequisites

- Node.js 20.11 or later (Node 22 LTS is suitable).
- npm.
- A MongoDB Atlas project and database user.
- A database deployment with transaction support for issue/return and payment workflows. For Atlas, use a supported cluster tier and confirm transaction availability in your deployment.

For a step-by-step Windows setup, see [`SETUP-BANGLA.md`](./SETUP-BANGLA.md).

## Local installation

1. Extract/clone this project and open the `library-management-system` folder in VS Code.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` (PowerShell: `Copy-Item .env.example .env.local`; Command Prompt: `copy .env.example .env.local`).
4. Replace `MONGODB_URI` with the connection string from MongoDB Atlas. URL-encode any special characters in the database password. Set `NEXT_PUBLIC_APP_URL=http://localhost:3000`, `LIBRARY_TIMEZONE=Asia/Dhaka`, and `LIBRARY_CURRENCY=BDT` for a Bangladesh-based library.
5. In Atlas Network Access, allow your current development IP rather than opening access to everyone. Ensure the database user has the required privileges.
6. Set `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL` and a strong `SEED_ADMIN_PASSWORD` in `.env.local`. The password must be at least 12 characters. Do not reuse a public/example password.
7. Seed the initial administrator, settings record, fictional authors/categories/publisher and six fictional sample books:

   ```bash
   npm run seed
   ```

   If the configured administrator email already belongs to a non-admin account, the normal seed stops instead of silently changing access. To explicitly promote that account and set its password from `SEED_ADMIN_PASSWORD`, run `npm run seed -- --reset-admin`.

8. Start development:

   ```bash
   npm run dev
   ```

9. Open `http://localhost:3000` and sign in with the administrator email/password configured before seeding.

### Sample data

The seed creates fictional book and author records for development and testing. It is idempotent for its seed keys and does not erase existing collections. It creates an administrator only if that email does not already exist; it will not silently reset an existing admin password. The explicit `--reset-admin` option promotes the configured email to Admin, activates it and resets its password from the local environment. It does not create or print a reusable hard-coded production credential.

## Commands

```bash
npm run dev       # development server
npm run typecheck # strict TypeScript check
npm run lint      # ESLint
npm test          # Vitest unit tests
npm run build     # optimized production build
npm run seed      # safe sample catalog/admin seeding (configured env required)
```

## Authentication and security notes

- Passwords are hashed with bcrypt. Plaintext passwords are never stored.
- Sessions use randomly generated, opaque tokens; only SHA-256 token hashes are stored in MongoDB. Cookies are HTTP-only, `SameSite=Lax`, and secure in production. The optional remember-me selection changes the session duration.
- Public registration can only create `Member` accounts. Role changes use an Admin-only endpoint and are audit logged.
- Login and registration endpoints use persisted rate-limit records.
- Zod schemas validate API input on the server. MongoDB query objects are built by server code, not accepted directly from clients.
- Members can only read their own borrowing, reservation, fine, payment, and notification records through member-scoped APIs.
- Do not commit `.env.local`, database credentials, password hashes, session tokens or private keys.

## Data integrity and transactions

Issue, return and payment workflows use MongoDB transactions to keep related writes together. The configured MongoDB deployment must support sessions and multi-document transactions (for example, an Atlas cluster or a transaction-capable replica set). If your local standalone MongoDB rejects transactions, these workflows return a clear error instead of claiming the operation succeeded. Do not disable transaction handling for production without designing and testing an alternative consistency strategy.

Inventory checks avoid issuing a copy after available inventory reaches zero. Return processing changes an active borrowing record once, increments the available-copy count conditionally, calculates overdue days in the configured library timezone, and assesses a fine using the policy active at return time. Payment creation rejects non-positive payments and payments larger than the remaining balance.

## Deployment (Vercel example)

1. Push the project to a private or public GitHub repository; keep `.env.local` out of version control.
2. Import it into Vercel and set `MONGODB_URI`, `NEXT_PUBLIC_APP_URL`, `LIBRARY_TIMEZONE`, and `LIBRARY_CURRENCY` under Project Settings → Environment Variables.
3. Configure a production MongoDB Atlas database user and restricted network access appropriate to your hosting setup.
4. Run the seed command intentionally against the target database from a trusted environment if you need the initial admin/catalog data. Do not automatically reseed on every deployment.
5. Redeploy, then verify login, admin access, member registration, create/edit/archive book, member management, issue/return, reservation, fine assessment, partial payment, CSV export, mobile layouts and reloads of nested routes.
6. Use a transaction-capable MongoDB deployment. If email reminders, external image storage or a background scheduler are introduced later, configure those providers separately; the current in-app notifications do not send scheduled email by themselves.

## Known limitations / production checklist

- This code bundle has not been connected to your own MongoDB Atlas account from this environment. You must configure credentials and run the local verification steps.
- The UI and API baseline covers primary operational paths, but you should test every route and role with real records before real institutional use. Advanced workflows such as damage/lost book processing, profile image uploads, email-based password recovery, scheduled reminders, external email notifications, and receipt printing need additional implementation/configuration. Fine waiver is available for Admin users with an audit record, but it still needs end-to-end validation.
- Google/GitHub OAuth is not part of this credentials-based login baseline; no external OAuth keys or callback setup were provided. Public signup is email/password Member-only.
- Image URLs are stored as metadata; no external image upload provider is configured.
- Payment records are accounting entries only. No real money processing provider is integrated.
- CSV exports cover books, members and borrowing records. Additional specialized exports can be added according to the institution's reporting rules.
- Integration/E2E tests need a configured test database and should use an isolated database, never production data.

## Screenshots

After running the project locally, add screenshots here (for example `public/images/dashboard.png`, `public/images/catalog.png`, and `public/images/member-portal.png`). Do not publish screenshots containing real member personal information.

## License

For educational and portfolio use unless a separate license is added.
