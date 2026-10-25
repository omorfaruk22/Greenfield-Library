# Library Management System — বাংলা Setup Guide

এই project-এর frontend, backend route, validation, authentication, database model ও UI component project-এর ভেতরে লেখা। Next.js/React/Mongoose/Zod-এর মতো framework/library import ব্যবহার করা হয়েছে; বাইরের website template import করা হয়নি।

## ১. প্রয়োজনীয় জিনিস

- Node.js 20.11 বা নতুন version
- VS Code
- MongoDB Atlas account (transaction-enabled cluster ব্যবহার করা ভালো)

## ২. Project চালু করা

1. ZIP extract করে `library-management-system` folder VS Code-এ open করো।
2. VS Code → Terminal → New Terminal খুলে চালাও:

   ```bash
   npm install
   ```

   PowerShell-এ `npm.ps1` execution policy error এলে Command Prompt terminal ব্যবহার করো, অথবা `npm.cmd install` চালাও।
3. `.env.example` কপি করে `.env.local` তৈরি করো:
   - PowerShell: `Copy-Item .env.example .env.local`
   - Command Prompt: `copy .env.example .env.local`
4. `.env.local` ফাইল খুলে Atlas থেকে পাওয়া connection string দিয়ে `MONGODB_URI` বদলাও। Password-এ `@`, `#`, `/`-এর মতো special character থাকলে URL-encode করতে হবে।
5. `SEED_ADMIN_EMAIL`-এ তোমার admin email এবং `SEED_ADMIN_PASSWORD`-এ শক্তিশালী অন্তত ১২ অক্ষরের password বসাও। Real credentials কখনো GitHub-এ দেবে না।
6. প্রথমবার sample data ও admin তৈরির জন্য চালাও:

   ```bash
   npm run seed
   ```

7. Website চালাতে:

   ```bash
   npm run dev
   ```

8. Browser-এ `http://localhost:3000` খুলে `.env.local`-এ সেট করা admin email/password দিয়ে login করো।

## ৩. Database

MongoDB Atlas → Database → Connect → Drivers থেকে URI নাও। Atlas Network Access-এ development-এর জন্য নিজের current IP allow করো; production-এ unrestricted `0.0.0.0/0` access এড়িয়ে চলা ভালো। Book issue/return/payment-এর multiple-document transaction-এর জন্য Atlas বা transaction-enabled replica set দরকার।

## ৪. Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

এই চারটি command চালিয়ে local result যাচাই করো। এই bundle তৈরির পরিবেশে npm registry DNS resolution ব্যর্থ হওয়ায় dependencies install করে full build চালানো সম্ভব হয়নি; তাই successful production build দাবি করা হচ্ছে না।

## ৫. দরকারি route

- `/login` — Login
- `/register` — Member registration
- `/admin/dashboard` — Admin/Librarian workspace
- `/admin/books` — Book catalog management
- `/admin/members` — Member management
- `/admin/borrowings` — Issue/renew workflow
- `/admin/returns` — Return workflow
- `/admin/reservations` — Reservation management
- `/admin/fines` — Overdue and assessed fines
- `/admin/payments` — Payment entry
- `/admin/reports` — Reports and CSV export
- `/admin/settings` — Admin-only library settings
- `/admin/users` — Admin-only user role/status management
- `/admin/audit-logs` — Admin-only audit trail
- `/member/catalog` — Member catalog
- `/member/books/[id]` — Book details
- `/member/my-books` — Member borrowing history
- `/member/my-reservations` — Member reservation list
- `/member/my-fines` — Member fines and payments
- `/member/profile` — Member profile

## Limitation note

No Atlas credentials were provided to this environment, and the project was not connected to a real library database here. Google/GitHub OAuth, scheduled email, remote image storage, password-reset emails and real payment processing are not configured in this credentials-based baseline. Test all workflows with a separate development database before any production use.
