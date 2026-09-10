drop policy if exists "admins manage clients" on public.clients;
create policy "commercial manage clients"
on public.clients for all
using (exists (select 1 from public.users where id = auth.uid() and role in ('ADMIN', 'COMMERCIAL')))
with check (exists (select 1 from public.users where id = auth.uid() and role in ('ADMIN', 'COMMERCIAL')));

drop policy if exists "admins manage inputs" on public.inputs;
drop policy if exists "admins manage compositions" on public.compositions;
drop policy if exists "admins manage composition inputs" on public.composition_inputs;
create policy "commercial manage inputs" on public.inputs for all using (exists (select 1 from public.users where id = auth.uid() and role in ('ADMIN', 'COMMERCIAL'))) with check (exists (select 1 from public.users where id = auth.uid() and role in ('ADMIN', 'COMMERCIAL')));
create policy "commercial manage compositions" on public.compositions for all using (exists (select 1 from public.users where id = auth.uid() and role in ('ADMIN', 'COMMERCIAL'))) with check (exists (select 1 from public.users where id = auth.uid() and role in ('ADMIN', 'COMMERCIAL')));
create policy "commercial manage composition inputs" on public.composition_inputs for all using (exists (select 1 from public.users where id = auth.uid() and role in ('ADMIN', 'COMMERCIAL'))) with check (exists (select 1 from public.users where id = auth.uid() and role in ('ADMIN', 'COMMERCIAL')));

drop policy if exists "admins manage projects" on public.projects;
create policy "commercial manage projects" on public.projects for all
using (exists (select 1 from public.users where id = auth.uid() and role in ('ADMIN', 'COMMERCIAL')))
with check (exists (select 1 from public.users where id = auth.uid() and role in ('ADMIN', 'COMMERCIAL')));

create or replace function public.assign_project_creator()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.project_users (project_id, user_id, role)
  select new.id, auth.uid(), role from public.users where id = auth.uid()
  on conflict (project_id, user_id) do nothing;
  return new;
end;
$$;
create trigger projects_assign_creator after insert on public.projects for each row execute procedure public.assign_project_creator();
