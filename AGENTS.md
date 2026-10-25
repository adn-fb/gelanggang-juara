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
