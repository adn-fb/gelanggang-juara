<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Routing is TanStack Router file routes; signed-in pages live under `src/routes/_authenticated/` (client-only gate) — keeps auth checks out of components.
- Data access: browser Supabase client under RLS for own-user reads/writes; privileged or multi-step business logic goes in `createServerFn` — RLS is the real security boundary.
- Every tenant table will carry `organization_id` and use security-definer role helpers in RLS — keeps multi-tenant policies simple and uniform.
- Private files go in private buckets under a `<owner-id>/` path prefix, served via signed URLs — prevents cross-user access.
- Shared auth validation/helpers live in `src/lib/auth.ts` with unit tests beside them — one source for rules like password length and safe redirects.
- Organization mutations use one authenticated transactional SQL function; direct writes are not granted, and immutable audit rows commit with each change to prevent privilege escalation and missing audit events.
- Organization invitations are email-bound in-app invitations; app email delivery requires a verified sender domain and must not be presented as sent until delivery is wired.
- AI planner calls use the Responses SDK and streaming authenticated server routes; durable per-user access controls block terminal gateway failures and no automated retry is performed.
- Client-importable server functions live in `src/lib/*.functions.ts`; server-only AI helpers use `.server.ts` modules to keep secrets out of the browser bundle.
- Tournament setup and registration use authenticated transactional SQL functions with tenant validation and audit writes; payment amounts come from the event and only trusted payment confirmation may change unpaid status, preventing client-side financial forgery.
