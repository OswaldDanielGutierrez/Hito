-- Detalle de un pendiente: secciones con título y notas (generales o dentro de una sección).
-- Reglas: identificadores en inglés, RLS en todas las tablas, owner_id en cada fila.

create table public.quick_task_sections (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  quick_task_id uuid not null references public.quick_tasks(id) on delete cascade,
  title         text not null check (char_length(btrim(title)) between 1 and 80),
  position      int not null default 0,
  created_at    timestamptz not null default now()
);
create index quick_task_sections_task_idx on public.quick_task_sections (quick_task_id, position);

-- section_id null = nota general del pendiente. Al borrar una sección se borran sus notas.
create table public.quick_task_notes (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  quick_task_id uuid not null references public.quick_tasks(id) on delete cascade,
  section_id    uuid references public.quick_task_sections(id) on delete cascade,
  body          text not null check (char_length(btrim(body)) between 1 and 5000),
  position      int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index quick_task_notes_task_idx on public.quick_task_notes (quick_task_id, position);
create index quick_task_notes_section_idx on public.quick_task_notes (section_id);

create trigger quick_task_notes_updated before update on public.quick_task_notes
  for each row execute function public.set_updated_at();
create trigger quick_task_notes_keep_created_at before update on public.quick_task_notes
  for each row execute function public.keep_created_at();

alter table public.quick_task_sections enable row level security;
alter table public.quick_task_notes    enable row level security;

create policy "owner full access" on public.quick_task_sections
  for all to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.quick_tasks q where q.id = quick_task_id and q.owner_id = auth.uid())
  );

-- La sección (si hay) debe ser del mismo pendiente y del mismo dueño.
create policy "owner full access" on public.quick_task_notes
  for all to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.quick_tasks q where q.id = quick_task_id and q.owner_id = auth.uid())
    and (
      section_id is null
      or exists (
        select 1 from public.quick_task_sections s
        where s.id = section_id and s.quick_task_id = quick_task_notes.quick_task_id and s.owner_id = auth.uid()
      )
    )
  );

grant select, insert, update, delete on public.quick_task_sections, public.quick_task_notes to authenticated;
