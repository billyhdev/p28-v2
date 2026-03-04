# Supabase migrations

Migrations live in `supabase/migrations/`. Apply via Supabase CLI (`supabase db push` or `supabase migration up`) or via CI.

## Schema overview (as of Story 2.1)

- **organizations** — id, name, created_at, updated_at
- **ministries** — id, organization_id (FK → organizations), name, created_at, updated_at; UNIQUE(organization_id, name)
- **groups** — id, ministry_id (FK → ministries), name, created_at, updated_at; UNIQUE(ministry_id, name)
- **org_members** — PK (user_id, organization_id); user_id, organization_id, role (admin|member), joined_at
- **ministry_leads** — PK (user_id, ministry_id); user_id, ministry_id, assigned_at

Hierarchy: Organization → Ministry → Group.

## RLS (as of Story 2.2)

- **00006–00007:** Authenticated read (SELECT) on organizations, ministries, groups, org_members, ministry_leads.
- **00008:** Authenticated INSERT and UPDATE on organizations, ministries, groups. Story 2.3 (admin UI) will restrict to admin role.

`updated_at` on org/ministry/group is app-maintained (no trigger).
