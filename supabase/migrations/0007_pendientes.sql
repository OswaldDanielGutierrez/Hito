-- 0007 · Pendientes (tareas sueltas del día). Ver docs/05-pendientes.md
create table public.quick_tasks (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 200),
  project_id   uuid references public.projects(id) on delete set null,
  requested_by text not null default 'Yo' check (char_length(requested_by) between 1 and 80),
  due_date     date,                                    -- null = sin fecha
  priority     public.task_priority not null default 'medium',  -- la UI usa solo high y medium
  done         boolean not null default false,
  done_at      timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index quick_tasks_owner_idx     on public.quick_tasks (owner_id, done, due_date);
create index quick_tasks_project_idx   on public.quick_tasks (project_id);
create index quick_tasks_requester_idx on public.quick_tasks (owner_id, requested_by);

create or replace function public.set_quick_task_done_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.done then
      new.done_at := now();
    end if;
  elsif new.done and not old.done then
    new.done_at := now();
  elsif not new.done then
    new.done_at := null;
  end if;
  return new;
end $$;

create trigger quick_tasks_done_at before insert or update on public.quick_tasks
  for each row execute function public.set_quick_task_done_at();
create trigger quick_tasks_updated before update on public.quick_tasks
  for each row execute function public.set_updated_at();

alter table public.quick_tasks enable row level security;
create policy "owner full access" on public.quick_tasks for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
