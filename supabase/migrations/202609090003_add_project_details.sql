alter table public.projects
  add column if not exists description text,
  add column if not exists logo_path text,
  add column if not exists postal_code text,
  add column if not exists street text,
  add column if not exists address_number text,
  add column if not exists complement text,
  add column if not exists district text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

insert into storage.buckets (id, name, public)
values ('project-logos', 'project-logos', true)
on conflict (id) do nothing;

create policy "admins manage project logos"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'project-logos'
  and public.is_project_member(((storage.foldername(name))[1])::uuid)
  and exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
)
with check (
  bucket_id = 'project-logos'
  and public.is_project_member(((storage.foldername(name))[1])::uuid)
  and exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN')
);
