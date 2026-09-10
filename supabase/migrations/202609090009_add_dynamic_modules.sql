create table public.modules (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, description text, route text not null, icon text, is_active boolean not null default true, sort_order integer not null default 0, created_at timestamptz not null default now());
insert into public.modules (code,name,description,route,icon,sort_order) values ('RDO','RDO Digital','Relatórios diários de obra','/rdo','ClipboardList',10),('BUDGET','Orçamentos','Custos, EAP e propostas comerciais','/orcamentos','Calculator',20);
alter table public.user_module_access add column module_id uuid references public.modules(id) on delete cascade;
update public.user_module_access access set module_id = modules.id from public.modules where modules.code = access.module;
alter table public.user_module_access alter column module_id set not null;
alter table public.user_module_access drop constraint user_module_access_pkey;
alter table public.user_module_access drop column module;
alter table public.user_module_access add primary key (user_id,module_id);
insert into public.user_module_access (user_id,module_id)
select users.id, modules.id from public.users cross join public.modules where modules.code = 'RDO'
on conflict (user_id,module_id) do nothing;
alter table public.modules enable row level security;
create policy "users read allowed modules" on public.modules for select using (is_active and (exists(select 1 from public.users where id=auth.uid() and role='ADMIN') or exists(select 1 from public.user_module_access where module_id=modules.id and user_id=auth.uid())));
create policy "admins manage modules" on public.modules for all using (exists(select 1 from public.users where id=auth.uid() and role='ADMIN')) with check (exists(select 1 from public.users where id=auth.uid() and role='ADMIN'));
create or replace function public.has_module_access(module_code text) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.users where id=auth.uid() and role='ADMIN') or exists(select 1 from public.user_module_access access join public.modules on modules.id=access.module_id where access.user_id=auth.uid() and modules.code=module_code and modules.is_active); $$;
create or replace function public.has_budget_access() returns boolean language sql stable security definer set search_path=public as $$ select public.has_module_access('BUDGET'); $$;
