# LMS build and verification checklist

This file distinguishes code present in this starter implementation from work that still requires local integration or further development. Do not treat the project as production-approved until the verification checklist passes against a non-production MongoDB database.

## Implemented in this codebase

- Next.js App Router, React, TypeScript, Tailwind CSS, responsive admin/member layouts, light/dark theme, toast notifications and loading/error/not-found UI.
- MongoDB/Mongoose connection helper and models for users, sessions, members, books, authors, categories, publishers, borrowing records, reservations, fines, fine payments, notifications, settings, rate limiting and audit logs.
- Credentials-based sign-in/sign-out, registration with server-assigned Member role, hashed passwords, database-backed sessions, rate limiting, password-change form and role-aware protected layouts/API checks.
- Book management, member list/detail, metadata management (authors/categories/publishers), issue/return/renewal endpoints, reservation actions, fine/payment management, admin fine waiver with audit entry, notifications, settings, reports/CSV output, global search and a member-facing catalog/details/profile/loan/reservation/fines area.
- Zod validation for key inputs, sample-data seed script, unit tests, README, environment example and Bangla setup instructions.

## Required local verification before relying on it

1. Copy `.env.example` to `.env.local` and set a private MongoDB Atlas URI plus a strong seed-admin password.
2. Run `npm install`, then `npm run seed` and `npm run dev`.
3. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`; fix any reported errors before deployment.
4. Test every API and role against a separate development database: Admin, Librarian, and Member; unauthorized requests; invalid IDs; duplicate/parallel issue and return attempts; reservation rules; fine payments; and audit logs.
5. Configure production secrets, MongoDB network access, and a transaction-capable MongoDB Atlas deployment before deploying.

## Known gaps / follow-up work

- Damaged/lost-book workflows and related inventory/fine policy are not fully implemented.
- Email-based password reset, external email notifications, and a scheduled reminder worker need provider/scheduler configuration and additional implementation.
- Image upload/storage is not integrated; records currently use safe image URLs/fallbacks where supported.
- Printable issue/return/payment receipts and expanded print/export views need additional work.
- Authentication, inventory concurrency, report totals, accessibility, and all route behaviors still need end-to-end testing against a real development database.

## Verification performed while preparing this bundle

- A TypeScript/TSX syntax-transpile check reported zero syntax errors across 127 `.ts` / `.tsx` source files.
- A local relative/alias import-path scan found zero unresolved internal imports.
- Full dependency-aware TypeScript checking, tests, lint, and production build were **not verified** in the generation environment because npm registry DNS resolution prevented dependency installation.
