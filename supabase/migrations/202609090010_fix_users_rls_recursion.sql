create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

drop policy if exists "admins read users" on public.users;
drop policy if exists "users read own profile" on public.users;
create policy "users read own profile"
on public.users for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "users read own modules" on public.user_module_access;
drop policy if exists "admins manage modules" on public.user_module_access;
create policy "users read own modules"
on public.user_module_access for select
using (user_id = auth.uid() or public.is_admin());
create policy "admins manage modules"
on public.user_module_access for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "users read allowed modules" on public.modules;
drop policy if exists "admins manage modules" on public.modules;
create policy "users read allowed modules"
on public.modules for select
using (
  is_active and (
    public.is_admin()
    or exists (select 1 from public.user_module_access where module_id = modules.id and user_id = auth.uid())
  )
);
create policy "admins manage modules"
on public.modules for all
using (public.is_admin())
with check (public.is_admin());
