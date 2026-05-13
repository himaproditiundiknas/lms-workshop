# CLAUDE.md

This file provides guidance to Claude Code or any AI coding assistant working on this repository.

Project repository:

```text
himaproditiundiknas/lms-workshop
```

Project name:

```text
Workshop Learning Hub
```

---

## 1. Project Overview

Workshop Learning Hub is a web-based mini LMS and workshop operations platform for the web programming workshop organized by:

```text
Himpunan Mahasiswa Program Studi Teknologi Informasi Undiknas Denpasar
```

The application supports:

- Google Login
- Participant self-registration
- Invitation code redemption
- Admin approval for participant enrollment
- Workshop, cohort/batch, and session management
- Offline QR attendance
- QR code regeneration every 5 seconds
- Learning materials
- Assignments
- Participant submissions
- Grading and feedback
- Final project groups
- Certificate eligibility
- CSV reports
- Audit logs

The system is single-organization and is expected to serve around 20-30 participants per year.

---

## 2. Primary Goal

Build a stable MVP that can support the real workshop flow:

```text
Google Login
→ Complete Profile
→ Redeem Invitation Code
→ Pending Enrollment
→ Admin Approval
→ Workshop Dashboard
→ Materials
→ Assignments
→ QR Attendance
→ Submission
→ Grading
→ Project Group
→ Certificate Eligibility
→ Reports
```

The project should prioritize correctness, maintainability, and clarity over unnecessary complexity.

---

## 3. Tech Stack

Use this stack unless explicitly changed by the maintainer:

```text
Framework       : Next.js App Router
Language        : TypeScript
Styling         : Tailwind CSS
UI Components   : shadcn/ui
Component base  : Radix
Preset          : Nova
Base color      : Slate or Zinc
Icons           : Lucide
Database        : PostgreSQL via Supabase
Auth            : Supabase Auth with Google OAuth
ORM             : Prisma ORM
Storage         : Supabase Storage
Validation      : Zod
Forms           : React Hook Form
Tables          : TanStack Table
Client fetching : TanStack Query or native fetch where appropriate
Testing         : Vitest and Playwright
Deployment      : Vercel + Supabase
```

Avoid introducing new major libraries unless there is a clear reason.

---

## 4. Important Product Decisions

### Authentication

- Google Login is the main authentication method.
- Do not implement email/password auth unless explicitly requested.
- A user must complete their profile before redeeming an invitation code.

Required participant profile fields:

```text
full_name
email from Google
nim
study_program
semester
whatsapp_number
```

### Invitation Codes

- Only `super_admin` can create invitation codes.
- Invitation codes can target:
  - a workshop
  - a specific cohort/batch
- Plain invitation codes must not be stored in the database.
- Store only hashed invitation codes.
- Plain code should only be shown once after creation.
- Redeeming a valid code creates an enrollment with status `pending`.

### Enrollment

- Participants are not automatically accepted after redeeming a code.
- `super_admin` and `admin_program` can approve or reject pending enrollments.
- If the invitation code targets a workshop, admin must choose a cohort during approval.
- If the invitation code targets a cohort, the cohort is already determined.
- Pending participants cannot access materials, assignments, attendance, or dashboard.

### Attendance

- Attendance is only for offline sessions.
- All sessions must have attendance.
- Mentor/admin manually opens and closes attendance.
- QR code regenerates every 5 seconds.
- No location validation.
- No late attendance status.
- Attendance statuses:

```text
present
absent
excused
corrected
```

- A participant can only have one attendance record per session.
- QR token and invitation code must be stored as hashes.
- Do not trust data from the QR payload except the token.
- Validate everything on the backend.

### Assignments and Submissions

Supported submission fields:

```text
repository_url
deployment_url
content_text
PDF file max 5 MB
```

Submission file rule:

```text
PDF only
Max size 5 MB
```

Resubmission rule:

- Participants cannot resubmit by themselves.
- Mentor/admin must reopen a submission.
- Do not hard-delete old submissions.
- Old submissions should be marked as `reopened` or `superseded`.
- Keep submission history for audit and grading.

Submission statuses:

```text
submitted
late
reviewed
reopened
superseded
```

### Final Project

- Final project is a special assignment with category `final_project`.
- Final project is done in groups.
- Groups are created manually by admin or mentor.
- Every group member must submit the same project link from their own account.
- System should link final project submissions to the participant's group.

### Certificate Eligibility

A participant is eligible for certificate if all conditions are met:

```text
Attendance count >= 3
All required assignments submitted
Final project submitted
Final project score >= 70
```

The system should show reasons when a participant is not eligible.

---

## 5. User Roles

Use these role names consistently:

```text
super_admin
admin_program
mentor
participant
```

### Permissions Summary

`super_admin`:

- Full access
- Can create invitation codes
- Can manage users and roles
- Can view audit logs

`admin_program`:

- Can manage workshop operations
- Can approve/reject participants
- Can manage workshops, cohorts, sessions, reports
- Can view participant data
- Can edit participant profile if needed

`mentor`:

- Can manage materials
- Can create assignments
- Can open/close attendance
- Can review submissions
- Can grade submissions
- Can create/manage project groups
- Can view participant data
- Must not edit participant profiles

`participant`:

- Can complete profile
- Can redeem invitation code
- Can access approved workshop
- Can scan QR attendance
- Can view materials
- Can submit assignments
- Can view grades and feedback
- Can view certificate eligibility

---

## 6. GitHub Workflow

Use GitHub Issues as the source of truth.

Recommended workflow:

```text
Issue → Branch → Commit → Pull Request → Review → Merge
```

Even when working alone, prefer using PRs to keep project history clean.

### Branch Naming

Use this format:

```text
feature/<issue-number>-short-title
fix/<issue-number>-short-title
docs/<issue-number>-short-title
refactor/<issue-number>-short-title
test/<issue-number>-short-title
```

Examples:

```text
feature/6-google-login
feature/17-qr-display
feature/24-submission-flow
fix/18-qr-scanner-camera-permission
```

### Commit Style

Use concise commits:

```text
feat(auth): implement google login
feat(attendance): add qr scan endpoint
fix(submission): prevent duplicate latest submission
docs(readme): add local setup guide
```

### Pull Request Template

Every PR should include:

```md
## Summary

## Related Issue

Closes #

## Changes

- [ ]

## Test Plan

- [ ] Tested locally
- [ ] Checked responsive layout if UI changed
- [ ] Checked permission/role rules if access-related

## Screenshots

Add screenshots for UI changes.
```

---

## 7. Milestones

The MVP roadmap uses 4 milestones:

```text
Week 1 - Foundation
Week 2 - Attendance MVP
Week 3 - LMS Core
Week 4 - Project, Certificate, Reports
```

### Week 1 - Foundation

Focus:

- Project setup
- shadcn/ui setup
- Supabase setup
- Prisma setup
- Auth
- Profile
- Invitation code
- Enrollment approval

### Week 2 - Attendance MVP

Focus:

- Workshop management
- Cohort management
- Session management
- QR attendance
- QR scanner
- Manual correction

### Week 3 - LMS Core

Focus:

- Modules
- Materials
- Assignments
- Submissions
- Reopen submission
- Grading and feedback

### Week 4 - Project, Certificate, Reports

Focus:

- Project groups
- Final project
- Certificate eligibility
- Participant dashboard
- Mentor/admin dashboard
- CSV reports
- Audit log

---

## 8. Project Structure Recommendation

Use a modular feature-based structure.

```text
src/
  app/
    (auth)/
      login/
      complete-profile/
    (participant)/
      dashboard/
      materials/
      assignments/
      attendance/
      certificate/
    (mentor)/
      mentor/
        dashboard/
        sessions/
        materials/
        assignments/
        submissions/
        groups/
    (admin)/
      admin/
        dashboard/
        workshops/
        cohorts/
        enrollments/
        sessions/
        reports/
    (super-admin)/
      super-admin/
        invitation-codes/
        users/
        audit-logs/
    api/
      auth/
      invitation-codes/
      enrollments/
      sessions/
      attendance/
      modules/
      materials/
      assignments/
      submissions/
      project-groups/
      grades/
      reports/
      files/

  components/
    ui/
    layout/
    forms/
    tables/
    qr/
    dashboards/

  features/
    auth/
    profiles/
    workshops/
    cohorts/
    invitations/
    enrollments/
    sessions/
    attendance/
    materials/
    assignments/
    submissions/
    groups/
    grading/
    certificates/
    reports/
    audit/

  lib/
    db/
    supabase/
    auth/
    permissions/
    validators/
    audit/
    files/
    qr/
    csv/

  types/
  constants/
```

Do not place all business logic directly inside route handlers or page components.

---

## 9. Coding Rules

### TypeScript

- Use TypeScript strictly.
- Avoid `any` unless there is no reasonable alternative.
- Prefer explicit types for API responses and service function returns.
- Keep shared types in `src/types` or inside each feature folder.

### Validation

- Use Zod for request and form validation.
- Never trust client-side validation only.
- Always validate on the server.

### Database

- Use Prisma for schema and database access.
- Use transactions for flows that create multiple related records, such as:
  - redeem invitation code
  - approve enrollment
  - submit assignment with file
  - reopen submission
  - scan QR attendance
- Avoid hard delete for important records.
- Prefer status fields and soft delete where appropriate.

### UI

- Use shadcn/ui components where possible.
- Use Tailwind CSS for layout and styling.
- Use responsive design.
- Participant pages must be mobile-first.
- Admin/mentor pages should be desktop-friendly.
- Use status badges for all important states.

### Error Handling

Return clear errors for expected business cases:

```text
PROFILE_INCOMPLETE
INVALID_INVITATION_CODE
INVITATION_CODE_EXPIRED
INVITATION_CODE_REVOKED
INVITATION_CODE_QUOTA_FULL
ENROLLMENT_ALREADY_EXISTS
ENROLLMENT_NOT_APPROVED
ATTENDANCE_NOT_OPEN
QR_TOKEN_INVALID
QR_TOKEN_EXPIRED
ATTENDANCE_ALREADY_RECORDED
ASSIGNMENT_NOT_PUBLISHED
RESUBMISSION_NOT_ALLOWED
INVALID_FILE_TYPE
FILE_TOO_LARGE
FORBIDDEN
```

### Security

- Do not expose service role keys to the client.
- Never store plain QR token.
- Never store plain invitation code.
- Check authorization on every server action or route handler.
- Mentor must not be able to edit participant profiles.
- Participant must not access resources unless enrollment is approved.
- Audit important actions.

---

## 10. Required Environment Variables

Example only. Do not commit real values.

```text
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_ENV=development

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

DATABASE_URL=
DIRECT_URL=

AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

SUPABASE_STORAGE_BUCKET_MATERIALS=materials
SUPABASE_STORAGE_BUCKET_SUBMISSIONS=submissions

QR_TOKEN_SECRET=
INVITATION_CODE_SECRET=
```

Rules:

- Never commit `.env.local`.
- Only variables prefixed with `NEXT_PUBLIC_` may be exposed to the browser.
- `SUPABASE_SERVICE_ROLE_KEY` must only be used server-side.

---

## 11. Core API Endpoints

Follow the API contract unless changed by the maintainer.

Important endpoints:

```text
POST   /api/auth/google
GET    /api/auth/me
POST   /api/auth/logout

PUT    /api/profile/me

POST   /api/invitation-codes
GET    /api/invitation-codes
PATCH  /api/invitation-codes/:id/revoke
POST   /api/invitation-codes/redeem

GET    /api/enrollments/pending
PATCH  /api/enrollments/:id/approve
PATCH  /api/enrollments/:id/reject
GET    /api/me/enrollments

POST   /api/workshops
GET    /api/workshops
PATCH  /api/workshops/:id

POST   /api/workshops/:id/cohorts
GET    /api/workshops/:id/cohorts

POST   /api/workshops/:id/sessions
GET    /api/sessions
GET    /api/sessions/:id
PATCH  /api/sessions/:id

POST   /api/sessions/:id/attendance/open
GET    /api/sessions/:id/attendance/qr/current
POST   /api/attendance/scan
POST   /api/sessions/:id/attendance/close
GET    /api/sessions/:id/attendances
PATCH  /api/attendances/:id/correct

POST   /api/workshops/:id/modules
GET    /api/workshops/:id/modules
POST   /api/modules/:id/materials
PATCH  /api/materials/:id/publish

POST   /api/assignments
GET    /api/assignments
GET    /api/assignments/:id
PATCH  /api/assignments/:id/publish
POST   /api/assignments/:id/submissions
GET    /api/assignments/:id/submissions

GET    /api/submissions/:id
PATCH  /api/submissions/:id/reopen
POST   /api/submissions/:id/grade

POST   /api/project-groups
POST   /api/project-groups/:id/members
GET    /api/project-groups
GET    /api/me/project-group

POST   /api/workshops/:id/certificate-eligibility/calculate
GET    /api/workshops/:id/certificate-eligibility

GET    /api/reports/participants/export
GET    /api/reports/attendance/summary/export
GET    /api/reports/submissions/export
GET    /api/reports/grades/export
GET    /api/reports/certificate-eligibility/export

GET    /api/audit-logs
```

---

## 12. Database Models

The database should support these main entities:

```text
users
user_profiles
roles
user_roles
workshops
cohorts
staff_assignments
invitation_codes
invitation_redemptions
enrollments
sessions
qr_tokens
attendances
modules
materials
material_progress
assignments
submissions
submission_files
grades
project_groups
project_group_members
files
announcements
certificate_eligibility_snapshots
audit_logs
```

When implementing Prisma schema, follow the Database Schema Final v1 document.

---

## 13. QR Attendance Implementation Notes

QR attendance is a sensitive feature. Keep the logic simple and secure.

Recommended flow:

```text
Mentor opens attendance
→ session attendance_status becomes open
→ server creates QR token valid for around 5 seconds
→ mentor display polls current QR every 5 seconds
→ participant scans QR
→ backend hashes token and validates it
→ backend checks enrollment approved
→ backend checks session attendance_status is open
→ backend checks no duplicate attendance exists
→ backend creates attendance present
```

Backend validation is mandatory.

Do not rely on frontend-only validation.

Potential tolerance:

- If needed, backend may allow a very small grace period to reduce false QR expiry, but keep the displayed behavior as 5 seconds.

---

## 14. Audit Log Requirements

Important actions must write audit logs:

```text
auth.google_login
profile.updated
invitation_code.created
invitation_code.revoked
invitation_code.redeemed
enrollment.approved
enrollment.rejected
workshop.created
cohort.created
session.created
attendance.opened
attendance.qr_scanned
attendance.closed
attendance.corrected
module.created
material.created
material.published
assignment.created
assignment.published
submission.created
submission.reopened
submission.superseded
grade.created
grade.updated
project_group.created
project_group.member_added
certificate_eligibility.calculated
report.exported
```

Audit log should include:

```text
actor_id
action
entity_type
entity_id
metadata
created_at
```

---

## 15. Testing Guidance

Use Vitest for logic tests.

Prioritize tests for:

```text
permission helpers
invitation code validation
enrollment approval
QR token validation
duplicate attendance prevention
submission late detection
reopen submission flow
certificate eligibility calculation
```

Use Playwright for end-to-end flow tests.

Important E2E flows:

```text
participant login → complete profile → redeem code
admin approve participant
mentor open attendance → participant scan QR
mentor create assignment → participant submit → mentor grade
admin calculate certificate eligibility
```

---

## 16. What Not To Do

Avoid overengineering the MVP.

Do not add these unless explicitly requested:

```text
microservices
GraphQL
WebSocket for QR
Redis queue
Kubernetes
native mobile app
payment gateway
internal chat
AI grader
Elasticsearch
complex gamification
```

Polling every 5 seconds is enough for QR attendance at the current scale.

Synchronous CSV export is enough for the current scale.

---

## 17. Local Development Commands

Use the package manager already chosen in the repository. If unsure, check the lockfile.

Common commands:

```bash
npm run dev
npm run build
npm run lint
npx prisma validate
npx prisma migrate dev
npx prisma studio
```

If the repository uses pnpm, use:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm prisma validate
pnpm prisma migrate dev
pnpm prisma studio
```

Do not mix package managers in the same repository.

---

## 18. Developer Notes for Claude

When assisting with this repo:

1. Always inspect existing files before suggesting changes.
2. Do not invent schema fields if the database schema already exists.
3. Follow existing folder conventions.
4. Keep changes small and issue-scoped.
5. Ask before introducing a new dependency.
6. Always include permission checks for server-side mutations.
7. Always validate input with Zod or equivalent.
8. Always consider participant enrollment status before allowing access.
9. Do not remove audit trail.
10. Do not hard-delete submissions, attendances, grades, or enrollments.
11. Prefer readable code over clever code.
12. Use Indonesian-facing UI copy unless the existing UI uses English.
13. Keep participant UI mobile-first.
14. Keep admin/mentor UI table-friendly.
15. After implementation, mention how to test the change.

---

## 19. Current MVP Priority

The MVP is considered successful when:

```text
Super Admin can create invitation codes
Participant can login with Google
Participant can complete profile
Participant can redeem invitation code
Admin can approve participant
Mentor/admin can create sessions
Mentor can open QR attendance
Participant can scan QR
Attendance is recorded
Mentor can publish materials
Mentor can create assignments
Participant can submit assignments
Mentor can grade submissions
Admin/mentor can create project groups
Certificate eligibility can be calculated
Reports can be exported as CSV
```

Focus on these before polishing secondary features.
