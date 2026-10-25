# Sports Tournament SaaS (Indonesia): Analysis and Phased Plan

## 1. What the product is
A multi-tenant platform where organizations (EOs, schools, clubs) run a whole tournament in one place: create the event, take registrations, build the schedule, record and verify results, publish standings and brackets, sell and scan tickets, take payments, and issue certificates. Bahasa Indonesia first, IDR, Asia/Jakarta by default. Organizers and operators work on desktop. Participants, spectators, and scanner staff mostly use phones.

## 2. Recommended architecture (with stack adjustments)
- Frontend: React 19 + TypeScript + Vite 7, Tailwind v4, shadcn/ui, Lucide, RHF + Zod, TanStack Query.
- **Routing: TanStack Router/Start, not React Router.** The template has TanStack Router built in and it can't be swapped. It covers everything React Router would, adds type-safe routes, and renders public event pages on the server, which helps SEO.
- **Backend: Lovable Cloud** (managed Postgres, Auth, Storage, RLS; Supabase under the hood).
- **Server logic: TanStack server functions (`createServerFn`), not Edge Functions.** Payment webhooks, cron jobs, and the public QR verification endpoint go in server routes under `/api/public/*`, and each handler verifies its own caller.
- Layers: `src/routes` (UI) -> `src/features/<module>` (components, hooks, query options) -> `src/server/<module>.functions.ts` (validated business logic) -> Postgres (RLS plus SQL functions for atomic operations).
- Integrations sit behind small adapter interfaces (`PaymentProvider`, `EmailSender`, `PdfRenderer`), so providers can be swapped without touching other modules.

## 3. Core user journeys
1. Organizer: sign up -> create organization -> invite staff -> create event + categories -> publish registration.
2. Participant/team: find event -> register (custom form, upload documents) -> pay -> get confirmation.
3. Organizer: review and approve registrations -> generate groups/brackets/schedule.
4. Match operator: enter score -> verifier confirms -> standings and bracket update.
5. Spectator: buy ticket -> receive QR -> scanned once at the gate.
6. Organizer: issue certificates, export reports.
7. Super admin: manage tenants, plans, audit logs.

## 4. Module dependency map
```text
Auth/Profiles
   └─ Organizations + Members/Roles + Audit log
        └─ Events + Categories (+ Sports catalog)
             ├─ Public event pages / discovery
             ├─ Registration forms ─ Registrations ─ Teams/Members
             │        └─ Payments (adapter) ─ Tickets/QR check-in
             ├─ Competition (groups, matches, schedule)
             │        └─ Results + verification ─ Standings/Brackets
             ├─ Certificates (needs registrations + results)
             ├─ Sponsors / Gallery
             └─ Reports/Exports ─ Subscriptions/Billing ─ Platform admin
```

## 5. Proposed database relationships (built step by step)
- `profiles` 1:1 `auth.users`.
- `organizations` 1:N `organization_members` (user_id, role enum: owner, org_admin, event_manager, match_operator, finance, viewer). Unique on (org, user).
- `platform_roles` kept separate for super admins (never stored on profiles).
- `events` N:1 org; status: draft/published/ongoing/finished/archived; timezone; slug unique.
- `event_categories` N:1 event (sport, gender, age group, format, quota, fee_idr).
- `registration_forms` 1:1 category (JSON schema of fields). `registrations` N:1 category, linked to a team or an individual; status: pending/approved/rejected/withdrawn.
- `teams` 1:N `team_members`.
- `competition_groups` N:1 category; `matches` N:1 category/group (home/away, round, bracket slot, scheduled_at, venue, status).
- `match_results` append-only versions per match (submitted_by, verified_by, state). Only the verified version counts.
- `standings` is a derived table, rebuilt by a deterministic SQL function from verified results.
- `payments` N:1 org, polymorphic payable (registration/ticket order); amount_idr bigint; provider ref unique; `payment_events` stores raw webhooks, keyed by idempotency key.
- `ticket_types` -> `ticket_orders` -> `tickets` (hashed single-use token, status, checked_in_at/by).
- `certificates` N:1 registration/team_member; `sponsors` N:1 event; `audit_logs` (org_id, actor, action, entity, diff, at).
- Every table has `id uuid`, `created_at`, `updated_at`, and indexes on FKs and `org_id`.

## 6. Security and multi-tenancy
- Every tenant table carries `organization_id` (denormalized on purpose so RLS stays simple).
- Security-definer helpers `is_org_member(org)` and `has_org_role(org, roles[])` are used in all RLS policies.
- Public reads only through `published` events, via narrow anon SELECT policies or public views.
- Mutations go through server functions that check auth, validate with Zod, and write to the audit log.
- Atomic SQL functions: `check_in_ticket(token)` (UPDATE ... WHERE status='valid' RETURNING), `verify_match_result`, `recalculate_standings(category)`.
- Webhooks: verify signature, upsert on provider event id, and only the server may mark something paid.
- Storage: private buckets per org, signed URLs, path prefix `org_id/`.
- Secrets live only in server env. Rate limiting on public endpoints such as registration, ticket lookup, and scanning.

## 7. MVP vs later
**MVP:** auth, organizations and roles, events/categories, public event pages, registration forms + approval, manual-plus-gateway payment for registration, round-robin and single-elimination scheduling, result entry + verification, standings/bracket, audit log.
**Release 2:** ticketing + QR check-in, certificates (PDF), sponsors/gallery, exports.
**Release 3:** subscriptions/per-event fees, analytics, super-admin console, double elimination/Swiss, WhatsApp notifications.

## 8. Phased implementation
1. Foundation: design system, app shell, Indonesian copy, Lovable Cloud, auth, profiles.
2. Organizations, members, invitations, roles, RLS, audit log.
3. Events and categories (organizer dashboard) + public event page.
4. Registration forms, registrations, teams, document uploads.
5. Payments adapter + one Indonesian gateway + webhooks.
6. Competition formats + schedule generator (unit-tested pure functions).
7. Match operations, verification, standings, brackets.
8. Tickets + QR scanner (mobile).
9. Certificates, sponsors, gallery, exports.
10. Monetization, analytics, platform admin.

## 9. Risks and decisions
- **Payment gateway** (Midtrans or Xendit) needs merchant credentials. Default: build the adapter in Phase 5 using Xendit or Midtrans sandbox.
- **Result verification flow.** Default: operator submits, then an event manager or org admin confirms. Configurable per event later.
- **Standings tiebreakers** differ by sport. Default: points -> head-to-head -> goal/point difference -> scored, configured per category.
- **Sports scope** for MVP. Default: team sports with score-based results (football/futsal, basketball, volleyball, badminton).
- **Monetization model.** Default: decided in Phase 10; data model leaves room for it now.
- **Email sending** needs a sender domain for invitations and confirmations. Default: Lovable's built-in email.
- **Brand name** is needed. Placeholder: "Arena".

## 10. Acceptance criteria: Module 1 (Foundation + Auth)
- Design tokens (navy/off-white/emerald), typography, and base components are defined in one place. No hardcoded colors.
- Marketing home page in Bahasa Indonesia, responsive, with its own SEO metadata.
- Email/password sign-up, sign-in, sign-out, and password reset work against Lovable Cloud (no fake auth).
- A `profiles` row is created automatically on sign-up. Users can edit their name, phone, and avatar (private storage).
- Dashboard routes are protected. Signed-out visitors are redirected to sign-in with a return URL.
- RLS: a user can read and update only their own profile (verified with a test).
- Every form shows loading, error, success, and disabled states. Labels are accessible and focus is visible.
- The build passes, routing tests pass, and the main journey is checked in the browser on desktop and mobile.
