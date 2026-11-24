-- Etiquetas para proyectos y pendientes (ej.: Power Apps, Power Automate).
-- Reglas: identificadores en inglés, RLS en todas las tablas, owner_id en cada fila.

create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name       text not null check (char_length(btrim(name)) between 1 and 30),
  color      text not null default 'green'
             check (color in ('green', 'blue', 'amber', 'red', 'purple', 'teal', 'pink', 'gray')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Una etiqueta por nombre (sin distinguir mayúsculas ni espacios sobrantes).
create unique index tags_owner_name_key on public.tags (owner_id, lower(btrim(name)));

create table public.project_tags (
  project_id uuid not null references public.projects(id) on delete cascade,
  tag_id     uuid not null references public.tags(id) on delete cascade,
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  primary key (project_id, tag_id)
);
create index project_tags_tag_idx on public.project_tags (tag_id);

create table public.quick_task_tags (
  quick_task_id uuid not null references public.quick_tasks(id) on delete cascade,
  tag_id        uuid not null references public.tags(id) on delete cascade,
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  primary key (quick_task_id, tag_id)
);
create index quick_task_tags_tag_idx on public.quick_task_tags (tag_id);

create trigger tags_updated before update on public.tags
  for each row execute function public.set_updated_at();

-- RLS: cada fila es de su dueño; las asignaciones solo pueden unir cosas del mismo dueño.
alter table public.tags            enable row level security;
alter table public.project_tags    enable row level security;
alter table public.quick_task_tags enable row level security;

create policy "owner full access" on public.tags
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "owner full access" on public.project_tags
  for all to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.tags t where t.id = tag_id and t.owner_id = auth.uid())
    and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
  );

create policy "owner full access" on public.quick_task_tags
  for all to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.tags t where t.id = tag_id and t.owner_id = auth.uid())
    and exists (select 1 from public.quick_tasks q where q.id = quick_task_id and q.owner_id = auth.uid())
  );

grant select, insert, update, delete on public.tags, public.project_tags, public.quick_task_tags to authenticated;
