# Learning Management System Workshop HIMA TI

**IEEE-Style Software Project Documentation**  
**Repository:** `himaproditiundiknas/lms-workshop`  
**Application:** `workshop-himati`  
**Version:** 1.0  
**Last Updated:** 2026-06-17  

---

## Abstract

Learning Management System Workshop HIMA TI adalah aplikasi web untuk mengelola workshop, peserta, mentor, presensi QR, materi, assignment, submission, final project, grading, eligibility sertifikat, export laporan CSV, dashboard operasional, dan audit log. Sistem dibangun dengan Next.js, React, TypeScript, Prisma ORM, PostgreSQL/Supabase, Supabase Auth, dan Tailwind CSS.

README ini disusun dengan format dokumentasi IEEE-style agar developer baru dapat melakukan setup, menjalankan aplikasi, memahami modul, melakukan validasi, dan melakukan maintenance project secara konsisten.

---

## Keywords

`Next.js`, `React`, `TypeScript`, `Prisma`, `PostgreSQL`, `Supabase`, `Supabase Auth`, `Tailwind CSS`, `QR Attendance`, `Assignment`, `Submission`, `Certificate Eligibility`, `Audit Log`, `CSV Export`

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Scope](#2-system-scope)
3. [Technology Stack](#3-technology-stack)
4. [Repository Structure](#4-repository-structure)
5. [Prerequisites](#5-prerequisites)
6. [Package Dependencies](#6-package-dependencies)
7. [Environment Configuration](#7-environment-configuration)
8. [Supabase Configuration](#8-supabase-configuration)
9. [Installation and Setup](#9-installation-and-setup)
10. [Database Migration and Seed](#10-database-migration-and-seed)
11. [Development Authentication](#11-development-authentication)
12. [Available Scripts](#12-available-scripts)
13. [Application Modules](#13-application-modules)
14. [Roles and Access Control](#14-roles-and-access-control)
15. [Main Routes](#15-main-routes)
16. [Database Overview](#16-database-overview)
17. [Audit Logging](#17-audit-logging)
18. [Reports CSV](#18-reports-csv)
19. [Testing and Validation](#19-testing-and-validation)
20. [Deployment Guide](#20-deployment-guide)
21. [Troubleshooting](#21-troubleshooting)
22. [Maintenance Guide](#22-maintenance-guide)
23. [Contribution Workflow](#23-contribution-workflow)
24. [Security Notes](#24-security-notes)
25. [References](#25-references)

---

## 1. Introduction

### 1.1 Purpose

Dokumen ini adalah panduan utama untuk menjalankan dan memelihara project `lms-workshop`. Tujuannya:

- Membantu developer baru melakukan clone dan setup project.
- Menjelaskan dependency yang harus diinstall.
- Menjelaskan konfigurasi Supabase, Prisma, dan environment variable.
- Menjelaskan modul, route, role, dan database utama.
- Menjelaskan standard validasi sebelum pull request.
- Menjadi referensi maintenance jangka panjang.

### 1.2 Intended Audience

Dokumen ini ditujukan untuk:

- Developer internal HIMA TI.
- Maintainer project LMS Workshop.
- Reviewer pull request.
- Developer baru yang melanjutkan pengembangan aplikasi.
- Admin teknis yang ingin menjalankan aplikasi lokal.

### 1.3 Project Summary

Aplikasi ini menangani flow utama berikut:

- Login Google dan email/password.
- Profile completion.
- Role-based access.
- Invitation code.
- Enrollment approval.
- Workshop, cohort, dan session management.
- QR attendance.
- Attendance correction.
- Modules and materials.
- Assignments and submissions.
- Reopen submission.
- Grading and feedback.
- Project group.
- Final project submission per anggota group.
- Certificate eligibility.
- Reports CSV.
- Participant, mentor, dan admin dashboard.
- Audit logging.

---

## 2. System Scope

### 2.1 In Scope

Fitur yang masuk scope versi saat ini:

1. Authentication dan authorization.
2. User profile dan role management.
3. Invitation code redeem flow.
4. Enrollment approval flow.
5. Workshop, cohort, dan session management.
6. QR attendance generation dan scanning.
7. Attendance correction.
8. Learning materials management.
9. Assignment management.
10. Participant submission flow.
11. Reopen submission flow.
12. Grading and feedback.
13. Project group management.
14. Final project submission rules.
15. Certificate eligibility calculation.
16. Reports export CSV.
17. Participant dashboard.
18. Mentor dashboard.
19. Admin dashboard.
20. Audit logging untuk aksi penting.

### 2.2 Out of Scope Saat Ini

Fitur yang belum menjadi fokus versi ini:

- Production-ready public registration.
- Password reset.
- Account linking Google OAuth dan email/password.
- Upload file asli ke Supabase Storage.
- Notification system.
- Email notification.
- Certificate PDF generation.
- Advanced analytics.
- Multi-tenant organization management.
- Automated test coverage lengkap.

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js App Router |
| UI | React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js Server Actions and Route Handlers |
| Authentication | Supabase Auth |
| Database | PostgreSQL |
| Database Provider | Supabase |
| ORM | Prisma ORM |
| Prisma Adapter | `@prisma/adapter-pg` |
| Validation | Zod |
| QR Generation | `qrcode`, `qrcode.react` |
| QR Scanning | `html5-qrcode` |
| Tables | TanStack Table |
| Forms | React Hook Form |
| Icons | Lucide React |
| Toast | Sonner |
| Testing | Vitest, Playwright |
| Package Manager | npm |

---

## 4. Repository Structure

```text
lms-workshop/
├── prisma/
│   ├── migrations/
│   ├── seed.ts
│   └── seed-dev-auth.ts
├── public/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   ├── assignments/
│   │   ├── attendance/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── materials/
│   │   └── mentor/
│   ├── components/
│   ├── generated/prisma/
│   └── lib/
│       ├── attendance/
│       ├── audit/
│       ├── auth/
│       ├── certificate/
│       ├── invitation/
│       ├── project-group/
│       ├── report/
│       ├── submission/
│       ├── supabase/
│       └── prisma.ts
├── .env.example
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── prisma.config.ts
├── README.md
└── tsconfig.json
```

| Directory | Description |
|---|---|
| `src/app` | Next.js routes, pages, server actions, route handlers. |
| `src/components` | Shared UI components. |
| `src/lib` | Business logic, helpers, validators, Prisma and Supabase clients. |
| `src/generated/prisma` | Generated Prisma client output. |
| `prisma/migrations` | Database migration history. |
| `prisma/seed.ts` | Main database seed. |
| `prisma/seed-dev-auth.ts` | Development Supabase Auth seed. |

---

## 5. Prerequisites

Install software berikut:

| Requirement | Recommended |
|---|---|
| Node.js | 20 LTS or newer |
| npm | Bundled with Node.js |
| Git | Latest stable |
| Supabase Account | Required |
| PostgreSQL | Supabase PostgreSQL or local PostgreSQL |
| VS Code | Recommended |
| Browser | Chrome, Edge, or Firefox |

Recommended VS Code extensions:

- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- Error Lens
- GitHub Pull Requests

---

## 6. Package Dependencies

Install semua dependency dengan:

```bash
npm install
```

### 6.1 Runtime Dependencies

| Package | Purpose |
|---|---|
| `next` | Framework utama. |
| `react`, `react-dom` | UI rendering. |
| `@prisma/client`, `prisma`, `@prisma/adapter-pg`, `pg` | ORM, migration, PostgreSQL adapter/client. |
| `@supabase/supabase-js`, `@supabase/ssr` | Supabase Auth and SSR client. |
| `zod` | Validation schema. |
| `react-hook-form`, `@hookform/resolvers` | Form handling and validation integration. |
| `@tanstack/react-query`, `@tanstack/react-table` | Data/query utilities and tables. |
| `qrcode`, `qrcode.react`, `html5-qrcode` | QR generation and QR scanner. |
| `lucide-react` | Icons. |
| `class-variance-authority`, `clsx`, `tailwind-merge` | UI class utilities. |
| `tailwindcss`, `tw-animate-css` | Styling and animations. |
| `radix-ui`, `shadcn` | UI primitive/tooling. |
| `next-themes` | Theme handling. |
| `sonner` | Toast notifications. |
| `dotenv` | Environment loading utility. |

### 6.2 Development Dependencies

| Package | Purpose |
|---|---|
| `typescript` | TypeScript compiler. |
| `eslint`, `eslint-config-next` | Linting. |
| `prettier` | Formatting. |
| `tsx` | Run TypeScript scripts. |
| `vitest` | Unit testing. |
| `@playwright/test` | E2E/browser testing. |
| `@types/node`, `@types/pg`, `@types/react`, `@types/react-dom` | Type definitions. |
| `@tailwindcss/postcss` | Tailwind PostCSS integration. |

### 6.3 Manual Install Command

Jika perlu install manual:

```bash
npm install next react react-dom @prisma/client @prisma/adapter-pg prisma pg @supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers @tanstack/react-query @tanstack/react-table qrcode qrcode.react html5-qrcode lucide-react class-variance-authority clsx tailwind-merge tailwindcss tw-animate-css radix-ui shadcn next-themes sonner dotenv
```

```bash
npm install -D typescript eslint eslint-config-next prettier tsx vitest @playwright/test @types/node @types/pg @types/react @types/react-dom @tailwindcss/postcss
```

---

## 7. Environment Configuration

Buat file `.env.local` di root project:

```bash
cp .env.example .env.local
```

Jika di Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

### 7.1 Required Variables

```env
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
DATABASE_URL=""
```

| Variable | Required | Description |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon public key. |
| `DATABASE_URL` | Yes | PostgreSQL connection string for Prisma. |

### 7.2 Development Auth Seed Variables

```env
SUPABASE_SERVICE_ROLE_KEY=""

SEED_SUPER_ADMIN_EMAIL="admin.dev@lms.local"
SEED_SUPER_ADMIN_PASSWORD="AdminDev12345!"

SEED_PARTICIPANT_EMAIL="participant.dev@lms.local"
SEED_PARTICIPANT_PASSWORD="ParticipantDev12345!"
```

### 7.3 Optional Seed Variables

```env
SEED_SUPER_ADMIN_NAME="Development Super Admin"
SEED_ADMIN_PROGRAM_EMAIL=""
SEED_ADMIN_PROGRAM_NAME=""
SEED_INVITATION_CODES=false
SEED_WORKSHOP_INVITATION_CODE="LMS-DEV-WORKSHOP"
SEED_COHORT_INVITATION_CODE="LMS-DEV-COHORT"
```

> Do not commit `.env.local`.

---

## 8. Supabase Configuration

### 8.1 Create Project

1. Login Supabase.
2. Create project.
3. Copy project URL.
4. Copy anon key.
5. Copy database connection string.
6. Copy service role key for local seed only.

### 8.2 Enable Email Provider

Required for email/password login.

```text
Supabase Dashboard → Authentication → Providers → Email → Enable
```

### 8.3 Enable Google Provider

Required for Google login.

```text
Supabase Dashboard → Authentication → Providers → Google → Enable
```

Tambahkan Google OAuth Client ID dan Client Secret.

### 8.4 Redirect URLs

Development:

```text
http://localhost:3000/auth/callback
http://localhost:3000/dashboard
http://localhost:3000/login
```

Production:

```text
https://your-domain.com/auth/callback
https://your-domain.com/dashboard
https://your-domain.com/login
```

---

## 9. Installation and Setup

```bash
git clone https://github.com/himaproditiundiknas/lms-workshop.git
cd lms-workshop
git checkout dev
npm install
cp .env.example .env.local
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Buka:

```text
http://localhost:3000
```

---

## 10. Database Migration and Seed

### 10.1 Apply Migration

```bash
npx prisma migrate dev
npx prisma generate
```

### 10.2 Reset Development Database

Only for local development:

```bash
npx prisma migrate reset
npx prisma generate
npx prisma db seed
```

### 10.3 Main Seed

```bash
npx prisma db seed
```

Seed utama mengisi:

- Roles.
- Default admin role.
- Workshop.
- Cohort.
- Sessions.
- Invitation codes.
- Modules and materials.
- Sample assignment data jika tersedia.

### 10.4 Development Auth Seed

Jika script tersedia:

```bash
npm run seed:dev-auth
```

Jika belum tersedia:

```bash
npx dotenvx run -f .env.local -- tsx prisma/seed-dev-auth.ts
```

Atau:

```bash
npx tsx prisma/seed-dev-auth.ts
```

### 10.5 Prisma Studio

```bash
npx prisma studio
```

---

## 11. Development Authentication

The `/login` page supports two authentication options:

- Email/password login.
- Google login.

Default seeded users:

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin.dev@lms.local` | `AdminDev12345!` |
| Participant | `participant.dev@lms.local` | `ParticipantDev12345!` |

Flow:

1. Run migration.
2. Run `npx prisma db seed`.
3. Run dev auth seed.
4. Open `/login`.
5. Login with seeded email/password.

---

## 12. Available Scripts

Core scripts:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

Recommended extra script in `package.json`:

```json
{
  "seed:dev-auth": "dotenvx run -f .env.local -- tsx prisma/seed-dev-auth.ts"
}
```

Prisma commands:

```bash
npx prisma validate
npx prisma format
npx prisma generate
npx prisma migrate dev
npx prisma migrate reset
npx prisma db seed
npx prisma studio
```

Testing commands:

```bash
npx vitest
npx playwright test
```

---

## 13. Application Modules

### 13.1 Authentication and Profile

- Google login.
- Email/password login.
- Logout.
- Complete profile.
- Session protection.

Routes:

```text
/login
/auth/callback
/logout
/complete-profile
```

### 13.2 Invitation and Enrollment

- Invitation code creation/revocation.
- Invitation redeem.
- Enrollment pending.
- Enrollment approve/reject.

Routes:

```text
/admin/invitations
/redeem-invitation
/admin/enrollments
```

### 13.3 Workshop, Cohort, Session

- Workshop management.
- Cohort management.
- Session management.
- Attendance status per session.

Routes:

```text
/admin/workshops
/admin/cohorts
/mentor/sessions
```

### 13.4 Attendance

- Open/close attendance.
- QR token generation.
- QR scanning.
- Attendance correction.
- Attendance included in certificate eligibility.

Routes:

```text
/mentor/sessions/[sessionId]/qr
/attendance/scan
```

### 13.5 Materials

- Module creation.
- Material creation.
- Published material visible to participants.

Routes:

```text
/mentor/materials
/materials
```

### 13.6 Assignments and Submissions

- Regular assignments.
- Final project assignments.
- Due date.
- Max score.
- Allow late.
- Required for certificate.
- Submission attempts.
- Resubmission.
- Submission files by URL.

Routes:

```text
/mentor/assignments
/assignments
/assignments/[assignmentId]/submit
```

### 13.7 Reopen and Grading

- Reopen latest submission with reason.
- Grade submission.
- Update grade.
- Feedback visible to participant.

Routes:

```text
/mentor/submissions
/mentor/submissions/[submissionId]
```

### 13.8 Project Groups and Final Project

- Project group management.
- Leader/member roles.
- One participant per group per cohort.
- Final project submission per member account.
- Mentor progress monitor and link consistency warning.

Routes:

```text
/mentor/project-groups
/mentor/final-projects
```

### 13.9 Certificate Eligibility

Eligibility checks:

- Attendance present/corrected count.
- Required assignments submitted.
- Final project submitted.
- Final project score minimum 70.

Route:

```text
/admin/certificates
```

### 13.10 Reports CSV

Exports:

- Participants.
- Attendance.
- Submissions.
- Grades.
- Certificate eligibility.

Route:

```text
/admin/reports
```

### 13.11 Dashboards

Routes:

```text
/dashboard
/mentor
/admin
```

---

## 14. Roles and Access Control

| Role | Description |
|---|---|
| `participant` | Can access participant dashboard, materials, assignments, submission, attendance scan. |
| `mentor` | Can manage sessions, attendance, materials, assignments, submissions, grading, project groups. |
| `admin_program` | Can manage admin workflows such as enrollments, reports, certificates. |
| `super_admin` | Full system access. |

---

## 15. Main Routes

### Public/Auth

```text
/login
/auth/callback
/logout
/complete-profile
/redeem-invitation
```

### Participant

```text
/dashboard
/materials
/assignments
/assignments/[assignmentId]/submit
/attendance/scan
```

### Mentor

```text
/mentor
/mentor/sessions
/mentor/sessions/[sessionId]/qr
/mentor/materials
/mentor/assignments
/mentor/submissions
/mentor/submissions/[submissionId]
/mentor/project-groups
/mentor/final-projects
```

### Admin

```text
/admin
/admin/enrollments
/admin/invitations
/admin/workshops
/admin/cohorts
/admin/certificates
/admin/reports
/admin/reports/export/[reportType]
```

---

## 16. Database Overview

| Table | Purpose |
|---|---|
| `users` | Application users. |
| `user_profiles` | Profile details. |
| `roles` | Role definitions. |
| `user_roles` | User-role relation. |
| `invitation_codes` | Invitation codes. |
| `enrollments` | Enrollment records. |
| `workshops` | Workshop records. |
| `cohorts` | Cohort records. |
| `sessions` | Session records. |
| `attendances` | Attendance records. |
| `qr_tokens` | QR attendance tokens. |
| `modules` | Learning modules. |
| `materials` | Learning materials. |
| `assignments` | Assignment records. |
| `submissions` | Submission records. |
| `submission_files` | Submission file metadata. |
| `project_groups` | Final project groups. |
| `project_group_members` | Group members. |
| `audit_logs` | Audit trail. |

Important rules:

- One participant can only join one project group per cohort.
- Submission attempt is per assignment and user.
- Only one latest submission per assignment and user.
- Final project submissions are linked to group through `project_group_id`, but still submitted per user.

---

## 17. Audit Logging

Important audit actions:

```text
invitation_code.created
invitation_code.revoked
invitation_code.redeemed
enrollment.approved
enrollment.rejected
attendance.opened
attendance.scanned
attendance.closed
attendance.corrected
submission.created
submission.superseded
submission.reopened
grade.created
grade.updated
report.exported
```

Audit helper:

```text
src/lib/audit/audit-log.ts
```

Pattern:

```ts
await createAuditLog({
  actorUserId: actor.id,
  action: "example.action",
  entityType: "example_entity",
  entityId: entity.id,
  metadata: toAuditMetadata({
    key: "value",
  }),
});
```

---

## 18. Reports CSV

Report page:

```text
/admin/reports
```

Export endpoints:

```text
/admin/reports/export/participants
/admin/reports/export/attendance
/admin/reports/export/submissions
/admin/reports/export/grades
/admin/reports/export/certificate-eligibility
```

Filters:

```text
?workshopId=<uuid>&cohortId=<uuid>
```

Every export writes audit log:

```text
report.exported
```

---

## 19. Testing and Validation

Run before pull request:

```bash
npx prisma validate
npx prisma generate
npm run lint
npm run build
```

Manual checklist:

- Login Google works.
- Dev email/password login works.
- Participant dashboard works.
- Mentor dashboard works.
- Admin dashboard works.
- Enrollment approval works.
- QR attendance works.
- Assignment submission works.
- Resubmission creates new attempt.
- Reopen works.
- Grade and feedback work.
- Final project group progress works.
- Certificate eligibility works.
- Reports CSV download works.
- Audit logs are written.

---

## 20. Deployment Guide

### 20.1 Build

```bash
npm run build
npm run start
```

### 20.2 Production Migration

Use production-safe migration command:

```bash
npx prisma migrate deploy
npx prisma generate
```

Do not use `migrate reset` in production.

### 20.3 Vercel Environment Variables

Set:

```env
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
DATABASE_URL=""
```

Optional server-only:

```env
SUPABASE_SERVICE_ROLE_KEY=""
```

---

## 21. Troubleshooting

### Prisma generated client missing

```bash
npx prisma generate
```

### Column does not exist

```bash
npx prisma migrate dev
npx prisma generate
```

### Migration modified after applied

Do not edit applied migration. Create a new migration. For local disposable DB:

```bash
npx prisma migrate reset
```

### Service role key missing

Add to `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=""
```

### QR scanner camera blocked

Use localhost or HTTPS deployment. Mobile browser camera usually requires secure context.

### Route handler 404

Restart dev server:

```bash
Ctrl + C
npm run dev
```

### CSV opens in one column

Import CSV manually and choose comma delimiter, or use Google Sheets.

---

## 22. Maintenance Guide

### Branch Strategy

```text
master/main    production branch
dev            integration branch
feat/*         feature branch
fix/*          bug fix branch
docs/*         documentation branch
```

### Feature Workflow

```bash
git checkout dev
git pull origin dev
git checkout -b feat/feature-name
```

Before PR:

```bash
npx prisma validate
npx prisma generate
npm run lint
npm run build
```

### Migration Rules

- Never edit applied migrations.
- Create new migration for schema changes.
- Use reset only locally.
- Use deploy in production.
- Keep Prisma schema and generated client synced.

### Audit Rules

Every important action should include:

- Actor.
- Action.
- Entity type.
- Entity ID.
- Metadata.
- Timestamp.

---

## 23. Contribution Workflow

PR template:

```markdown
## Summary
- Change 1
- Change 2

## Validation
- [x] npx prisma validate
- [x] npx prisma generate
- [x] npm run lint
- [x] npm run build

Closes #ISSUE_NUMBER
```

Commit examples:

```text
Implement participant dashboard
Fix submission grading audit log
Create project group schema
Add reports CSV export
Update README documentation
```

---

## 24. Security Notes

Never commit:

```text
.env
.env.local
DATABASE_URL
SUPABASE_SERVICE_ROLE_KEY
OAuth client secret
```

Rules:

- Do not expose service role key to browser.
- Do not use `NEXT_PUBLIC_` for secrets.
- Validate role on mentor/admin actions.
- Validate enrollment before participant content.
- Use transactions for multi-step writes.
- Keep submission history; do not hard delete historical submissions.
- Write audit logs for important actions.

---

## 25. References

- Next.js Documentation: https://nextjs.org/docs
- React Documentation: https://react.dev
- Prisma Documentation: https://www.prisma.io/docs
- Supabase Documentation: https://supabase.com/docs
- Supabase Auth Documentation: https://supabase.com/docs/guides/auth
- Tailwind CSS Documentation: https://tailwindcss.com/docs
- Zod Documentation: https://zod.dev
- TanStack Table Documentation: https://tanstack.com/table
- Playwright Documentation: https://playwright.dev
- Vitest Documentation: https://vitest.dev

---

## Appendix A. Fresh Clone Quick Start

```bash
git clone https://github.com/himaproditiundiknas/lms-workshop.git
cd lms-workshop
git checkout dev
npm install
cp .env.example .env.local
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open:

```text
http://localhost:3000
```

Development auth seed:

```bash
npm run seed:dev-auth
```

If script is not available:

```bash
npx dotenvx run -f .env.local -- tsx prisma/seed-dev-auth.ts
```

---

## Appendix B. Common Local URLs

```text
http://localhost:3000/login
http://localhost:3000/dashboard
http://localhost:3000/mentor
http://localhost:3000/admin
http://localhost:3000/admin/reports
http://localhost:3000/admin/certificates
http://localhost:3000/mentor/final-projects
http://localhost:3000/mentor/submissions?latest=latest
```

---

## Appendix C. Definition of Done

A feature is done when:

- It matches issue acceptance criteria.
- Validation schema exists for forms/actions.
- Server actions check session/role/enrollment.
- Important action writes audit log.
- UI has empty/error state where relevant.
- Mobile layout is readable.
- `npx prisma validate` passes.
- `npx prisma generate` passes.
- `npm run lint` passes.
- `npm run build` passes.
- PR is merged into `dev`.
