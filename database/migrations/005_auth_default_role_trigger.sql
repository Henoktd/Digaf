-- Run this in the Supabase SQL Editor for this project (NOT against the app's
-- local DATABASE_URL — auth.users lives in Supabase's own Postgres instance).
--
-- Background: Supabase's dashboard "Add user" form only sets user_metadata,
-- never app_metadata. apps/api/src/middleware/requireAuth.ts requires
-- app_metadata.role to be one of: maker, checker_1, checker_2,
-- governance_admin, compliance_officer, viewer. Without it, every API call
-- 403s and the web app shows "Failed to load <page>" errors, even though the
-- sidebar may cosmetically show "viewer" (see apps/web/src/components/AppShell.tsx).
--
-- This migration:
--   1. Backfills any existing users missing a role with the lowest-privilege
--      default ("viewer").
--   2. Installs a trigger so every future user created in Supabase Auth
--      (dashboard, invite, or self-signup) automatically gets
--      app_metadata.role = "viewer" if not already set.
--
-- To grant someone elevated access after this runs, update just their row:
--   update auth.users
--   set raw_app_meta_data = raw_app_meta_data || '{"role": "governance_admin"}'::jsonb
--   where email = 'someone@digaf.com';

-- 1. Backfill existing users.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "viewer"}'::jsonb
where raw_app_meta_data->>'role' is null;

-- 2. Auto-default role on user creation.
create or replace function public.set_default_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.raw_app_meta_data is null or NEW.raw_app_meta_data->>'role' is null then
    NEW.raw_app_meta_data = coalesce(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "viewer"}'::jsonb;
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_auth_user_created_set_role on auth.users;

create trigger on_auth_user_created_set_role
  before insert on auth.users
  for each row
  execute function public.set_default_user_role();
