-- hito · mover una fase arriba o abajo intercambiando posiciones en una sola transacción
-- (la restricción única de posición es diferible, por eso el intercambio es seguro aquí).

create or replace function public.move_phase(p_phase_id uuid, p_direction text) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_phase record;
  v_other record;
begin
  if p_direction not in ('up', 'down') then
    raise exception 'Dirección no válida';
  end if;

  select id, project_id, position into v_phase from public.phases where id = p_phase_id;
  if not found then
    raise exception 'No se encontró la fase';
  end if;

  if p_direction = 'up' then
    select id, position into v_other from public.phases
    where project_id = v_phase.project_id and position < v_phase.position
    order by position desc limit 1;
  else
    select id, position into v_other from public.phases
    where project_id = v_phase.project_id and position > v_phase.position
    order by position asc limit 1;
  end if;
  if not found then
    return;
  end if;

  update public.phases set position = v_other.position where id = v_phase.id;
  update public.phases set position = v_phase.position where id = v_other.id;
end;
$$;

revoke all on function public.move_phase(uuid, text) from public, anon;
grant execute on function public.move_phase(uuid, text) to authenticated;
