# Supabase migrations

Migrations live in `supabase/migrations/`. Apply via Supabase CLI (`supabase db push` or `supabase migration up`) or via CI.

## Schema overview (as of Story 2.1)

- **organizations** — id, name, created_at, updated_at
- **ministries** — id, organization_id (FK → organizations), name, created_at, updated_at; UNIQUE(organization_id, name)
- **groups** — id, ministry_id (FK → ministries), name, created_at, updated_at; UNIQUE(ministry_id, name)
- **org_members** — PK (user_id, organization_id); user_id, organization_id, role (admin|member), joined_at
- **ministry_leads** — PK (user_id, ministry_id); user_id, ministry_id, assigned_at

Hierarchy: Organization → Ministry → Group. RLS: placeholder policies (authenticated read); scoped access in Story 2.2. `updated_at` on org/ministry/group is app-maintained (no trigger).
