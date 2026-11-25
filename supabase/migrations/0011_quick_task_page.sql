-- Página de un pendiente: bloc de escritura libre y adjuntos (archivos y enlaces).
-- Las notas importantes usan quick_task_notes (notas generales, section_id nulo).

alter table public.quick_tasks
  add column notepad text not null default '' check (char_length(notepad) <= 50000);

-- Para saber si un pendiente tiene texto sin traer todo el bloc en cada listado.
alter table public.quick_tasks
  add column notepad_length int generated always as (char_length(notepad)) stored;

create table public.quick_task_attachments (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  quick_task_id uuid not null references public.quick_tasks(id) on delete cascade,
  kind          text not null check (kind in ('file', 'link')),
  name          text not null check (char_length(btrim(name)) between 1 and 160),
  url           text,
  storage_path  text,   -- archivos: {user_id}/pendientes/{quick_task_id}/{archivo} en el bucket project-files
  source        text,   -- "Archivo", "SharePoint", "GitHub"…
  created_at    timestamptz not null default now(),
  constraint quick_task_attachments_has_target check (url is not null or storage_path is not null)
);
create index quick_task_attachments_task_idx on public.quick_task_attachments (quick_task_id, created_at);

create trigger quick_task_attachments_keep_created_at before update on public.quick_task_attachments
  for each row execute function public.keep_created_at();

alter table public.quick_task_attachments enable row level security;

create policy "owner full access" on public.quick_task_attachments
  for all to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.quick_tasks q where q.id = quick_task_id and q.owner_id = auth.uid())
  );

grant select, insert, update, delete on public.quick_task_attachments to authenticated;
