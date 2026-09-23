-- Phase 4: admin authorization for the dashboard.
--
-- The admin dashboard is a client-side SPA (static export) that authenticates
-- with Supabase Auth (email/password) and calls the Supabase REST API with
-- the user's JWT. These policies grant full read/write on every portfolio
-- table ONLY when the JWT email matches the site owner's admin email.
-- Anonymous users keep only the public read policies from 0001.
-- Public email sign-ups should be DISABLED in the Supabase dashboard so no
-- one else can obtain an authenticated JWT.

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((auth.jwt() ->> 'email') = 'shahzaibhasnain.it@gmail.com', false);
$$;

grant execute on function public.is_admin() to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'ai_project_drafts',
    'certifications',
    'education',
    'experience',
    'github_repositories',
    'projects',
    'settings',
    'skills',
    'social_links',
    'sync_logs',
    'users'
  ]
  loop
    execute format('drop policy if exists "admin_full_access" on public.%I', t);
    execute format(
      'create policy "admin_full_access" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t
    );
  end loop;
end $$;

-- Record the admin in the portfolio users table (idempotent).
insert into public.users (email)
values ('shahzaibhasnain.it@gmail.com')
on conflict (email) do nothing;
