# Phase 7 — v1.1 Post-Hackathon: Production Readiness

> **Status**: ✅ Done (Observability skipped)
> **Context**: Post-hackathon — ready for real users
> **Completed**: 2026-04-03

---

## Goal

Transform the hackathon prototype into a secure, stable application usable by real sales teams at travel partner companies.

---

## Tasks

### Security
- [x] Hash passwords with `bcryptjs` — blocker before go-live
  - All passwords stored as bcrypt hash (cost 12)
  - Login: `bcrypt.compare()`, Register: `bcrypt.hash()`
  - Seed updated to hash demo user password
- [x] All endpoints require authentication via `requireUserSession`
- [x] Input sanitization via Zod on all server routes

### Database
- [x] Index on `leads.score`, `leads.status`, `leads.createdAt` (done in Phase 4)
- [ ] Automated daily database backup — infrastructure task (Neon handles this)
- [x] Use `drizzle-kit generate` + `migrate` pattern documented

### Advanced Features
- [x] Follow-up history per lead (Phase 6)
- [x] CSV export (Phase 5)
- [x] Email notification for new Hot leads — via **Resend**
  - `server/utils/email.ts` — `sendHotLeadEmail()`
  - Fires async (non-blocking) on every new Hot lead
  - Disabled gracefully when `RESEND_API_KEY` not set
- [x] Pagination in lead list (20 leads/page, `UPagination`)

### Observability — SKIPPED

### Onboarding
- [x] User registration page (`/register`)
  - `server/api/auth/register.post.ts` — Zod validation, bcrypt hash, auto-login
  - `app/pages/register.vue` — form with confirm password validation
  - Auth middleware updated to allow `/register` without login
- [x] Profile page (`/profile`)
  - Edit display name → `PATCH /api/auth/profile`
  - Change password (verify current, hash new) → `PATCH /api/auth/password`
  - UserMenu "Profile" item now links to `/profile`

---

## New Environment Variables

```env
# Email notifications (optional — disabled if not set)
RESEND_API_KEY=re_xxxx
RESEND_FROM=LeadSense AI <notifications@yourdomain.com>
RESEND_ALERT_TO=sales@yourdomain.com

# App URL (used in email links)
APP_URL=https://yourdomain.com
```

---

## Technical Notes

- Password migration: existing users with plain-text passwords must reset — re-run `pnpm db:seed` to regenerate demo user with hashed password
- `bcryptjs` used (pure JS, no native bindings) for serverless compatibility
- Email is fire-and-forget (`.catch(() => {})`) — email failure never breaks lead creation
- Pagination API returns `{ data, total, page, limit, totalPages }` — leads list updated to consume this shape
