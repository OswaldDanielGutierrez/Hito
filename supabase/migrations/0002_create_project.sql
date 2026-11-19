-- hito · crear proyecto en una sola transacción
-- security invoker: corre con los permisos de quien llama, así RLS sigue aplicando
-- y owner_id toma su valor por defecto (auth.uid()).

create or replace function public.create_project(
  p_name         text,
  p_area         text,
  p_description  text,
  p_responsible  text,
  p_start_date   date,
  p_phases       jsonb,                      -- [{ "name": "...", "date": "2026-12-01" }]
  p_resources    jsonb default '[]'::jsonb,  -- [{ "kind": "link", "name": "...", "url": "...", "source": "..." }]
  p_notify_phase boolean default true        -- "Avisarme 2 días antes de cada fase"
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id       uuid;
  v_phase    jsonb;
  v_resource jsonb;
  v_position int := 0;
begin
  if jsonb_typeof(p_phases) is distinct from 'array' or jsonb_array_length(p_phases) = 0 then
    raise exception 'El proyecto necesita al menos una fase';
  end if;

  insert into public.projects (name, area, description, responsible, start_date)
  values (p_name, nullif(p_area, ''), nullif(p_description, ''), nullif(p_responsible, ''), p_start_date)
  returning id into v_id;

  for v_phase in select value from jsonb_array_elements(p_phases) loop
    v_position := v_position + 1;
    insert into public.phases (project_id, name, position, status, estimated_date, original_date)
    values (
      v_id,
      v_phase ->> 'name',
      v_position,
      case when v_position = 1 then 'in_progress'::public.phase_status else 'pending'::public.phase_status end,
      (v_phase ->> 'date')::date,
      (v_phase ->> 'date')::date
    );
  end loop;

  for v_resource in select value from jsonb_array_elements(coalesce(p_resources, '[]'::jsonb)) loop
    insert into public.resources (project_id, kind, name, url, source)
    values (
      v_id,
      (v_resource ->> 'kind')::public.resource_kind,
      v_resource ->> 'name',
      v_resource ->> 'url',
      nullif(v_resource ->> 'source', '')
    );
  end loop;

  insert into public.alert_rules (project_id, kind, days_before, send_time, enabled) values
    (v_id, 'phase_due_soon', 2, '09:00', p_notify_phase),
    (v_id, 'final_due',      3, '09:00', true),
    (v_id, 'final_due',      1, '09:00', true),
    (v_id, 'final_due',      0, '08:00', true),
    (v_id, 'task_due',       1, '09:00', true),
    (v_id, 'stale',          5, '09:00', true),
    (v_id, 'overdue',        0, '09:00', true),
    (v_id, 'weekly_summary', 0, '07:30', true);

  insert into public.activity_log (project_id, kind, entity_type, entity_id, summary, new_value)
  values (v_id, 'scope', 'project', v_id, 'Proyecto creado', p_name);

  return v_id;
end;
$$;

revoke all on function public.create_project(text, text, text, text, date, jsonb, jsonb, boolean) from public, anon;
grant execute on function public.create_project(text, text, text, text, date, jsonb, jsonb, boolean) to authenticated;
