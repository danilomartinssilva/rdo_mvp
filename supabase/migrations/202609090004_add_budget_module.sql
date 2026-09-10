create type public.input_type as enum ('MATERIAL', 'LABOR', 'EQUIPMENT');
create type public.budget_status as enum ('DRAFT', 'ISSUED', 'APPROVED', 'REJECTED');

create table public.clients (
  id uuid primary key default gen_random_uuid(), name text not null, document text, email text, phone text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.projects add column if not exists client_id uuid references public.clients(id) on delete set null;

create table public.inputs (
  id uuid primary key default gen_random_uuid(), code text, name text not null, type public.input_type not null,
  unit text not null, unit_price numeric(14,4) not null default 0, source text not null default 'OWN', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.compositions (
  id uuid primary key default gen_random_uuid(), code text, name text not null, unit text not null, source text not null default 'OWN', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.composition_inputs (
  composition_id uuid not null references public.compositions(id) on delete cascade,
  input_id uuid not null references public.inputs(id), coefficient numeric(14,6) not null check (coefficient > 0), primary key (composition_id, input_id)
);
create table public.budgets (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  version integer not null default 1, status public.budget_status not null default 'DRAFT', title text not null,
  bdi_percent numeric(7,4) not null default 0 check (bdi_percent >= 0), created_by uuid not null references public.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(project_id, version)
);
create table public.wbs_nodes (
  id uuid primary key default gen_random_uuid(), budget_id uuid not null references public.budgets(id) on delete cascade,
  parent_id uuid references public.wbs_nodes(id) on delete cascade, code text not null, name text not null, sort_order integer not null default 0
);
create table public.budget_items (
  id uuid primary key default gen_random_uuid(), wbs_node_id uuid not null references public.wbs_nodes(id) on delete cascade,
  composition_id uuid references public.compositions(id), description text not null, unit text not null, quantity numeric(14,4) not null default 0, unit_cost numeric(14,4) not null default 0
);

alter table public.clients enable row level security;
alter table public.inputs enable row level security;
alter table public.compositions enable row level security;
alter table public.composition_inputs enable row level security;
alter table public.budgets enable row level security;
alter table public.wbs_nodes enable row level security;
alter table public.budget_items enable row level security;
create policy "admins manage clients" on public.clients for all using (exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN'));
create policy "members read inputs" on public.inputs for select using (auth.uid() is not null);
create policy "admins manage inputs" on public.inputs for all using (exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN'));
create policy "members read compositions" on public.compositions for select using (auth.uid() is not null);
create policy "admins manage compositions" on public.compositions for all using (exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN'));
create policy "members read composition inputs" on public.composition_inputs for select using (auth.uid() is not null);
create policy "admins manage composition inputs" on public.composition_inputs for all using (exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN'));
create policy "members access budgets" on public.budgets for select using (public.is_project_member(project_id));
create policy "authors manage budgets" on public.budgets for all using (public.is_project_member(project_id) and created_by = auth.uid()) with check (public.is_project_member(project_id) and created_by = auth.uid());
create policy "members access wbs" on public.wbs_nodes for all using (exists (select 1 from public.budgets where id = budget_id and public.is_project_member(project_id))) with check (exists (select 1 from public.budgets where id = budget_id and public.is_project_member(project_id)));
create policy "members access budget items" on public.budget_items for all using (exists (select 1 from public.wbs_nodes join public.budgets on budgets.id = wbs_nodes.budget_id where wbs_nodes.id = wbs_node_id and public.is_project_member(budgets.project_id))) with check (exists (select 1 from public.wbs_nodes join public.budgets on budgets.id = wbs_nodes.budget_id where wbs_nodes.id = wbs_node_id and public.is_project_member(budgets.project_id)));
create trigger clients_updated_at before update on public.clients for each row execute procedure public.set_updated_at();
create trigger inputs_updated_at before update on public.inputs for each row execute procedure public.set_updated_at();
create trigger compositions_updated_at before update on public.compositions for each row execute procedure public.set_updated_at();
create trigger budgets_updated_at before update on public.budgets for each row execute procedure public.set_updated_at();
