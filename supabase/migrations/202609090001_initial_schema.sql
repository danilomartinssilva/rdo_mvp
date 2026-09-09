create type public.user_role as enum ('ADMIN', 'FIELD', 'INSPECTOR');
create type public.rdo_status as enum ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'WITH_NOTES');
create type public.weather_status as enum ('GOOD', 'RAINY', 'IMPRACTICABLE');
create type public.activity_status as enum ('COMPLETED', 'IN_PROGRESS', 'STOPPED');
create type public.occurrence_type as enum ('STOPPAGE', 'ACCIDENT', 'SUPPLY_DELAY', 'TECHNICAL_VISIT', 'OTHER');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role public.user_role not null default 'FIELD',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.projects (
  id uuid primary key default gen_random_uuid(), name text not null, address text not null,
  client_name text not null, start_date date not null, due_date date, technical_lead text,
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.project_users (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.user_role, primary key (project_id, user_id)
);
create table public.rdos (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  date date not null, weather_morning public.weather_status not null, weather_afternoon public.weather_status not null,
  status public.rdo_status not null default 'DRAFT', notes text, created_by uuid not null references public.users(id),
  submitted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(project_id, date)
);
create table public.rdo_labor (id uuid primary key default gen_random_uuid(), rdo_id uuid not null references public.rdos(id) on delete cascade, role_name text not null, quantity integer not null check (quantity > 0), is_outsourced boolean not null default false);
create table public.rdo_equipment (id uuid primary key default gen_random_uuid(), rdo_id uuid not null references public.rdos(id) on delete cascade, type_name text not null, quantity integer not null check (quantity > 0));
create table public.rdo_activities (id uuid primary key default gen_random_uuid(), rdo_id uuid not null references public.rdos(id) on delete cascade, description text not null, status public.activity_status not null default 'IN_PROGRESS');
create table public.rdo_occurrences (id uuid primary key default gen_random_uuid(), rdo_id uuid not null references public.rdos(id) on delete cascade, type public.occurrence_type not null default 'OTHER', description text not null);
create table public.rdo_photos (id uuid primary key default gen_random_uuid(), rdo_id uuid not null references public.rdos(id) on delete cascade, path text not null, caption text, position integer not null default 0);
create table public.rdo_approvals (id uuid primary key default gen_random_uuid(), rdo_id uuid not null references public.rdos(id) on delete cascade, approved_by uuid not null references public.users(id), status public.rdo_status not null check (status in ('APPROVED', 'WITH_NOTES')), comment text, created_at timestamptz not null default now());
create index rdos_project_status_date_idx on public.rdos(project_id, status, date desc);

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.project_users enable row level security;
alter table public.rdos enable row level security;
alter table public.rdo_labor enable row level security;
alter table public.rdo_equipment enable row level security;
alter table public.rdo_activities enable row level security;
alter table public.rdo_occurrences enable row level security;
alter table public.rdo_photos enable row level security;
alter table public.rdo_approvals enable row level security;

create function public.is_project_member(target_project uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.project_users where project_id = target_project and user_id = auth.uid())
  or exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN');
$$;
create policy "members read projects" on public.projects for select using (public.is_project_member(id));
create policy "admins manage projects" on public.projects for all using ((select role from public.users where id = auth.uid()) = 'ADMIN');
create policy "members read memberships" on public.project_users for select using (public.is_project_member(project_id));
create policy "admins manage memberships" on public.project_users for all using ((select role from public.users where id = auth.uid()) = 'ADMIN');
create policy "members read rdos" on public.rdos for select using (public.is_project_member(project_id));
create policy "field creates drafts" on public.rdos for insert with check (public.is_project_member(project_id) and created_by = auth.uid());
create policy "author edits drafts" on public.rdos for update using (created_by = auth.uid() and status in ('DRAFT', 'WITH_NOTES')) with check (created_by = auth.uid() and status in ('DRAFT', 'WITH_NOTES'));
create policy "inspectors decide rdos" on public.rdos for update using (status = 'PENDING_APPROVAL' and public.is_project_member(project_id) and exists (select 1 from public.users where id = auth.uid() and role in ('ADMIN', 'INSPECTOR'))) with check (status in ('APPROVED', 'WITH_NOTES') and public.is_project_member(project_id));
create policy "members read labor" on public.rdo_labor for select using (exists (select 1 from public.rdos where id = rdo_id and public.is_project_member(project_id)));
create policy "members read equipment" on public.rdo_equipment for select using (exists (select 1 from public.rdos where id = rdo_id and public.is_project_member(project_id)));
create policy "members read activities" on public.rdo_activities for select using (exists (select 1 from public.rdos where id = rdo_id and public.is_project_member(project_id)));
create policy "members read occurrences" on public.rdo_occurrences for select using (exists (select 1 from public.rdos where id = rdo_id and public.is_project_member(project_id)));
create policy "members read photos" on public.rdo_photos for select using (exists (select 1 from public.rdos where id = rdo_id and public.is_project_member(project_id)));
create policy "members read approvals" on public.rdo_approvals for select using (exists (select 1 from public.rdos where id = rdo_id and public.is_project_member(project_id)));
create policy "authors manage labor" on public.rdo_labor for all using (exists (select 1 from public.rdos where id = rdo_id and created_by = auth.uid() and status in ('DRAFT', 'WITH_NOTES'))) with check (exists (select 1 from public.rdos where id = rdo_id and created_by = auth.uid() and status in ('DRAFT', 'WITH_NOTES')));
create policy "authors manage equipment" on public.rdo_equipment for all using (exists (select 1 from public.rdos where id = rdo_id and created_by = auth.uid() and status in ('DRAFT', 'WITH_NOTES'))) with check (exists (select 1 from public.rdos where id = rdo_id and created_by = auth.uid() and status in ('DRAFT', 'WITH_NOTES')));
create policy "authors manage activities" on public.rdo_activities for all using (exists (select 1 from public.rdos where id = rdo_id and created_by = auth.uid() and status in ('DRAFT', 'WITH_NOTES'))) with check (exists (select 1 from public.rdos where id = rdo_id and created_by = auth.uid() and status in ('DRAFT', 'WITH_NOTES')));
create policy "authors manage occurrences" on public.rdo_occurrences for all using (exists (select 1 from public.rdos where id = rdo_id and created_by = auth.uid() and status in ('DRAFT', 'WITH_NOTES'))) with check (exists (select 1 from public.rdos where id = rdo_id and created_by = auth.uid() and status in ('DRAFT', 'WITH_NOTES')));
create policy "authors manage photos" on public.rdo_photos for all using (exists (select 1 from public.rdos where id = rdo_id and created_by = auth.uid() and status in ('DRAFT', 'WITH_NOTES'))) with check (exists (select 1 from public.rdos where id = rdo_id and created_by = auth.uid() and status in ('DRAFT', 'WITH_NOTES')));
create policy "inspectors approve rdos" on public.rdo_approvals for insert with check (approved_by = auth.uid() and exists (select 1 from public.users where id = auth.uid() and role in ('ADMIN', 'INSPECTOR')));
create function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger users_updated_at before update on public.users for each row execute procedure public.set_updated_at();
create trigger projects_updated_at before update on public.projects for each row execute procedure public.set_updated_at();
create trigger rdos_updated_at before update on public.rdos for each row execute procedure public.set_updated_at();
insert into storage.buckets (id, name, public) values ('rdo-photos', 'rdo-photos', false);
create policy "members access their project photos" on storage.objects for select using (bucket_id = 'rdo-photos' and public.is_project_member(((storage.foldername(name))[1])::uuid));
