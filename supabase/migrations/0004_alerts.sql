-- hito · generación diaria de alertas (notificaciones en la app y filas de correo)
-- Corre todos los días a las 07:00 de Bogotá (12:00 UTC). Es idempotente: la clave
-- única `notifications_dedup` evita duplicados si se ejecuta dos veces el mismo día.

create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.alert_when(p_days int) returns text
language sql immutable
as $$
  select case p_days when 0 then 'hoy' when 1 then 'mañana' else 'en ' || p_days || ' días' end
$$;

create or replace function public.generate_alerts(
  p_today date default ((now() at time zone 'America/Bogota')::date)
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer;
begin
  with active_rules as (
    select r.kind, r.days_before, p.id as project_id, p.owner_id, p.name as project_name, p.updated_at
    from public.alert_rules r
    join public.projects p on p.id = r.project_id
    where r.enabled
      and p.archived_at is null
      and p.status not in ('delivered', 'on_hold')
  ),
  cand as (
    -- Fase por vencer
    select ar.owner_id, ar.project_id, ph.id as phase_id, null::uuid as task_id, 'phase_due_soon'::public.alert_kind as kind,
           'La fase "' || ph.name || '" vence ' || public.alert_when(ar.days_before) as title,
           ar.project_name || ' · entrega estimada ' || to_char(ph.estimated_date, 'DD/MM/YYYY') as body
    from active_rules ar
    join public.phases ph on ph.project_id = ar.project_id and ph.status <> 'completed' and ph.estimated_date is not null
    where ar.kind = 'phase_due_soon' and ph.estimated_date - ar.days_before = p_today

    union all
    -- Entrega final
    select ar.owner_id, ar.project_id, null, null, 'final_due'::public.alert_kind,
           case ar.days_before when 0 then 'Hoy es la entrega final' else 'La entrega final es ' || public.alert_when(ar.days_before) end,
           ar.project_name || ' · ' || to_char(f.d, 'DD/MM/YYYY')
    from active_rules ar
    cross join lateral (select max(estimated_date) as d from public.phases where project_id = ar.project_id) f
    where ar.kind = 'final_due' and f.d is not null and f.d - ar.days_before = p_today

    union all
    -- Tarea por vencer
    select ar.owner_id, ar.project_id, t.phase_id, t.id, 'task_due'::public.alert_kind,
           'La tarea "' || t.title || '" vence ' || public.alert_when(ar.days_before),
           ar.project_name
    from active_rules ar
    join public.tasks t on t.project_id = ar.project_id and t.state <> 'done' and t.parent_task_id is null and t.due_date is not null
    where ar.kind = 'task_due' and t.due_date - ar.days_before = p_today

    union all
    -- Proyecto sin cambios
    select ar.owner_id, ar.project_id, null, null, 'stale'::public.alert_kind,
           'Hace ' || ar.days_before || ' días que no hay cambios en este proyecto',
           ar.project_name
    from active_rules ar
    cross join lateral (
      select greatest(
        ar.updated_at,
        (select max(created_at) from public.activity_log where project_id = ar.project_id),
        (select max(updated_at) from public.tasks where project_id = ar.project_id),
        (select max(updated_at) from public.phases where project_id = ar.project_id)
      ) as last_change
    ) lc
    where ar.kind = 'stale' and ar.days_before > 0
      and p_today - (lc.last_change at time zone 'America/Bogota')::date = ar.days_before

    union all
    -- Atrasos (una por proyecto y día)
    select ar.owner_id, ar.project_id, null, null, 'overdue'::public.alert_kind,
           case o.n when 1 then 'Hay 1 fase atrasada' else 'Hay ' || o.n || ' fases atrasadas' end,
           ar.project_name
    from active_rules ar
    cross join lateral (
      select count(*) as n from public.phases
      where project_id = ar.project_id and status <> 'completed' and estimated_date < p_today
    ) o
    where ar.kind = 'overdue' and o.n > 0

    union all
    -- Resumen semanal (lunes)
    select ar.owner_id, ar.project_id, null, null, 'weekly_summary'::public.alert_kind,
           'Resumen semanal · ' || ar.project_name,
           s.this_week || ' fases esta semana · ' || s.late || ' atrasadas · ' || s.blocked || ' tareas bloqueadas'
    from active_rules ar
    cross join lateral (
      select
        (select count(*) from public.phases where project_id = ar.project_id and status <> 'completed'
           and estimated_date between p_today and p_today + 6) as this_week,
        (select count(*) from public.phases where project_id = ar.project_id and status <> 'completed'
           and estimated_date < p_today) as late,
        (select count(*) from public.tasks where project_id = ar.project_id and state = 'blocked' and parent_task_id is null) as blocked
    ) s
    where ar.kind = 'weekly_summary' and extract(isodow from p_today) = 1
      and (s.this_week + s.late + s.blocked) > 0
  )
  insert into public.notifications (owner_id, project_id, phase_id, task_id, kind, title, body, scheduled_for, channel)
  select c.owner_id, c.project_id, c.phase_id, c.task_id, c.kind, c.title, c.body, p_today, ch.channel
  from cand c
  left join public.user_settings us on us.user_id = c.owner_id
  cross join lateral (values ('in_app'), ('email')) as ch(channel)
  where (ch.channel = 'in_app' and coalesce(us.notify_in_app, true))
     or (ch.channel = 'email' and coalesce(us.notify_email, false))
  on conflict on constraint notifications_dedup do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

revoke all on function public.generate_alerts(date) from public, anon, authenticated;
grant execute on function public.generate_alerts(date) to service_role;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'hito-generate-alerts') then
    perform cron.unschedule('hito-generate-alerts');
  end if;
  perform cron.schedule('hito-generate-alerts', '0 12 * * *', 'select public.generate_alerts()');
end
$$;
