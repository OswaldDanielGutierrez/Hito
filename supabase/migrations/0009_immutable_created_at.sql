-- La fecha de creación de proyectos y pendientes no se puede modificar.
-- Cualquier UPDATE conserva el created_at original, sin importar lo que envíe el cliente.

create or replace function public.keep_created_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger projects_keep_created_at
  before update on public.projects
  for each row execute function public.keep_created_at();

create trigger quick_tasks_keep_created_at
  before update on public.quick_tasks
  for each row execute function public.keep_created_at();
