# Gelanggang Juara

# MASTER PROJECT PROMPT — SPORTS TOURNAMENT MANAGEMENT SAAS

## ROLE

Act as a principal software architect, senior product manager, senior full-stack engineer, UI/UX designer, database architect, security engineer, and QA engineer.

Help me build a production-oriented, modular, multi-tenant SaaS platform for managing sports tournaments in Indonesia.

The product is inspired by the general capabilities of floevent.id, but must have its own brand identity, original UI, original copywriting, and maintainable architecture. Do not copy proprietary code, assets, or branding.

## PRODUCT VISION

Build one integrated platform that enables sports organizers to create tournaments, accept registrations, generate schedules, manage matches, publish standings, sell tickets, validate QR codes, manage payments, and issue certificates.

Target users:
1. Sports tournament organizers and event organizers.
2. Schools, universities, clubs, and sports communities.
3. Tournament administrators and match operators.
4. Teams, athletes, and individual participants.
5. Spectators and ticket buyers.
6. Platform super administrators.

Primary market: Indonesia.

Default language: Bahasa Indonesia.
Currency: IDR (Indonesian Rupiah).
Timezone: Asia/Jakarta, with timezone configuration per event when needed.

## CORE PRODUCT MODULES

1. Marketing website and public event discovery.
2. Authentication and user profiles.
3. Organizations and multi-tenant access control.
4. Organizer dashboard.
5. Tournament and category management.
6. Registration forms and participant management.
7. Competition formats and automatic scheduling.
8. Match operations and verified results.
9. Standings, statistics, and tournament brackets.
10. Public tournament pages.
11. Digital tickets, QR validation, and check-in.
12. Payments and transaction management.
13. Certificates and achievement records.
14. Sponsors, galleries, and event content.
15. Reports, exports, and analytics.
16. Subscription or per-event monetization.
17. Platform administration, audit logs, and system settings.

## TECHNICAL ARCHITECTURE

Use the following stack unless a compatibility issue requires an alternative:

- Frontend: React, TypeScript, Vite.
- UI: Tailwind CSS and shadcn/ui.
- Icons: Lucide.
- Backend: Supabase.
- Database: PostgreSQL.
- Authentication: Supabase Auth.
- File storage: Supabase Storage.
- Server-side business logic: Supabase Edge Functions or appropriate secure backend functions.
- Form validation: Zod and React Hook Form where appropriate.
- Data fetching: TanStack Query where appropriate.
- Routing: React Router.
- Testing: appropriate unit, integration, and end-to-end testing tools.

Use reusable components, typed data models, modular service layers, and clear separation between UI, business logic, and data access.

Do not introduce unnecessary libraries or duplicate dependencies.

## MULTI-TENANT SECURITY

The platform must isolate every organization's data.

Requirements:
- Users can belong to one or more organizations.
- Organization membership determines access permissions.
- Support owner, organization admin, event manager, match operator, finance staff, and read-only roles.
- Enforce authorization on the server and in PostgreSQL Row Level Security (RLS).
- Never rely on hidden buttons or frontend checks as the sole security mechanism.
- Validate organization ownership for every sensitive operation.
- Protect private documents and uploads.
- Never expose service-role keys, secret API keys, or payment secrets in browser code.
- Use audit logs for sensitive actions.
- Validate payment webhooks and prevent duplicate processing.
- Use secure, single-use ticket QR tokens.
- Apply rate limiting and server-side input validation where appropriate.

## DESIGN SYSTEM

Create a polished, premium, modern SaaS experience.

Visual direction:
- Professional sports technology.
- Clean layouts with generous whitespace.
- Dark navy text, off-white backgrounds, and restrained emerald-green accents.
- Clear hierarchy and high information density for operational dashboards.
- Rounded cards, subtle borders, restrained shadows, and consistent spacing.
- Excellent typography and readable tables.
- Desktop-first organizer dashboard that remains fully responsive.
- Mobile-friendly public event pages, registration forms, and ticket scanning.

Avoid generic template aesthetics, excessive gradients, excessive glassmorphism, unnecessary animations, and oversized empty dashboard cards.

All user-facing text must be in natural Bahasa Indonesia.

Provide loading, empty, error, success, and disabled states for every important workflow.

Use accessible labels, keyboard navigation, visible focus states, and sufficient contrast.

## DATA MODEL PRINCIPLES

Design the database incrementally around entities such as:

- profiles
- organizations
- organization_members
- sports
- events
- event_categories
- registration_forms
- registrations
- teams
- team_members
- competition_groups
- matches
- match_results
- standings
- tickets
- payments
- certificates
- sponsors
- audit_logs

Do not create every table immediately without understanding the relationships.

Define primary keys, foreign keys, unique constraints, indexes, timestamps, and ownership relationships.

Use appropriate status enums or constrained values.

Avoid storing redundant derived data unless there is a clear performance reason.

Keep financial records auditable and match-result changes traceable.

## PRODUCT RULES

- An organizer can manage only authorized organizations and events.
- Public event pages expose only intentionally public information.
- Registration status, payment status, ticket status, and match status are separate concepts.
- Confirmed match results drive standings and tournament progression.
- Match results must not affect official standings until the configured verification process is complete.
- Recalculations must be deterministic and safe to repeat.
- Ticket validation must be atomic to prevent concurrent reuse.
- Payment status must be verified through trusted server-side payment confirmation.
- External integrations must be replaceable without rewriting unrelated modules.
- Every module must integrate with the same shared design system and data model.

## DEVELOPMENT RULES

Work in small, testable increments.

Before implementing a module:
1. Explain its scope and dependencies.
2. Identify the existing files and components that must be reused.
3. Describe database changes and security implications.
4. Define acceptance criteria.
5. Identify potential regressions.

After implementing a module:
1. Run the available checks and tests.
2. Verify the main user journey.
3. Check responsive behavior.
4. Report what works and what remains incomplete.
5. Document any new tables, functions, dependencies, or environment variables.

Never silently remove existing features or rewrite unrelated modules.

Do not create fake authentication, fake payment confirmation, fake QR validation, or pretend backend functionality.

Use clearly labeled demo data only when needed for design previews.

Do not claim a feature is production-ready until its backend, security, error handling, and tests have been verified.

## INITIAL TASK

Do not build the entire platform yet.

First, analyze this project brief and return:

1. Your understanding of the product.
2. Recommended architecture.
3. Core user journeys.
4. Module dependency map.
5. Proposed database relationships.
6. Security and multi-tenant strategy.
7. MVP scope versus later releases.
8. A phased implementation plan.
9. Risks and technical decisions requiring clarification.
10. Acceptance criteria for the first module.

Do not write implementation code in this initial step.

Ask only essential clarification questions. If a decision is not critical, recommend a sensible default and document the assumption.

Wait for approval before beginning implementation.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ece50dbf-22e8-4c0f-924f-f633fa74199a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
