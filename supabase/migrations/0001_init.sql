-- hito · migración inicial
-- Reglas: identificadores en inglés, RLS en todas las tablas, owner_id en cada fila.

create extension if not exists pgcrypto;

-- ───────────── Enums ─────────────
create type public.project_status as enum ('development', 'qa', 'production', 'delivered', 'on_hold');
create type public.phase_status   as enum ('pending', 'in_progress', 'completed');
create type public.task_state     as enum ('pending', 'in_progress', 'done', 'blocked');
create type public.task_priority  as enum ('high', 'medium', 'low');
create type public.resource_kind  as enum ('document', 'flow', 'code', 'link');
create type public.change_kind    as enum ('status', 'date', 'task', 'phase', 'scope');
create type public.alert_kind     as enum ('phase_due_soon', 'final_due', 'task_due', 'stale', 'overdue', 'weekly_summary');

-- ───────────── Tablas ─────────────
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  area        text,
  description text,
  responsible text,
  status      public.project_status not null default 'development',
  start_date  date,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.phases (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id     uuid not null references public.projects(id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 80),
  position       int  not null,
  estimated_date date,                 -- entrega estimada vigente
  original_date  date,                 -- plan original (se fija sola la primera vez)
  completed_at   date,
  status         public.phase_status not null default 'pending',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint phases_position_unique unique (project_id, position) deferrable initially deferred
);

create table public.tasks (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id      uuid not null references public.projects(id) on delete cascade,
  phase_id        uuid not null references public.phases(id) on delete cascade,
  parent_task_id  uuid references public.tasks(id) on delete cascade,   -- subtareas (UI en v2)
  title           text not null check (char_length(title) between 1 and 200),
  description     text,
  state           public.task_state not null default 'pending',
  priority        public.task_priority not null default 'medium',
  due_date        date,
  estimated_hours numeric(5,1) check (estimated_hours is null or estimated_hours >= 0),
  blocked_reason  text,
  position        int not null default 0,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.resources (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id   uuid not null references public.projects(id) on delete cascade,
  phase_id     uuid references public.phases(id) on delete set null,
  kind         public.resource_kind not null,
  name         text not null check (char_length(name) between 1 and 160),
  url          text,
  source       text,                   -- "SharePoint", "GitHub", "Power Automate"...
  storage_path text,                   -- si es un archivo subido: {user_id}/{project_id}/{archivo}
  pinned       boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint resources_has_target check (url is not null or storage_path is not null)
);

create table public.task_resources (
  task_id     uuid not null references public.tasks(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  primary key (task_id, resource_id)
);

create table public.project_notes (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  body       text not null,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create table public.project_contacts (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name       text not null,
  role       text,
  detail     text,
  created_at timestamptz not null default now()
);

create table public.activity_log (
  id          bigint generated always as identity primary key,
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id  uuid not null references public.projects(id) on delete cascade,
  kind        public.change_kind not null,
  entity_type text,                    -- 'project' | 'phase' | 'task'
  entity_id   uuid,
  summary     text not null,           -- "Estado cambiado", "Entrega movida"...
  old_value   text,
  new_value   text,
  reason      text,
  created_at  timestamptz not null default now()
);

-- owner_id null = plantilla del sistema (visible para todos)
create table public.phase_templates (
  id       uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid() references auth.users(id) on delete cascade,
  name     text not null,
  phases   jsonb not null              -- [{ "name": "...", "offset_days": 7 }]
);

create table public.alert_rules (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id  uuid references public.projects(id) on delete cascade,   -- null = regla global
  kind        public.alert_kind not null,
  days_before int not null default 0 check (days_before >= 0),
  send_time   time not null default '09:00',
  enabled     boolean not null default true
);

create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id    uuid references public.projects(id) on delete cascade,
  phase_id      uuid references public.phases(id) on delete cascade,
  task_id       uuid references public.tasks(id) on delete cascade,
  kind          public.alert_kind not null,
  title         text not null,
  body          text,
  scheduled_for date not null,
  channel       text not null check (channel in ('in_app', 'email')),
  sent_at       timestamptz,
  read_at       timestamptz,
  created_at    timestamptz not null default now(),
  constraint notifications_dedup
    unique nulls not distinct (owner_id, kind, project_id, phase_id, task_id, scheduled_for, channel)
);

create table public.user_settings (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  timezone      text not null default 'America/Bogota',
  notify_in_app boolean not null default true,
  notify_email  boolean not null default true,
  email_address text,
  notify_teams  boolean not null default false     -- v2; el webhook va como secreto, no aquí
);

-- ───────────── Índices ─────────────
create index phases_project_idx        on public.phases (project_id, position);
create index tasks_project_idx         on public.tasks (project_id);
create index tasks_phase_idx           on public.tasks (phase_id, position);
create index tasks_due_idx             on public.tasks (due_date) where state <> 'done';
create index resources_project_idx     on public.resources (project_id);
create index activity_project_idx      on public.activity_log (project_id, created_at desc);
create index alert_rules_project_idx   on public.alert_rules (project_id);
create index notifications_unread_idx  on public.notifications (owner_id, created_at desc) where read_at is null;

-- ───────────── Triggers ─────────────
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger projects_updated  before update on public.projects  for each row execute function public.set_updated_at();
create trigger phases_updated    before update on public.phases    for each row execute function public.set_updated_at();
create trigger tasks_updated     before update on public.tasks     for each row execute function public.set_updated_at();
create trigger resources_updated before update on public.resources for each row execute function public.set_updated_at();

create or replace function public.set_original_date() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.original_date is null then
    new.original_date := new.estimated_date;
  end if;
  return new;
end $$;

create trigger phases_original_date before insert or update on public.phases
  for each row execute function public.set_original_date();

create or replace function public.set_task_completed_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.state = 'done' and (tg_op = 'INSERT' or old.state is distinct from 'done') then
    new.completed_at := now();
  elsif new.state <> 'done' then
    new.completed_at := null;
  end if;
  return new;
end $$;

create trigger tasks_completed_at before insert or update on public.tasks
  for each row execute function public.set_task_completed_at();

-- ───────────── RLS ─────────────
do $$
declare t text;
begin
  foreach t in array array[
    'projects', 'phases', 'tasks', 'resources', 'task_resources',
    'project_notes', 'project_contacts', 'activity_log', 'alert_rules', 'notifications'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "owner full access" on public.%I for all to authenticated
         using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', t);
  end loop;
end $$;

alter table public.user_settings enable row level security;
create policy "owner full access" on public.user_settings for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter table public.phase_templates enable row level security;
create policy "read own and system templates" on public.phase_templates for select to authenticated
  using (owner_id is null or owner_id = (select auth.uid()));
create policy "insert own templates" on public.phase_templates for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "update own templates" on public.phase_templates for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "delete own templates" on public.phase_templates for delete to authenticated
  using (owner_id = (select auth.uid()));

-- ───────────── Vista del portafolio ─────────────
-- La salud (al día / en riesgo / atrasado / detenido) se calcula en src/lib/domain, no aquí.
create view public.project_overview with (security_invoker = true) as
select
  p.id as project_id,
  p.owner_id,
  p.name,
  p.area,
  p.status,
  p.start_date,
  p.updated_at,
  (select max(ph.estimated_date) from public.phases ph where ph.project_id = p.id) as final_due_date,
  (select count(*) from public.phases ph where ph.project_id = p.id) as phases_total,
  (select count(*) from public.phases ph where ph.project_id = p.id and ph.status = 'completed') as phases_done,
  (select ph.id from public.phases ph
     where ph.project_id = p.id and ph.status <> 'completed'
     order by ph.position limit 1) as current_phase_id,
  (select count(*) from public.tasks t where t.project_id = p.id and t.parent_task_id is null) as tasks_total,
  (select count(*) from public.tasks t where t.project_id = p.id and t.parent_task_id is null and t.state = 'done') as tasks_done,
  (select count(*) from public.resources r where r.project_id = p.id and r.kind = 'document') as resources_documents,
  (select count(*) from public.resources r where r.project_id = p.id and r.kind in ('flow', 'code')) as resources_flows_code,
  (select count(*) from public.resources r where r.project_id = p.id and r.kind = 'link') as resources_links
from public.projects p
where p.archived_at is null;

-- ───────────── Plantillas del sistema ─────────────
-- offset_days se suma a la fecha de inicio del proyecto.
insert into public.phase_templates (owner_id, name, phases) values
  (null, 'Agente de IA', '[
    {"name":"Levantamiento","offset_days":7},
    {"name":"Diseño de flujos","offset_days":14},
    {"name":"Desarrollo","offset_days":28},
    {"name":"QA","offset_days":56},
    {"name":"Producción","offset_days":63}
  ]'::jsonb),
  (null, 'Automatización de flujos', '[
    {"name":"Levantamiento","offset_days":5},
    {"name":"Desarrollo","offset_days":19},
    {"name":"Pruebas con usuarios","offset_days":26},
    {"name":"Producción","offset_days":28}
  ]'::jsonb),
  (null, 'App (bajo código o web)', '[
    {"name":"Levantamiento","offset_days":7},
    {"name":"Diseño de pantallas","offset_days":14},
    {"name":"Desarrollo","offset_days":33},
    {"name":"QA","offset_days":54},
    {"name":"Capacitación","offset_days":61},
    {"name":"Producción","offset_days":63}
  ]'::jsonb);

-- ───────────── Storage (archivos de recursos) ─────────────
-- Ruta: {user_id}/{project_id}/{archivo}
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

create policy "project-files select own" on storage.objects for select to authenticated
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "project-files insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'project-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "project-files update own" on storage.objects for update to authenticated
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "project-files delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
